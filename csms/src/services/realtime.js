import { firebase } from './firebase.js';
import { logger } from '../utils/logger.js';
import { getTimestamp } from '../utils/time.js';
import { DEFAULT_PRICE_PER_KWH } from '../domain/constants.js';
import { firestoreService } from './firestore.js';

class RealtimeService {
  constructor() {
    this.db = null;
    this.listeners = new Map(); // path -> callback
    this.pricePerKwh = DEFAULT_PRICE_PER_KWH; // VND per kWh
    // Cache để lưu giá trị Wh bắt đầu của mỗi transaction
    this.transactionStartValues = new Map(); // `${stationId}-${connectorId}-${txId}` -> startWh
  }

  initialize() {
    if (firebase.isInitialized()) {
      this.db = firebase.getDatabase();
      logger.info(`[RTDB] databaseURL = ${this.db.app?.options?.databaseURL}`);
      logger.info('Realtime Database service ready');

      // Lấy giá điện từ Firestore khi khởi động
      firestoreService.getPricePerKwh().then((price) => {
        if (price) {
          this.pricePerKwh = price;
          logger.info(`Loaded pricePerKwh from Firestore: ${price}`);
        }
      });

      // Lắng nghe thay đổi giá điện realtime từ Firestore
      firestoreService.listenPricePerKwh((price) => {
        if (price) {
          this.pricePerKwh = price;
          logger.info(`Realtime pricePerKwh updated from Firestore: ${price}`);
        }
      });
    } else {
      logger.warn('Realtime Database service not available - Firebase not initialized');
    }
  }

  isAvailable() {
    return this.db !== null;
  }

  // Station management - theo cấu trúc mới /live/stations/{stationId}/
  async updateStationOnline(stationId, isOnline, stationInfo = {}) {
    if (!this.isAvailable()) return false;

    try {
      const stationRef = this.db.ref(`live/stations/${stationId}`);
      const data = {
        online: isOnline,
        lastHeartbeat: getTimestamp(),
        ownerId: stationInfo.ownerId || null,
        stationName: stationInfo.stationName || null,
        vendor: stationInfo.vendor || null,
        model: stationInfo.model || null,
        firmwareVersion: stationInfo.firmwareVersion || null,
        // Location information
        address: stationInfo.address || null,
        latitude: stationInfo.latitude || null,
        longitude: stationInfo.longitude || null
      };
      
      await stationRef.update(data);
      logger.info(`Station ${stationId} online status updated: ${isOnline}${stationInfo.address ? ` at ${stationInfo.address}` : ''}`);
      
      // Trigger sync to Firestore khi station online
      if (isOnline) {
        this.triggerStationSync(stationId, data);
      }
      
      return true;
    } catch (error) {
      logger.error('Error updating station online status:', error);
      return false;
    }
  }

  // Cập nhật heartbeat của station
  async updateStationHeartbeat(stationId) {
    if (!this.isAvailable()) return false;

    try {
      const heartbeatRef = this.db.ref(`live/stations/${stationId}/lastHeartbeat`);
      await heartbeatRef.set(getTimestamp());
      logger.debug(`Station ${stationId} heartbeat updated`);
      return true;
    } catch (error) {
      logger.error('Error updating station heartbeat:', error);
      return false;
    }
  }

  // Cập nhật thông tin station (vendor, model, firmware, location, v.v.)
  async updateStationInfo(stationId, stationInfo) {
    if (!this.isAvailable()) return false;

    try {
      const stationRef = this.db.ref(`live/stations/${stationId}`);
      const updateData = {};
      
      if (stationInfo.ownerId !== undefined) updateData.ownerId = stationInfo.ownerId;
      if (stationInfo.stationName !== undefined) updateData.stationName = stationInfo.stationName;
      if (stationInfo.vendor !== undefined) updateData.vendor = stationInfo.vendor;
      if (stationInfo.model !== undefined) updateData.model = stationInfo.model;
      if (stationInfo.firmwareVersion !== undefined) updateData.firmwareVersion = stationInfo.firmwareVersion;
      // Location information
      if (stationInfo.address !== undefined) updateData.address = stationInfo.address;
      if (stationInfo.latitude !== undefined) updateData.latitude = stationInfo.latitude;
      if (stationInfo.longitude !== undefined) updateData.longitude = stationInfo.longitude;
      
      await stationRef.update(updateData);
      logger.debug(`Station ${stationId} info updated:`, updateData);
      return true;
    } catch (error) {
      logger.error('Error updating station info:', error);
      return false;
    }
  }

