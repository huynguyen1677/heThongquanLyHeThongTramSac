import { WebSocketServer } from 'ws';
import { parse } from 'url';
import { logger } from '../utils/logger.js';
import { OCPP } from '../domain/constants.js';
import { validateOcppMessage, validateByAction } from './schemas.js';
import { sessions } from './sessions.js';
import { generateUID } from '../utils/uid.js';
import { getTimestamp } from '../utils/time.js';
import { connectorService } from '../services/connectorService.js';
import { syncService } from '../services/syncService.js';
import { realtimeService } from '../services/realtime.js';

export class OcppWebSocketServer {
  constructor(options = {}) {
    this.port = options.port || 3001;
    this.wss = null;
    this.clients = new Map(); // stationId -> WebSocket
  }

  start() {
    try {
      logger.info(`Attempting to create WebSocket server on port ${this.port}...`);
      
      this.wss = new WebSocketServer({
        port: this.port,
        perMessageDeflate: false
      });

      this.wss.on('listening', () => {
        logger.info(`✅ WebSocket server is now listening on port ${this.port}`);
        const address = this.wss.address();
        logger.info(`Address info:`, address);
      });

      this.wss.on('connection', this.handleConnection.bind(this));
      
      this.wss.on('error', (error) => {
        logger.error('❌ WebSocket Server Error:', error);
      });
      
      logger.info(`OCPP WebSocket Server started on port ${this.port}`);
    } catch (error) {
      logger.error('❌ Failed to start WebSocket server:', error);
      throw error;
    }
  }

  handleConnection(ws, request) {
    logger.info('🔌 New WebSocket connection attempt:', {
      url: request.url,
      method: request.method,
      headers: request.headers
    });
    
    const url = parse(request.url, true);
    logger.info('📋 Parsed URL:', {
      pathname: url.pathname,
      query: url.query
    });
    
    // Try to get stationId from query parameter first, then from path
    let stationId = url.query.stationId || url.pathname.split('/').pop();
    logger.info('🏷️  Station ID extracted:', stationId);

    if (!stationId || stationId === 'ocpp' || stationId === '') {
      logger.warn('❌ Connection rejected: No station ID provided', {
        url: request.url,
        pathname: url.pathname,
        query: url.query,
        extractedStationId: stationId
      });
      ws.close(1008, 'Station ID required');
      return;
    }

    logger.info(`✅ Accepting connection from station: ${stationId}`);
    
    // Store client connection
    this.clients.set(stationId, ws);
    
    // Initialize session
    sessions.createStation(stationId, ws);

    // Setup message handlers
    ws.on('message', (data) => {
      this.handleMessage(stationId, data).catch(error => {
        logger.error(`Error handling message from ${stationId}:`, error);
      });
    });
    ws.on('close', (code, reason) => {
      logger.info(`Station ${stationId} disconnected: code=${code}, reason='${reason}'`);
      this.handleDisconnection(stationId);
    });
    ws.on('error', (error) => {
      logger.error(`WebSocket error for station ${stationId}:`, error);
      this.handleError(stationId, error);
    });

    // Don't send unsolicited responses - wait for actual BootNotification
    // this.sendBootNotificationResponse(ws);
  }

  async handleMessage(stationId, data) {
    try {
      const message = JSON.parse(data.toString());
      logger.info(`Received from ${stationId}:`, message);
      logger.info(`Message type: ${typeof message}, isArray: ${Array.isArray(message)}`);
      
      if (Array.isArray(message)) {
        logger.info(`Array elements: [${message.map((item, index) => `${index}: ${typeof item} = ${JSON.stringify(item)}`).join(', ')}]`);
      }

      // Validate OCPP message format
      const validation = validateOcppMessage(message);
      if (!validation.success) {
        logger.error(`Invalid OCPP message from ${stationId}:`, validation.error);
        this.sendCallError(stationId, message[1], 'FormatViolation', 'Invalid message format');
        return;
      }

      const [messageType, messageId, action, payload] = message;

      switch (messageType) {
        case OCPP.MESSAGE_TYPE.CALL:
          await this.handleCall(stationId, messageId, action, payload);
          break;
        case OCPP.MESSAGE_TYPE.CALLRESULT:
          this.handleCallResult(stationId, messageId, payload);
          break;
        case OCPP.MESSAGE_TYPE.CALLERROR:
          this.handleCallError(stationId, messageId, action, payload);
          break;
        default:
          logger.error(`Unknown message type: ${messageType}`);
      }
    } catch (error) {
      logger.error(`Error handling message from ${stationId}:`, error);
    }
  }

