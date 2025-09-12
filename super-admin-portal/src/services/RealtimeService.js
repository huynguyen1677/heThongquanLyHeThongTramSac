/**
 * RealtimeService - Service xử lý dữ liệu realtime từ Firebase Realtime Database
 * Kế thừa từ BaseService để sử dụng các utilities chung
 */

import { ref, get, onValue, off, set, update, remove } from 'firebase/database';
import { rtdb } from './firebase';
import BaseService from './BaseService';
import FirestoreService from './FirestoreService';

export class RealtimeService extends BaseService {

  // ===== GENERIC REALTIME OPERATIONS =====

  /**
   * Lấy dữ liệu từ một path
   * @param {string} path - Đường dẫn đến dữ liệu
   */
  static async getData(path) {
    try {
      const dataRef = ref(rtdb, path);
      const snapshot = await get(dataRef);
      
      if (snapshot.exists()) {
        return snapshot.val();
      }
      
      return null;
    } catch (error) {
      return this.handleError(error, `Getting realtime data from ${path}`, false);
    }
  }

  /**
   * Set dữ liệu tại một path
   * @param {string} path - Đường dẫn đến dữ liệu
   * @param {*} data - Dữ liệu cần set
   */
  static async setData(path, data) {
    try {
      const dataRef = ref(rtdb, path);
      await set(dataRef, data);
      return true;
    } catch (error) {
      return this.handleError(error, `Setting realtime data at ${path}`, false);
    }
  }

  /**
   * Update dữ liệu tại một path
   * @param {string} path - Đường dẫn đến dữ liệu
   * @param {Object} updates - Object chứa các updates
   */
  static async updateData(path, updates) {
    try {
      const dataRef = ref(rtdb, path);
      await update(dataRef, updates);
      return true;
    } catch (error) {
      return this.handleError(error, `Updating realtime data at ${path}`, false);
    }
  }

  /**
   * Xóa dữ liệu tại một path
   * @param {string} path - Đường dẫn đến dữ liệu
   */
  static async removeData(path) {
    try {
      const dataRef = ref(rtdb, path);
      await remove(dataRef);
      return true;
    } catch (error) {
      return this.handleError(error, `Removing realtime data at ${path}`, false);
    }
  }

  // ===== STATIONS REALTIME OPERATIONS =====

  /**
   * Lấy dữ liệu realtime của tất cả stations
   */
  static async getRealtimeStations() {
    console.log('⚡ Fetching realtime stations data...');
    const data = await this.getData('live/stations');
    console.log(`⚡ Found ${data ? Object.keys(data).length : 0} realtime stations`);
    if (data && Object.keys(data).length > 0) {
      const firstKey = Object.keys(data)[0];
      console.log(`📄 Sample realtime station (${firstKey}):`, data[firstKey]);
    }
    return data;
  }

  /**
   * Lấy dữ liệu realtime của một station cụ thể
   * @param {string} stationId - ID của station
   */
  static async getRealtimeStation(stationId) {
    return this.getData(`live/stations/${stationId}`);
  }

  /**
   * Lấy trạng thái connectors của một station
   * @param {string} stationId - ID của station
   */
  static async getStationConnectors(stationId) {
    return this.getData(`live/stations/${stationId}/connectors`);
  }

  /**
   * Lấy trạng thái một connector cụ thể
   * @param {string} stationId - ID của station
   * @param {number} connectorId - ID của connector
   */
  static async getConnectorStatus(stationId, connectorId) {
    return this.getData(`live/stations/${stationId}/connectors/${connectorId}`);
  }

  /**
   * Lấy thông tin session hiện tại của station
   * @param {string} stationId - ID của station
   */
  static async getCurrentSession(stationId) {
    return this.getData(`live/stations/${stationId}/currentSession`);
  }

  /**
   * Lấy metrics realtime của station
   * @param {string} stationId - ID của station
   */
  static async getStationMetrics(stationId) {
    return this.getData(`live/stations/${stationId}/metrics`);
  }

  // ===== SUBSCRIPTION OPERATIONS =====