  // Bắt đầu transaction - lưu giá trị Wh ban đầu
  async startTransaction(stationId, connectorId, transactionId, initialWhValue = 0) {
    if (!this.isAvailable()) return false;

    try {
      const transactionKey = `${stationId}-${connectorId}-${transactionId}`;

      // Lấy dữ liệu hiện tại của connector
      const connectorSnapshot = await this.db.ref(`live/stations/${stationId}/connectors/${connectorId}`).once('value');
      const currentData = connectorSnapshot.val();

      // Nếu đã có transaction đang chạy, không reset các giá trị
      if (currentData && currentData.txId === transactionId) {
        logger.info(`Transaction already active: ${stationId}/${connectorId} -> ${transactionId}, skip reset`);
        return true;
      }

      // Lưu vào cache
      this.transactionStartValues.set(transactionKey, initialWhValue);

      // Cập nhật connector - GIỮ NGUYÊN Wh_total và kwh tích lũy
      const connectorRef = this.db.ref(`live/stations/${stationId}/connectors/${connectorId}`);
      const updateData = {
        txId: transactionId,
        W_now: 0,
        session_kwh: 0,        // kWh của phiên hiện tại (để tracking riêng)
        session_cost: 0,       // Chi phí của phiên hiện tại
        lastUpdate: getTimestamp()
      };

      // Nếu chưa có Wh_total và kwh, khởi tạo
      if (!currentData || currentData.Wh_total === undefined) {
        updateData.Wh_total = 0;
        updateData.kwh = 0;
        updateData.costEstimate = 0;
      }
      // Nếu đã có thì GIỮ NGUYÊN (không update)

      await connectorRef.update(updateData);

      logger.info(`Transaction started: ${stationId}/${connectorId} -> ${transactionId}, startWh: ${initialWhValue}`);
      return true;
    } catch (error) {
      logger.error('Error starting transaction:', error);
      return false;
    }
  }

  // Kết thúc transaction - cleanup
  async stopTransaction(stationId, connectorId, transactionId) {
    if (!this.isAvailable()) return false;

    try {
      const transactionKey = `${stationId}-${connectorId}-${transactionId}`;
      
      // Xóa từ cache
      this.transactionStartValues.delete(transactionKey);
      
      // Cập nhật connector - giữ lại Wh_total cuối cùng nhưng clear txId
      const connectorRef = this.db.ref(`live/stations/${stationId}/connectors/${connectorId}`);
      await connectorRef.update({
        txId: null,                                       // number|null - clear transaction ID
        W_now: 0,                                         // công suất hiện tại (W) - reset về 0
        lastUpdate: getTimestamp()                        // epoch millis (server time)
        // Giữ lại Wh_total, kwh, costEstimate để hiển thị kết quả cuối
      });
      
      logger.info(`Transaction stopped: ${stationId}/${connectorId} -> ${transactionId}`);
      return true;
    } catch (error) {
      logger.error('Error stopping transaction:', error);
      return false;
    }
  }