  async handleCall(stationId, messageId, action, payload) {
    logger.info(`CALL from ${stationId}: ${action}`);

    // Validate payload based on action
    const validation = validateByAction(action, payload, true);
    if (!validation.success) {
      logger.error(`Invalid payload for ${action}:`, validation.error);
      this.sendCallError(stationId, messageId, 'TypeConstraintViolation', validation.error.message);
      return;
    }

    // Route to appropriate handler
    switch (action) {
      case 'BootNotification':
        await this.handleBootNotification(stationId, messageId, payload);
        break;
      case 'Heartbeat':
        this.handleHeartbeat(stationId, messageId, payload);
        break;
      case 'StatusNotification':
        this.handleStatusNotification(stationId, messageId, payload);
        break;
      case 'Authorize':
        this.handleAuthorize(stationId, messageId, payload);
        break;
      case 'StartTransaction':
        await this.handleStartTransaction(stationId, messageId, payload);
        break;
      case 'StopTransaction':
        await this.handleStopTransaction(stationId, messageId, payload);
        break;
      case 'MeterValues':
        this.handleMeterValues(stationId, messageId, payload);
        break;
      case 'DataTransfer':
        await this.handleDataTransfer(stationId, messageId, payload);
        break;
      default:
        this.sendCallError(stationId, messageId, 'NotSupported', `Action ${action} not supported`);
    }
  }

  handleCallResult(stationId, messageId, payload) {
    logger.info(`CALLRESULT from ${stationId}: ${messageId}`);
    // Handle responses to commands sent to charging station
  }

  handleCallError(stationId, messageId, errorCode, errorDescription) {
    logger.error(`CALLERROR from ${stationId}: ${errorCode} - ${errorDescription}`);
  }

  // OCPP Action Handlers
  async handleBootNotification(stationId, messageId, payload) {
    logger.info(`BootNotification from ${stationId}:`, payload);
    
    try {
      // Update station info including location data
      const stationInfo = {
        vendor: payload.chargePointVendor,
        model: payload.chargePointModel,
        firmware: payload.firmwareVersion,
        serialNumber: payload.chargePointSerialNumber,
        lastBootTime: getTimestamp()
      };

      // Add location information if provided
      if (payload.stationName) {
        stationInfo.stationName = payload.stationName;
      }
      if (payload.address) {
        stationInfo.address = payload.address;
      }
      if (payload.latitude && payload.longitude) {
        stationInfo.latitude = payload.latitude;
        stationInfo.longitude = payload.longitude;
      }
      
      // Add ownerId if provided
      if (payload.ownerId) {
        stationInfo.ownerId = payload.ownerId;
        logger.info(`✅ Added ownerId: ${payload.ownerId} for station ${stationId}`);
      }

      sessions.updateStationInfo(stationId, stationInfo);
      
      if (payload.latitude && payload.longitude) {
        logger.info(`✅ Updated station info for ${stationId} with location: ${payload.stationName} at ${payload.address} (${payload.latitude}, ${payload.longitude})`);
      } else {
        logger.info(`✅ Updated station info for ${stationId}`);
      }

      // Initialize persistent connectors using connector service
      try {
        await connectorService.initializeConnectors(stationId);
        logger.info(`✅ Initialized persistent connectors for station ${stationId}`);
      } catch (error) {
        logger.error(`❌ Failed to initialize connectors for ${stationId}:`, error);
        // Continue anyway - don't let connector init failure block BootNotification response
      }

      // Send response
      const currentTime = getTimestamp();
      logger.info(`📅 Current timestamp: ${currentTime}`);
      
      const response = {
        status: 'Accepted',
        currentTime: currentTime,
        interval: 300 // Heartbeat interval in seconds
      };

      logger.info(`📤 About to send BootNotification response: ${JSON.stringify(response)}`);
      this.sendCallResult(stationId, messageId, response);
      logger.info(`✅ BootNotification response sent successfully for ${stationId}`);

      // Sync station data to Firestore khi có kết nối mới
      if (syncService && syncService.isRunning && realtimeService.isAvailable()) {
        try {
          const liveData = await realtimeService.getStationLiveData(stationId);
          if (liveData) {
            // Thêm thông tin owner nếu có trong boot notification
            if (payload.ownerId) {
              liveData.ownerId = payload.ownerId;
            }
            
            await syncService.syncOnStationConnect(stationId, liveData);
            logger.info(`✅ Synced station ${stationId} to Firestore on boot`);
          }
        } catch (syncError) {
          logger.error(`❌ Failed to sync station ${stationId} on boot:`, syncError);
          // Don't fail the boot notification if sync fails
        }
      }
      
    } catch (error) {
      logger.error(`❌ Error in handleBootNotification for ${stationId}:`, error);
      // Send a simple response as fallback
      try {
        const fallbackResponse = {
          status: 'Accepted',
          currentTime: new Date().toISOString(),
          interval: 300
        };
        logger.info(`📤 Sending fallback BootNotification response: ${JSON.stringify(fallbackResponse)}`);
        this.sendCallResult(stationId, messageId, fallbackResponse);
      } catch (fallbackError) {
        logger.error(`❌ Failed to send fallback BootNotification response:`, fallbackError);
      }
    }
  }