  /**
   * Subscribe to một path để lắng nghe thay đổi realtime
   * @param {string} path - Đường dẫn cần subscribe
   * @param {Function} callback - Callback function khi có thay đổi
   * @param {Function} errorCallback - Callback function khi có lỗi
   */
  static subscribeToPath(path, callback, errorCallback = null) {
    try {
      const dataRef = ref(rtdb, path);
      
      const unsubscribe = onValue(dataRef, (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.val());
        } else {
          callback(null);
        }
      }, (error) => {
        console.error(`Realtime subscription error for ${path}:`, error);
        if (errorCallback) {
          errorCallback(error);
        } else {
          callback(null);
        }
      });

      // Return unsubscribe function
      return () => off(dataRef, 'value', unsubscribe);
    } catch (error) {
      this.handleError(error, `Subscribing to realtime path ${path}`, false);
      return () => {}; // Return empty function
    }
  }

  /**
   * Subscribe to một station cụ thể
   * @param {string} stationId - ID của station
   * @param {Function} callback - Callback function
   * @param {Function} errorCallback - Error callback
   */
  static subscribeToStation(stationId, callback, errorCallback = null) {
    return this.subscribeToPath(`live/stations/${stationId}`, callback, errorCallback);
  }

  /**
   * Subscribe to tất cả stations
   * @param {Function} callback - Callback function
   * @param {Function} errorCallback - Error callback
   */
  static subscribeToAllStations(callback, errorCallback = null) {
    return this.subscribeToPath('live/stations', callback, errorCallback);
  }

  /**
   * Subscribe to connectors của một station
   * @param {string} stationId - ID của station
   * @param {Function} callback - Callback function
   * @param {Function} errorCallback - Error callback
   */
  static subscribeToStationConnectors(stationId, callback, errorCallback = null) {
    return this.subscribeToPath(`live/stations/${stationId}/connectors`, callback, errorCallback);
  }

  /**
   * Subscribe to system events
   * @param {Function} callback - Callback function
   * @param {Function} errorCallback - Error callback
   */
  static subscribeToSystemEvents(callback, errorCallback = null) {
    return this.subscribeToPath('live/system/events', callback, errorCallback);
  }

  // ===== DATA SYNCHRONIZATION =====

  /**
   * Đồng bộ dữ liệu từ Realtime Database sang Firestore
   * @param {string} ownerId - ID của owner (optional, nếu không có sẽ sync tất cả)
   * @param {boolean} forceSync - Có force sync không (bỏ qua cache)
   */
  static async syncRealtimeToFirestore(ownerId = null, forceSync = false) {
    try {
      console.log('🔄 Starting sync from Realtime to Firestore...');
      
      // Check cache nếu không force sync
      const cacheKey = `sync_${ownerId || 'all'}`;
      if (!forceSync) {
        const cached = this.getCached(cacheKey, 5 * 60 * 1000); // 5 minutes cache
        if (cached) {
          console.log('📋 Using cached sync result');
          return cached;
        }
      }

      // 1. Lấy tất cả dữ liệu realtime
      const realtimeStations = await this.getRealtimeStations();
      
      if (!realtimeStations || Object.keys(realtimeStations).length === 0) {
        console.log('⚠️ No realtime stations found');
        const result = { synced: 0, skipped: 0, errors: 0 };
        this.setCached(cacheKey, result);
        return result;
      }

      let syncedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;

      // 2. Duyệt qua từng station trong realtime data
      for (const [stationId, realtimeData] of Object.entries(realtimeStations)) {
        try {
          // Nếu chỉ định ownerId, chỉ sync stations của owner đó
          if (ownerId && realtimeData.ownerId !== ownerId) {
            continue;
          }

          // Kiểm tra xem station đã tồn tại trong Firestore chưa
          const existingStation = await FirestoreService.checkStationExists(stationId);

          if (existingStation) {
            // Update thông tin realtime vào Firestore
            const updateData = {
              status: realtimeData.online ? 'online' : 'offline',
              lastHeartbeat: realtimeData.lastHeartbeat || null,
              connectors: realtimeData.connectors || {},
              // Cập nhật thông tin từ realtime nếu có
              ...(realtimeData.vendor && { vendor: realtimeData.vendor }),
              ...(realtimeData.model && { model: realtimeData.model }),
              ...(realtimeData.firmwareVersion && { firmwareVersion: realtimeData.firmwareVersion })
            };

            await FirestoreService.updateStation(stationId, updateData);
            console.log(`🔄 Updated station ${stationId} with realtime data`);
            syncedCount++;
          } else {
            // Tạo station mới trong Firestore từ dữ liệu realtime
            const firestoreData = {
              stationId: stationId,
              ownerId: realtimeData.ownerId || 'unknown',

              // Thông tin cơ bản từ realtime
              vendor: realtimeData.vendor || 'Unknown',
              model: realtimeData.model || 'Unknown',
              firmwareVersion: realtimeData.firmwareVersion || 'N/A',

              // Thông tin cho app
              stationName: realtimeData.stationName || `Trạm sạc ${stationId}`,
              address: realtimeData.address || '',
              latitude: realtimeData.latitude || null,
              longitude: realtimeData.longitude || null,

              // Trạng thái
              status: realtimeData.online ? 'online' : 'offline',
              lastHeartbeat: realtimeData.lastHeartbeat || null,
              
              // Connectors
              connectors: realtimeData.connectors || {
                1: {
                  status: 'Available',
                  errorCode: 'NoError',
                  info: null,
                  vendorId: null,
                  vendorErrorCode: null,
                  lastUpdate: new Date().toISOString()
                },
                2: {
                  status: 'Available',
                  errorCode: 'NoError',
                  info: null,
                  vendorId: null,
                  vendorErrorCode: null,
                  lastUpdate: new Date().toISOString()
                }
              }
            };

            await FirestoreService.createStation(firestoreData);
            console.log(`✅ Created station ${stationId} in Firestore from realtime data`);
            syncedCount++;
          }

        } catch (error) {
          console.error(`❌ Error syncing station ${stationId}:`, error);
          errorCount++;
        }
      }

      const result = { 
        synced: syncedCount, 
        skipped: skippedCount, 
        errors: errorCount,
        timestamp: new Date().toISOString()
      };

      console.log(`🎉 Sync completed: ${syncedCount} synced, ${skippedCount} skipped, ${errorCount} errors`);
      
      // Cache result
      this.setCached(cacheKey, result);
      
      return result;

    } catch (error) {
      return this.handleError(error, 'Syncing realtime to firestore');
    }
  }

  /**
   * Đồng bộ dữ liệu từ Firestore sang Realtime Database
   * @param {string} stationId - ID của station cần sync
   * @param {Object} firestoreData - Dữ liệu từ Firestore
   */
  static async syncFirestoreToRealtime(stationId, firestoreData) {
    try {
      const realtimeData = {
        stationId: firestoreData.stationId || stationId,
        ownerId: firestoreData.ownerId,
        stationName: firestoreData.stationName || `Trạm sạc ${stationId}`,
        address: firestoreData.address || '',
        latitude: firestoreData.latitude || null,
        longitude: firestoreData.longitude || null,
        vendor: firestoreData.vendor || 'Unknown',
        model: firestoreData.model || 'Unknown',
        firmwareVersion: firestoreData.firmwareVersion || 'N/A',
        online: firestoreData.status === 'online',
        lastHeartbeat: firestoreData.lastHeartbeat,
        connectors: firestoreData.connectors || {},
        lastSync: new Date().toISOString()
      };

      await this.setData(`live/stations/${stationId}`, realtimeData);
      console.log(`✅ Synced station ${stationId} from Firestore to Realtime`);
      
      return true;
    } catch (error) {
      return this.handleError(error, `Syncing station ${stationId} from Firestore to Realtime`, false);
    }
  }

  // ===== SYSTEM MONITORING =====

  /**
   * Lấy system health status
   */
  static async getSystemHealth() {
    try {
      const [systemStatus, stationsOnline, activeTransactions] = await Promise.all([
        this.getData('live/system/status'),
        this.getOnlineStationsCount(),
        this.getData('live/system/activeTransactions')
      ]);

      return {
        systemStatus: systemStatus || 'unknown',
        stationsOnline: stationsOnline || 0,
        activeTransactions: activeTransactions || 0,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return this.handleError(error, 'Getting system health', false);
    }
  }

  /**
   * Đếm số lượng stations online
   */
  static async getOnlineStationsCount() {
    try {
      const stations = await this.getRealtimeStations();
      
      if (!stations) return 0;
      
      return Object.values(stations).filter(station => station.online === true).length;
    } catch (error) {
      this.handleError(error, 'Getting online stations count', false);
      return 0;
    }
  }

  /**
   * Lấy system alerts
   */
  static async getSystemAlerts() {
    return this.getData('live/system/alerts');
  }

  /**
   * Tạo system alert mới
   * @param {Object} alertData - Dữ liệu alert
   */
  static async createSystemAlert(alertData) {
    const alertId = `alert_${Date.now()}`;
    const enhancedAlert = {
      ...alertData,
      id: alertId,
      timestamp: new Date().toISOString(),
      status: 'active'
    };

    return this.setData(`live/system/alerts/${alertId}`, enhancedAlert);
  }

  /**
   * Clear system alert
   * @param {string} alertId - ID của alert
   */
  static async clearSystemAlert(alertId) {
    return this.removeData(`live/system/alerts/${alertId}`);
  }

  // ===== ANALYTICS & METRICS =====

  /**
   * Lấy realtime analytics data
   */
  static async getRealtimeAnalytics() {
    try {
      const analytics = await this.getData('live/analytics');
      
      if (!analytics) {
        return {
          totalStations: 0,
          onlineStations: 0,
          activeSessions: 0,
          totalEnergy: 0,
          totalRevenue: 0,
          timestamp: new Date().toISOString()
        };
      }

      return analytics;
    } catch (error) {
      return this.handleError(error, 'Getting realtime analytics', false);
    }
  }

  /**
   * Update realtime analytics
   * @param {Object} analyticsData - Dữ liệu analytics
   */
  static async updateRealtimeAnalytics(analyticsData) {
    const enhancedData = {
      ...analyticsData,
      timestamp: new Date().toISOString()
    };

    return this.setData('live/analytics', enhancedData);
  }

  // ===== UTILITY METHODS =====

  /**
   * Kiểm tra kết nối realtime database
   */
  static async checkConnection() {
    try {
      const testRef = ref(rtdb, '.info/connected');
      const snapshot = await get(testRef);
      return snapshot.val() === true;
    } catch (error) {
      this.handleError(error, 'Checking realtime database connection', false);
      return false;
    }
  }

  /**
   * Lấy server timestamp
   */
  static async getServerTimestamp() {
    try {
      const timestampRef = ref(rtdb, '.info/serverTimeOffset');
      const snapshot = await get(timestampRef);
      const offset = snapshot.val() || 0;
      return new Date(Date.now() + offset);
    } catch (error) {
      this.handleError(error, 'Getting server timestamp', false);
      return new Date();
    }
  }

  /**
   * Cleanup old realtime data
   * @param {number} maxAge - Tuổi tối đa của data (milliseconds)
   */
  static async cleanupOldData(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days default
    try {
      const cutoffTime = Date.now() - maxAge;
      
      // Cleanup old alerts
      const alerts = await this.getData('live/system/alerts');
      if (alerts) {
        for (const [alertId, alert] of Object.entries(alerts)) {
          if (new Date(alert.timestamp).getTime() < cutoffTime) {
            await this.removeData(`live/system/alerts/${alertId}`);
          }
        }
      }

      // Cleanup old events
      const events = await this.getData('live/system/events');
      if (events) {
        for (const [eventId, event] of Object.entries(events)) {
          if (new Date(event.timestamp).getTime() < cutoffTime) {
            await this.removeData(`live/system/events/${eventId}`);
          }
        }
      }

      console.log('🧹 Cleaned up old realtime data');
      return true;
    } catch (error) {
      return this.handleError(error, 'Cleaning up old realtime data', false);
    }
  }

}

export default RealtimeService;