  // Connector status updates - theo cấu trúc /live/stations/{stationId}/connectors/{connectorId}/
  async updateConnectorStatus(stationId, connectorId, statusData) {
    if (!this.isAvailable()) return false;

    try {
      const connectorRef = this.db.ref(`live/stations/${stationId}/connectors/${connectorId}`);
      const data = {
        status: statusData.status,                        // "Available"|"Preparing"|"Charging"|"Finishing"|"Unavailable"|"Faulted"
        errorCode: statusData.errorCode || 'NoError',     // "NoError" | ...
        lastUpdate: getTimestamp()                        // epoch millis (server time)
      };

      // Cập nhật txId (transaction ID) - null hoặc number
      if (statusData.txId !== undefined) {
        data.txId = statusData.txId;
      }

      // Xử lý dữ liệu năng lượng chính xác
      if (statusData.currentWhReading !== undefined && statusData.txId) {
        const calculatedWhTotal = await this.calculateWhTotal(stationId, connectorId, statusData.txId, statusData.currentWhReading);

        data.Wh_total = calculatedWhTotal;
        data.kwh = Math.round((calculatedWhTotal / 1000) * 100) / 100;
        data.costEstimate = Math.round(data.kwh * this.pricePerKwh);     // kWh*price, làm tròn, để UI hiện tức thời
      }

      // Cập nhật công suất hiện tại
      if (statusData.W_now !== undefined) {
        data.W_now = statusData.W_now;                    // công suất hiện tại (W)
      }

      logger.info(`[RTDB] updating connector: live/stations/${stationId}/connectors/${connectorId}`);
      await connectorRef.update(data);

      logger.info(`✅ Connector status updated: ${stationId}/${connectorId} - ${statusData.status}`);
      return true;
    } catch (error) {
      logger.error('Error updating connector status:', error);
      return false;
    }
  }

  // Cập nhật meter values cho connector - FIX chính ở đây
  async updateConnectorMeterValues(stationId, connectorId, meterData) {
    if (!this.isAvailable()) return false;

    try {
      // Lấy thông tin connector hiện tại để biết txId
      const connectorSnapshot = await this.db.ref(`live/stations/${stationId}/connectors/${connectorId}`).once('value');
      const currentConnectorData = connectorSnapshot.val();
      
      if (!currentConnectorData || !currentConnectorData.txId) {
        logger.warn(`No active transaction for connector ${stationId}/${connectorId}, skipping meter update`);
        return false;
      }

      const currentTxId = currentConnectorData.txId;
      const currentWhReading = meterData.currentWhReading || meterData.Wh_reading || 0;
      
      // Tính Wh cho session hiện tại
      const sessionWhTotal = await this.calculateWhTotal(stationId, connectorId, currentTxId, currentWhReading);
      
      // Tính Wh_total tích lũy (chỉ tăng, không giảm)
      const previousWhTotal = currentConnectorData.Wh_total || 0;
      const newWhTotal = Math.max(previousWhTotal, previousWhTotal + sessionWhTotal);
      
      const connectorRef = this.db.ref(`live/stations/${stationId}/connectors/${connectorId}`);
      const data = {
        Wh_total: newWhTotal,                             // Tích lũy tổng (chỉ tăng)
        session_kwh: Math.round((sessionWhTotal / 1000) * 100) / 100,  // kWh của session hiện tại
        W_now: meterData.W_now || meterData.power || 0,   // công suất hiện tại (W)
        lastUpdate: getTimestamp()                        // epoch millis (server time)
      };

      // Tính toán giá trị hiển thị cho app
      data.kwh = Math.round((newWhTotal / 1000) * 100) / 100;           // Tổng kWh tích lũy (dùng cho UI)
      data.costEstimate = Math.round(data.kwh * this.pricePerKwh);       // Tổng cost tích lũy
      data.session_cost = Math.round(data.session_kwh * this.pricePerKwh); // Chi phí session hiện tại

      await connectorRef.update(data);
      return true;
    } catch (error) {
      logger.error('Error updating connector meter values:', error);
      return false;
    }
  }