  handleHeartbeat(stationId, messageId, payload) {
    logger.debug(`Heartbeat from ${stationId}`);
    
    // Update last seen time
    sessions.updateLastSeen(stationId);

    const response = {
      currentTime: getTimestamp()
    };

    this.sendCallResult(stationId, messageId, response);
  }

  handleStatusNotification(stationId, messageId, payload) {
    logger.info(`StatusNotification from ${stationId}:`, payload);
    
    // Prepare connector status data for sessions
    const statusData = {
      status: payload.status,
      errorCode: payload.errorCode,
      timestamp: payload.timestamp || getTimestamp(),
      info: payload.info
    };

    // Include safety check data if present (for Preparing status)
    if (payload.safetyCheck) {
      statusData.safetyCheck = payload.safetyCheck;
      logger.info(`🔒 Safety check data received for ${stationId}/${payload.connectorId}:`, payload.safetyCheck);
    }

    // Include any additional metadata from simulator
    if (payload.Wh_total !== undefined) statusData.Wh_total = payload.Wh_total;
    if (payload.W_now !== undefined) statusData.W_now = payload.W_now;
    
    // Update connector status in sessions (which will update Firebase)
    sessions.updateConnectorStatus(stationId, payload.connectorId, statusData);

    this.sendCallResult(stationId, messageId, {});
  }

  handleAuthorize(stationId, messageId, payload) {
    logger.info(`Authorize from ${stationId}:`, payload);
    
    // Simple authorization - accept all for now
    const response = {
      idTagInfo: {
        status: 'Accepted'
      }
    };

    this.sendCallResult(stationId, messageId, response);
  }

  async handleStartTransaction(stationId, messageId, payload) {
    logger.info(`🚀 START TRANSACTION DEBUG - Station: ${stationId}, MessageID: ${messageId}`);
    logger.info(`🚀 START TRANSACTION PAYLOAD:`, JSON.stringify(payload, null, 2));
    logger.info(`StartTransaction from ${stationId}:`, payload);
    logger.info(`🔍 Received idTag: ${payload.idTag}`);
    
    try {
      // 1. Kiểm tra user có tồn tại trong database không
      const userExists = await this.checkUserExists(payload.idTag);
      if (!userExists) {
        // Reject nếu user không tồn tại
        const response = {
          transactionId: 0,
          idTagInfo: {
            status: 'Invalid'
          }
        };
        this.sendCallResult(stationId, messageId, response);
        return;
      }

      // 2. Gửi thông báo xác nhận đến User App và chờ phản hồi
      const userConfirmed = await this.requestUserConfirmation(payload.idTag, stationId, payload.connectorId);
      
      if (!userConfirmed) {
        // User từ chối - Reject transaction
        const response = {
          transactionId: 0,
          idTagInfo: {
            status: 'Blocked'
          }
        };
        this.sendCallResult(stationId, messageId, response);
        return;
      }

      // 3. User đồng ý - Tiếp tục tạo transaction
      const transactionId = Date.now();
      
      // Update session with userId from idTag
      await sessions.startTransaction(stationId, payload.connectorId, {
        transactionId,
        idTag: payload.idTag,
        userId: payload.idTag,
        meterStart: payload.meterStart,
        startTime: payload.timestamp,
        reservationId: payload.reservationId
      });

      const response = {
        transactionId,
        idTagInfo: {
          status: 'Accepted'
        }
      };

      this.sendCallResult(stationId, messageId, response);
      
    } catch (error) {
      logger.error(`Error processing StartTransaction:`, error);
      const response = {
        transactionId: 0,
        idTagInfo: {
          status: 'Invalid'
        }
      };
      this.sendCallResult(stationId, messageId, response);
    }
  }

