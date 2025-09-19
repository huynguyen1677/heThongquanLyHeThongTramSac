import { v4 as uuidv4 } from 'uuid';
import { validateOcppMessage, validateByAction } from '../schemas/ocpp.js';

export class OcppClient {
  constructor() {
    this.ws = null;
    this.connected = false;
    this.stationId = null;
    this.ownerId = null;
    this.pendingCalls = new Map(); // Map<messageId, { resolve, reject, timeout, action }>
    this.messageHandler = null;
    this.statusHandler = null;
    this.callTimeout = 15000; // 15 seconds
    this.heartbeatInterval = null;
    this.heartbeatIntervalMs = 300000; // 5 minutes default
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    this.remoteIdTag = null; // Lưu idTag từ RemoteStartTransaction
  }

  // Set event handlers
  setMessageHandler(handler) {
    this.messageHandler = handler;
  }

  setStatusHandler(handler) {
    this.statusHandler = handler;
  }

  // Connect to OCPP WebSocket
  async connect(stationId, ownerId) {
    if (this.connected) {
      await this.disconnect();
    }

    this.stationId = stationId;
    this.ownerId = ownerId;

    const wsUrl = `${import.meta.env.VITE_OCPP_WS}?stationId=${encodeURIComponent(stationId)}`;
    
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
          this.connected = true;
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;
          this.log('✅ WebSocket connected', 'info');
          if (this.statusHandler) {
            this.statusHandler('connected');
          }
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onclose = (event) => {
          this.connected = false;
          this.log(`❌ WebSocket closed: ${event.code} - ${event.reason}`, 'warn');
          if (this.statusHandler) {
            this.statusHandler('disconnected');
          }
          
          // Clear heartbeat
          if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
          }

          // Reject all pending calls
          for (const [_messageId, pendingCall] of this.pendingCalls.entries()) {
            clearTimeout(pendingCall.timeout);
            pendingCall.reject(new Error('WebSocket connection closed'));
          }
          this.pendingCalls.clear();

          // Auto-reconnect if not manually disconnected
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          this.log(`❌ WebSocket error: ${error.message || 'Unknown error'}`, 'error');
          reject(error);
        };