  // Hàm tính toán Wh_total chính xác cho phiên
  async calculateWhTotal(stationId, connectorId, transactionId, currentWhReading) {
    const transactionKey = `${stationId}-${connectorId}-${transactionId}`;
    
    // Lấy giá trị bắt đầu từ cache
    let startWhValue = this.transactionStartValues.get(transactionKey);
    
    // Nếu không có trong cache, lấy từ database
    if (startWhValue === undefined) {
      try {
        const connectorSnapshot = await this.db.ref(`live/stations/${stationId}/connectors/${connectorId}`).once('value');
        const connectorData = connectorSnapshot.val();
        
        // Tìm transaction này trong lịch sử để lấy giá trị bắt đầu
        // Hoặc sử dụng giá trị mặc định nếu không tìm thấy
        startWhValue = 0; // Mặc định cho transaction mới
        
        // Lưu vào cache cho lần sau
        this.transactionStartValues.set(transactionKey, startWhValue);
        logger.debug(`Retrieved start Wh from DB for ${transactionKey}: ${startWhValue}`);
      } catch (error) {
        logger.error('Error retrieving start Wh value:', error);
        startWhValue = 0;
      }
    }
    
    // Tính Wh_total = hiện tại - bắt đầu
    const whTotal = Math.max(0, currentWhReading - startWhValue);
    
    return whTotal;
  }

  // Cập nhật transaction ID cho connector - cải thiện
  async updateConnectorTransaction(stationId, connectorId, transactionId, startWhValue = 0) {
    if (!this.isAvailable()) return false;

    try {
      if (transactionId) {
        // Bắt đầu transaction mới
        return await this.startTransaction(stationId, connectorId, transactionId, startWhValue);
      } else {
        // Kết thúc transaction hiện tại
        const connectorSnapshot = await this.db.ref(`live/stations/${stationId}/connectors/${connectorId}/txId`).once('value');
        const currentTxId = connectorSnapshot.val();
        
        if (currentTxId) {
          return await this.stopTransaction(stationId, connectorId, currentTxId);
        }
        
        return true;
      }
    } catch (error) {
      logger.error('Error updating connector transaction:', error);
      return false;
    }
  }



  // Getter methods để đọc dữ liệu realtime
  async getStationLiveData(stationId) {
    if (!this.isAvailable()) return null;

    try {
      const snapshot = await this.db.ref(`live/stations/${stationId}`).once('value');
      return snapshot.val();
    } catch (error) {
      logger.error('Error getting station live data:', error);
      return null;
    }
  }

  async getConnectorLiveData(stationId, connectorId) {
    if (!this.isAvailable()) return null;

    try {
      const snapshot = await this.db.ref(`live/stations/${stationId}/connectors/${connectorId}`).once('value');
      return snapshot.val();
    } catch (error) {
      logger.error('Error getting connector live data:', error);
      return null;
    }
  }

  async getAllStationsLiveData() {
    if (!this.isAvailable()) return null;

    try {
      const snapshot = await this.db.ref('live/stations').once('value');
      return snapshot.val();
    } catch (error) {
      logger.error('Error getting all stations live data:', error);
      return null;
    }
  }

  // Listeners cho realtime updates
  listenToStationLiveData(stationId, callback) {
    if (!this.isAvailable()) return null;

    const path = `live/stations/${stationId}`;
    const ref = this.db.ref(path);
    
    ref.on('value', (snapshot) => {
      const data = snapshot.val();
      callback(data);
    });
    
    this.listeners.set(path, ref);
    logger.debug(`Listening to station live data: ${stationId}`);
    return ref;
  }

  listenToConnectorLiveData(stationId, connectorId, callback) {
    if (!this.isAvailable()) return null;

    const path = `live/stations/${stationId}/connectors/${connectorId}`;
    const ref = this.db.ref(path);
    
    ref.on('value', (snapshot) => {
      const data = snapshot.val();
      callback(data);
    });
    
    this.listeners.set(path, ref);
    logger.debug(`Listening to connector live data: ${stationId}/${connectorId}`);
    return ref;
  }

  listenToAllStationsLiveData(callback) {
    if (!this.isAvailable()) return null;

    const path = 'live/stations';
    const ref = this.db.ref(path);
    
    ref.on('value', (snapshot) => {
      const data = snapshot.val();
      callback(data);
    });
    
    this.listeners.set(path, ref);
    logger.debug('Listening to all stations live data');
    return ref;
  }