  // Helper functions for user confirmation flow
  async checkUserExists(userId) {
    try {
      logger.info(`🔍 Checking if user ${userId} exists...`);
      
      // Tạm thời return true để test flow confirmation
      // TODO: Implement proper Firestore query when ready
      logger.info(`✅ User ${userId} validation bypassed for testing`);
      return true;
      
    } catch (error) {
      logger.error(`Error checking user ${userId}:`, error);
      return false;
    }
  }

  async requestUserConfirmation(userId, stationId, connectorId) {
    try {
      // Import dynamic để tránh lỗi ES module
      const { realtimeService } = await import('../services/realtime.js');
      const confirmationData = {
        userId,
        stationId, 
        connectorId,
        timestamp: new Date().toISOString(),
        status: 'pending'
      };

      logger.info(`[DEBUG] Ghi xác nhận sạc cho userId: ${userId}`, confirmationData);
      await realtimeService.saveChargingConfirmation(userId, confirmationData);
      logger.info(`[DEBUG] Đã ghi xác nhận sạc cho userId: ${userId}`);

      // Chờ phản hồi từ user trong 30 giây
      const confirmed = await this.waitForUserResponse(userId, 30000);
      return confirmed;
    } catch (error) {
      logger.error(`💥 Error requesting user confirmation:`, error && error.stack ? error.stack : error);
      logger.error(`💥 Error type:`, typeof error);
      logger.error(`💥 Error constructor:`, error.constructor?.name);
      logger.error(`💥 Error message:`, error?.message);
      logger.error(`💥 Error code:`, error?.code);
      logger.error(`💥 Error details:`, error?.details);
      logger.error(`💥 Error JSON:`, JSON.stringify(error, null, 2));
      return false;
    }
  }

  async waitForUserResponse(userId, timeoutMs) {
    return new Promise(async (resolve) => {
      // Import dynamic để tránh lỗi ES module
      const { realtimeService } = await import('../services/realtime.js');
      let timeoutId;
      let listenerUnsubscribe;

      // Set timeout
      timeoutId = setTimeout(() => {
        if (listenerUnsubscribe) listenerUnsubscribe();
        resolve(false); // Timeout - user didn't respond
      }, timeoutMs);

      // Listen for user response
      listenerUnsubscribe = realtimeService.listenForChargingResponse(userId, (response) => {
        clearTimeout(timeoutId);
        if (listenerUnsubscribe) listenerUnsubscribe();
        resolve(response === 'accepted');
      });
    });
  }

  async handleStopTransaction(stationId, messageId, payload) {
    logger.info(`StopTransaction from ${stationId}:`, payload);
    
    // Update session
    await sessions.stopTransaction(stationId, payload.transactionId, {
      meterStop: payload.meterStop,
      stopTime: payload.timestamp,
      reason: payload.reason,
      idTag: payload.idTag
    });

    const response = {
      idTagInfo: {
        status: 'Accepted'
      }
    };

    this.sendCallResult(stationId, messageId, response);
  }

  handleMeterValues(stationId, messageId, payload) {
    logger.debug(`MeterValues from ${stationId}:`, payload);
    
    // Store meter values
    sessions.addMeterValues(stationId, payload.connectorId, payload.meterValue, payload.transactionId);

    this.sendCallResult(stationId, messageId, {});
  }

  async handleDataTransfer(stationId, messageId, payload) {
    logger.info(`DataTransfer from ${stationId}:`, payload);
    
    try {
      if (payload.vendorId === 'RealtimeUpdate' && payload.messageId === 'ChargeThreshold') {
        const data = JSON.parse(payload.data);
        
        // Cập nhật ngưỡng sạc đầy lên Firebase Realtime Database
        await realtimeService.updateConnectorThreshold(
          stationId,
          data.connectorId,
          data.fullChargeThresholdKwh,
          data.currentEnergyKwh,
          data.duration,
          data.estimatedCost,
          data.powerKw
        );
        
        logger.info(`✅ Updated charge threshold for ${stationId}/${data.connectorId}: ${data.fullChargeThresholdKwh}kWh`);
        
        this.sendCallResult(stationId, messageId, { status: 'Accepted' });
      } else {
        this.sendCallResult(stationId, messageId, { status: 'UnknownVendorId' });
      }
    } catch (error) {
      logger.error(`❌ Error processing DataTransfer from ${stationId}:`, error);
      this.sendCallResult(stationId, messageId, { status: 'Rejected' });
    }
  }