        // Connection timeout
        setTimeout(() => {
          if (!this.connected) {
            this.ws.close();
            reject(new Error('Connection timeout'));
          }
        }, 10000);

      } catch (error) {
        reject(error);
      }
    });
  }

  // Schedule reconnection with exponential backoff
  scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);
    
    this.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`, 'info');
    
    setTimeout(() => {
      if (this.reconnectAttempts <= this.maxReconnectAttempts) {
        this.connect(this.stationId, this.ownerId).catch(() => {
          // Reconnection failed, will try again or give up
        });
      }
    }, delay);
  }

  // Disconnect WebSocket
  async disconnect() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.ws && this.connected) {
      this.ws.close(1000, 'Manual disconnect');
    }

    this.connected = false;
    this.stationId = null;
    this.ownerId = null;

    // Clear all pending calls
    for (const [_messageId, pendingCall] of this.pendingCalls.entries()) {
      clearTimeout(pendingCall.timeout);
      pendingCall.reject(new Error('Manually disconnected'));
    }
    this.pendingCalls.clear();
  }

  // Handle incoming WebSocket messages
  handleMessage(data) {
    try {
      const message = JSON.parse(data);
      const validation = validateOcppMessage(message);
      
      if (!validation.success) {
        this.log(`❌ Invalid OCPP message format: ${validation.error}`, 'error');
        return;
      }

      const messageType = message[0];
      const messageId = message[1];

      switch (messageType) {
        case 2: { // CALL - incoming request from CSMS: [2, messageId, action, payload]
          const action = message[2];
          const callPayload = message[3];
          this.handleCall(messageId, action, callPayload);
          break;
        }
        case 3: { // CALLRESULT - response to our request: [3, messageId, payload]
          const resultPayload = message[2];
          this.handleCallResult(messageId, resultPayload);
          break;
        }
        case 4: { // CALLERROR - error response to our request: [4, messageId, errorCode, errorDescription, errorDetails]
          const errorCode = message[2];
          const errorDescription = message[3];
          this.handleCallError(messageId, errorCode, errorDescription);
          break;
        }
        default:
          this.log(`❌ Unknown message type: ${messageType}`, 'error');
      }
    } catch (error) {
      this.log(`❌ Error parsing message: ${error.message}`, 'error');
    }
  }

  // Handle incoming CALL from CSMS
  handleCall(messageId, action, payload) {
    this.log(`⬅️ CALL ${action}`, 'info', { messageId, payload });

    // Validate incoming payload
    const validation = validateByAction(action, payload, true);
    if (!validation.success) {
      this.sendCallError(messageId, 'TypeConstraintViolation', validation.error);
      return;
    }

    // Nếu là RemoteStartTransaction thì lưu lại idTag
    if (action === 'RemoteStartTransaction' && payload && payload.idTag) {
      this.remoteIdTag = payload.idTag;
      this.log(`💡 Lưu idTag từ RemoteStartTransaction: ${payload.idTag}`, 'info');
    }

    // Pass to message handler
    if (this.messageHandler) {
      this.messageHandler('call', action, payload, messageId);
    }
  }

  // Handle CALLRESULT
  handleCallResult(messageId, payload) {
    const pendingCall = this.pendingCalls.get(messageId);
    if (!pendingCall) {
      this.log(`❌ Received CALLRESULT for unknown message ID: ${messageId}`, 'warn');
      return;
    }

    this.log(`⬅️ CALLRESULT ${pendingCall.action}`, 'info', { messageId, payload });

    // Validate response payload
    const validation = validateByAction(pendingCall.action, payload, false);
    if (!validation.success) {
      this.log(`❌ Invalid CALLRESULT payload for ${pendingCall.action}: ${validation.error}`, 'error');
    }

    // Clear timeout and resolve promise
    clearTimeout(pendingCall.timeout);
    this.pendingCalls.delete(messageId);
    pendingCall.resolve(payload);
  }

  // Handle CALLERROR
  handleCallError(messageId, errorCode, errorDescription) {
    const pendingCall = this.pendingCalls.get(messageId);
    if (!pendingCall) {
      this.log(`❌ Received CALLERROR for unknown message ID: ${messageId}`, 'warn');
      return;
    }

    this.log(`⬅️ CALLERROR ${pendingCall.action}`, 'error', { messageId, errorCode, errorDescription });

    // Clear timeout and reject promise
    clearTimeout(pendingCall.timeout);
    this.pendingCalls.delete(messageId);
    pendingCall.reject(new Error(`${errorCode}: ${errorDescription}`));
  }

  // Send CALL request
  async sendCall(action, payload) {
    if (!this.connected) {
      throw new Error('Not connected to OCPP server');
    }

    // Validate payload before sending
    const validation = validateByAction(action, payload, true);
    if (!validation.success) {
      const errorMsg = `❌ ${action} validation failed: ${validation.error}`;
      this.log(errorMsg, 'error');
      throw new Error(errorMsg);
    }

    const messageId = uuidv4();
    const message = [2, messageId, action, payload];

    return new Promise((resolve, reject) => {
      // Set up timeout
      const timeout = setTimeout(() => {
        this.pendingCalls.delete(messageId);
        const errorMsg = `Timeout waiting for ${action} response`;
        this.log(`⏰ ${errorMsg}`, 'warn', { messageId, _timeout: true });
        reject(new Error(errorMsg));
      }, this.callTimeout);

      // Store pending call
      this.pendingCalls.set(messageId, {
        resolve,
        reject,
        timeout,
        action
      });

      // Send message
      try {
        const messageStr = JSON.stringify(message);
        this.ws.send(messageStr);
        this.log(`➡️ CALL ${action}`, 'info', { messageId, payload });
      } catch (error) {
        clearTimeout(timeout);
        this.pendingCalls.delete(messageId);
        reject(error);
      }
    });
  }

  // Send CALLRESULT response
  sendCallResult(messageId, payload) {
    if (!this.connected) {
      this.log('❌ Cannot send CALLRESULT: not connected', 'error');
      return;
    }

    const message = [3, messageId, payload];
    const messageStr = JSON.stringify(message);
    
    try {
      this.ws.send(messageStr);
      this.log(`➡️ CALLRESULT`, 'info', { messageId, payload });
    } catch (error) {
      this.log(`❌ Error sending CALLRESULT: ${error.message}`, 'error');
    }
  }

  // Send CALLERROR response
  sendCallError(messageId, errorCode, errorDescription, errorDetails = {}) {
    if (!this.connected) {
      this.log('❌ Cannot send CALLERROR: not connected', 'error');
      return;
    }

    const message = [4, messageId, errorCode, errorDescription, errorDetails];
    const messageStr = JSON.stringify(message);
    
    try {
      this.ws.send(messageStr);
      this.log(`➡️ CALLERROR`, 'error', { messageId, errorCode, errorDescription });
    } catch (error) {
      this.log(`❌ Error sending CALLERROR: ${error.message}`, 'error');
    }
  }

  // Start heartbeat
  startHeartbeat(intervalSeconds) {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatIntervalMs = intervalSeconds * 1000;
    this.heartbeatInterval = setInterval(() => {
      this.sendCall('Heartbeat', {}).catch((error) => {
        this.log(`❌ Heartbeat failed: ${error.message}`, 'error');
      });
    }, this.heartbeatIntervalMs);

    this.log(`💓 Heartbeat started (${intervalSeconds}s interval)`, 'info');
  }

  // Stop heartbeat
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      this.log(`💔 Heartbeat stopped`, 'info');
    }
  }

  // Logging utility
  log(message, level = 'info', data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      stationId: this.stationId,
      data
    };

    // Console output
    const consoleMsg = `[${timestamp}] ${message}`;
    switch (level) {
      case 'error':
        console.error(consoleMsg, data || '');
        break;
      case 'warn':
        console.warn(consoleMsg, data || '');
        break;
      case 'info':
      default:
        console.log(consoleMsg, data || '');
        break;
    }

    // Pass to message handler for UI display
    if (this.messageHandler) {
      this.messageHandler('log', level, logEntry);
    }
  }

  // Get connection status
  isConnected() {
    return this.connected;
  }

  // Get pending calls count (for debugging)
  getPendingCallsCount() {
    return this.pendingCalls.size;
  }

  // Hàm gửi StartTransaction (bạn cần truyền đúng idTag)
  async sendStartTransaction(connectorId, meterStart, inputIdTag = null) {
    // Ưu tiên inputIdTag (từ UI), nếu không có thì lấy remoteIdTag (từ app)
    const idTag = inputIdTag || this.remoteIdTag;
    if (!idTag) throw new Error('Không tìm thấy idTag! Vui lòng nhập mã xác nhận hoặc nhận lệnh từ app.');

    const payload = {
      connectorId,
      idTag,
      meterStart,
      timestamp: new Date().toISOString()
    };
    return this.sendCall('StartTransaction', payload);
  }
}