  // Listener cho Owner - chỉ nghe stations của owner đó
  listenToOwnerStations(ownerId, callback) {
    if (!this.isAvailable()) return null;

    const path = `live/stations_by_owner/${ownerId}`;
    const ref = this.db.ref('live/stations').orderByChild('ownerId').equalTo(ownerId);
    
    ref.on('value', (snapshot) => {
      const data = snapshot.val();
      callback(data);
    });
    
    this.listeners.set(path, ref);
    logger.debug(`Listening to owner stations: ${ownerId}`);
    return ref;
  }

  // Utility methods
  setPricePerKwh(price) {
    this.pricePerKwh = price;
    logger.info(`Price per kWh updated: ${price} VND`);
  }

  getPricePerKwh() {
    return this.pricePerKwh;
  }

  // Remove station từ live data khi offline hoàn toàn
  async removeStationFromLive(stationId) {
    if (!this.isAvailable()) return false;

    try {
      const stationRef = this.db.ref(`live/stations/${stationId}`);
      await stationRef.remove();
      logger.info(`Station removed from live data: ${stationId}`);
      return true;
    } catch (error) {
      logger.error('Error removing station from live data:', error);
      return false;
    }
  }

  // Remove connector từ live data
  async removeConnectorFromLive(stationId, connectorId) {
    if (!this.isAvailable()) return false;

    try {
      const connectorRef = this.db.ref(`live/stations/${stationId}/connectors/${connectorId}`);
      await connectorRef.remove();
      logger.info(`Connector removed from live data: ${stationId}/${connectorId}`);
      return true;
    } catch (error) {
      logger.error('Error removing connector from live data:', error);
      return false;
    }
  }

  // Events và notifications (giữ lại từ code cũ)
  async publishEvent(eventType, eventData) {
    if (!this.isAvailable()) return false;

    try {
      const eventsRef = this.db.ref('events');
      const newEventRef = eventsRef.push();
      
      const data = {
        type: eventType,
        ...eventData,
        timestamp: getTimestamp(),
        id: newEventRef.key
      };
      
      await newEventRef.set(data);
      logger.debug(`Event published: ${eventType}`);
      return true;
    } catch (error) {
      logger.error('Error publishing event:', error);
      return false;
    }
  }

  async sendNotification(type, message, targetStations = null, targetOwnerId = null) {
    if (!this.isAvailable()) return false;

    try {
      const notificationRef = this.db.ref('notifications').push();
      
      const data = {
        type,
        message,
        targetStations,
        targetOwnerId,
        timestamp: getTimestamp(),
        id: notificationRef.key,
        read: false
      };
      
      await notificationRef.set(data);
      logger.debug(`Notification sent: ${type}`);
      return true;
    } catch (error) {
      logger.error('Error sending notification:', error);
      return false;
    }
  }

  // Commands (giữ lại cho remote control)
  async sendCommand(stationId, command, parameters = {}) {
    if (!this.isAvailable()) return false;

    try {
      const commandRef = this.db.ref(`commands/${stationId}`).push();
      
      const data = {
        command,
        parameters,
        timestamp: getTimestamp(),
        id: commandRef.key,
        status: 'pending'
      };
      
      await commandRef.set(data);
      logger.debug(`Command sent to ${stationId}: ${command}`);
      return commandRef.key;
    } catch (error) {
      logger.error('Error sending command:', error);
      return false;
    }
  }

  async updateCommandStatus(stationId, commandId, status, result = null) {
    if (!this.isAvailable()) return false;

    try {
      const commandRef = this.db.ref(`commands/${stationId}/${commandId}`);
      const updateData = {
        status,
        completedAt: getTimestamp()
      };
      
      if (result) {
        updateData.result = result;
      }
      
      await commandRef.update(updateData);
      logger.debug(`Command status updated: ${stationId}/${commandId} -> ${status}`);
      return true;
    } catch (error) {
      logger.error('Error updating command status:', error);
      return false;
    }
  }

  listenToCommands(stationId, callback) {
    if (!this.isAvailable()) return null;

    const path = `commands/${stationId}`;
    const ref = this.db.ref(path);
    
    ref.on('child_added', (snapshot) => {
      const data = snapshot.val();
      if (data.status === 'pending') {
        callback(data);
      }
    });
    
    this.listeners.set(path, ref);
    logger.debug(`Listening to commands for station: ${stationId}`);
    return ref;
  }