  handleDisconnection(stationId) {
    logger.info(`Station disconnected: ${stationId}`);
    this.clients.delete(stationId);
    sessions.setStationStatus(stationId, 'Offline');
  }

  handleError(stationId, error) {
    logger.error(`WebSocket error from ${stationId}:`, error);
  }

  // Send message helpers
  sendCall(stationId, action, payload) {
    const messageId = generateUID();
    const message = [OCPP.MESSAGE_TYPE.CALL, messageId, action, payload];
    this.sendMessage(stationId, message);
    return messageId;
  }

  sendCallResult(stationId, messageId, payload) {
    logger.info(`🔵 sendCallResult START: stationId=${stationId}, messageId=${messageId}, payload=${JSON.stringify(payload)}`);
    
    try {
      const message = [OCPP.MESSAGE_TYPE.CALLRESULT, messageId, payload];
      logger.info(`📋 CALLRESULT message array: ${JSON.stringify(message)}`);
      
      this.sendMessage(stationId, message);
      logger.info(`✅ sendCallResult completed successfully`);
    } catch (error) {
      logger.error(`❌ Error in sendCallResult:`, error);
      throw error;
    }
  }

  sendCallError(stationId, messageId, errorCode, errorDescription, errorDetails = {}) {
    const message = [OCPP.MESSAGE_TYPE.CALLERROR, messageId, errorCode, errorDescription, errorDetails];
    this.sendMessage(stationId, message);
  }

  sendMessage(stationId, message) {
    logger.info(`🔵 sendMessage START: stationId=${stationId}, message=${JSON.stringify(message)}`);
    
    try {
      const ws = this.clients.get(stationId);
      logger.info(`🔍 WebSocket client lookup result: ${ws ? 'FOUND' : 'NOT FOUND'}`);
      
      if (ws && ws.readyState === ws.OPEN) {
        const data = JSON.stringify(message);
        logger.info(`📤 About to send data: ${data}`);
        
        ws.send(data);
        logger.info(`✅ Message sent successfully to ${stationId}`);
      } else {
        const readyState = ws ? ws.readyState : 'N/A';
        logger.warn(`❌ Cannot send message to ${stationId}: Connection not available (readyState: ${readyState})`);
      }
    } catch (error) {
      logger.error(`❌ Error in sendMessage:`, error);
      throw error;
    }
  }

  // Remote commands
  sendRemoteStartTransaction(stationId, idTag, connectorId = null) {
    const payload = { idTag };
    if (connectorId) payload.connectorId = connectorId;
    
    return this.sendCall(stationId, 'RemoteStartTransaction', payload);
  }

  sendRemoteStopTransaction(stationId, transactionId) {
    return this.sendCall(stationId, 'RemoteStopTransaction', { transactionId });
  }

  sendChangeAvailability(stationId, connectorId, type) {
    return this.sendCall(stationId, 'ChangeAvailability', { connectorId, type });
  }

  sendReset(stationId, type = 'Soft') {
    return this.sendCall(stationId, 'Reset', { type });
  }

  sendUnlockConnector(stationId, connectorId) {
    return this.sendCall(stationId, 'UnlockConnector', { connectorId });
  }

  // Utility methods
  sendBootNotificationResponse(ws) {
    // This is for immediate testing - remove in production
    const message = [
      OCPP.MESSAGE_TYPE.CALLRESULT,
      'boot-test',
      {
        status: 'Accepted',
        currentTime: getTimestamp(),
        interval: 300
      }
    ];
    ws.send(JSON.stringify(message));
  }

  getConnectedStations() {
    return Array.from(this.clients.keys());
  }

  isStationConnected(stationId) {
    return this.clients.has(stationId);
  }

  stop() {
    if (this.wss) {
      this.wss.close();
      logger.info('OCPP WebSocket Server stopped');
    }
  }
}

export const ocppServer = new OcppWebSocketServer();