  // Stop listening
  stopListening(path) {
    const ref = this.listeners.get(path);
    if (ref) {
      ref.off();
      this.listeners.delete(path);
      logger.debug(`Stopped listening to: ${path}`);
    }
  }

  stopAllListeners() {
    for (const [path, ref] of this.listeners) {
      ref.off();
    }
    this.listeners.clear();
    logger.info('Stopped all Realtime DB listeners');
  }

  // Cleanup - cập nhật để phù hợp với cấu trúc mới
  async cleanupExpiredData() {
    if (!this.isAvailable()) return false;

    try {
      const cutoffTime = getTimestamp() - (24 * 60 * 60 * 1000); // 24 hours ago
      
      // Clean up old events
      const eventsRef = this.db.ref('events');
      const oldEvents = await eventsRef.orderByChild('timestamp').endAt(cutoffTime).once('value');
      
      if (oldEvents.exists()) {
        await oldEvents.ref.remove();
        logger.info('Cleaned up expired events');
      }
      
      // Clean up completed commands older than 1 hour
      const commandsCutoff = getTimestamp() - (60 * 60 * 1000);
      const commandsRef = this.db.ref('commands');
      const stationsSnapshot = await commandsRef.once('value');
      
      if (stationsSnapshot.exists()) {
        const stations = stationsSnapshot.val();
        for (const stationId in stations) {
          const stationCommands = stations[stationId];
          for (const commandId in stationCommands) {
            const command = stationCommands[commandId];
            if (command.status !== 'pending' && command.completedAt && command.completedAt < commandsCutoff) {
              await commandsRef.child(`${stationId}/${commandId}`).remove();
            }
          }
        }
        logger.info('Cleaned up expired commands');
      }

      // Clean up offline stations after 1 hour
      const offlineCutoff = getTimestamp() - (60 * 60 * 1000);
      const liveStationsRef = this.db.ref('live/stations');
      const liveStationsSnapshot = await liveStationsRef.once('value');
      
      if (liveStationsSnapshot.exists()) {
        const stations = liveStationsSnapshot.val();
        for (const stationId in stations) {
          const station = stations[stationId];
          if (!station.online && station.lastHeartbeat < offlineCutoff) {
            await liveStationsRef.child(stationId).remove();
            logger.info(`Removed offline station from live data: ${stationId}`);
          }
        }
      }

      // Clean up transaction cache for inactive transactions
      const activeTransactions = new Set();
      if (liveStationsSnapshot.exists()) {
        const stations = liveStationsSnapshot.val();
        for (const stationId in stations) {
          const station = stations[stationId];
          if (station.connectors) {
            for (const connectorId in station.connectors) {
              const connector = station.connectors[connectorId];
              if (connector.txId) {
                activeTransactions.add(`${stationId}-${connectorId}-${connector.txId}`);
              }
            }
          }
        }
      }
      
      // Xóa các transaction cũ khỏi cache
      for (const transactionKey of this.transactionStartValues.keys()) {
        if (!activeTransactions.has(transactionKey)) {
          this.transactionStartValues.delete(transactionKey);
          logger.debug(`Cleaned up transaction cache: ${transactionKey}`);
        }
      }
      
      return true;
    } catch (error) {
      logger.error('Error cleaning up expired data:', error);
      return false;
    }
  }

  // Trigger sync to Firestore (không chặn luồng chính)
  triggerStationSync(stationId, stationData) {
    // Import động để tránh circular dependency
    import('./syncService.js').then(({ syncService }) => {
      if (syncService && syncService.isRunning) {
        syncService.syncSingleStation(stationId, stationData).catch(error => {
          logger.error(`Error syncing station ${stationId} to Firestore:`, error);
        });
      }
    }).catch(error => {
      logger.debug('SyncService not available:', error.message);
    });
  }
}

export const realtimeService = new RealtimeService();
