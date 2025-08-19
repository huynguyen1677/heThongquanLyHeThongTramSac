import { realtimeService } from './realtime.js';
import { firestoreService } from './firestore.js';
import { logger } from '../utils/logger.js';

class SyncService {
  constructor() {
    this.isRunning = false;
    this.lastSyncTime = 0;
    // Bỏ auto sync interval - chỉ sync khi cần thiết
  }

  // Khởi động service - không cần interval
  start() {
    if (this.isRunning) {
      logger.warn('Sync service is already running');
      return;
    }

    this.isRunning = true;
    logger.info('🔄 Starting on-demand sync service (Realtime -> Firestore)');
    
    // Không cần sync tự động - chỉ sync khi có station kết nối
    logger.info('✅ On-demand sync service ready');
  }

  // Dừng service
  stop() {
    if (!this.isRunning) return;

    this.isRunning = false;
    logger.info('⏹️ Sync service stopped');
  }

  // Sync khi station kết nối (gọi từ realtime service)
  async syncOnStationConnect(stationId, liveData) {
    if (!this.isRunning) return false;

    try {
      logger.info(`🔄 Syncing station on connect: ${stationId}`);
      const result = await this.syncSingleStation(stationId, liveData);
      logger.info(`✅ Station connect sync completed: ${stationId} -> ${result}`);
      return true;
    } catch (error) {
      logger.error(`Error syncing station on connect ${stationId}:`, error);
      return false;
    }
  }

  // Sync một station cụ thể
  async syncSingleStation(stationId, liveData) {
    // Kiểm tra station đã tồn tại trong Firestore chưa
    const existingStation = await firestoreService.getStation(stationId);

    // Chuẩn bị dữ liệu Firestore với các trường cố định
    const firestoreData = this.prepareFirestoreData(stationId, liveData, existingStation);

    if (existingStation) {
      // Cập nhật station hiện có - chỉ update các trường cần thiết
      const updateData = this.getUpdateFields(firestoreData, existingStation);
      
      if (Object.keys(updateData).length > 0) {
        await firestoreService.saveStation({ id: stationId, ...updateData });
        logger.debug(`Updated station ${stationId} with:`, Object.keys(updateData));
        return 'updated';
      } else {
        return 'skipped';
      }
    } else {
      // Tạo station mới
      await firestoreService.saveStation(firestoreData);
      logger.info(`Created new station ${stationId} in Firestore`);
      return 'created';
    }
  }

  // Chuẩn bị dữ liệu Firestore với các trường cố định
  prepareFirestoreData(stationId, liveData, existingStation = null) {
    const baseData = {
      id: stationId,
      stationId: stationId,
      
      // Thông tin từ realtime database
      status: liveData.online ? 'online' : 'offline',
      lastHeartbeat: liveData.lastHeartbeat || null,
      
      // Thông tin cơ bản từ realtime (nếu có)
      vendor: liveData.vendor || 'SIM',
      model: liveData.model || 'SIM-X',
      firmwareVersion: liveData.firmwareVersion || '1.0.0',
      
      // Owner ID - ưu tiên từ realtime (Gmail), nếu không có thì dùng default
      ownerId: liveData.ownerId || 'admin@charging.system',
      
      // Connector data từ realtime
      connectors: liveData.connectors || this.getDefaultConnectors(),
    };

    // Nếu là station mới, thêm các trường mặc định
    if (!existingStation) {
      baseData.stationName = `Trạm sạc ${stationId}`;
      baseData.address = ''; // Để trống để owner tự điền
      baseData.latitude = null;
      baseData.longitude = null;
      baseData.createdAt = Date.now();
    } else {
      // Giữ lại các thông tin đã có, nhưng ưu tiên ownerId từ realtime
      baseData.stationName = existingStation.stationName || `Trạm sạc ${stationId}`;
      baseData.address = existingStation.address || '';
      baseData.latitude = existingStation.latitude || null;
      baseData.longitude = existingStation.longitude || null;
      baseData.createdAt = existingStation.createdAt || Date.now();
      
      // Ưu tiên ownerId từ realtime, nếu không có thì giữ ownerId cũ
      if (liveData.ownerId) {
        baseData.ownerId = liveData.ownerId; // Ưu tiên từ realtime
      } else {
        baseData.ownerId = existingStation.ownerId || 'admin@charging.system'; // Giữ cũ hoặc mặc định
      }
    }

    baseData.lastUpdated = Date.now();
    return baseData;
  }

  // Lấy các trường cần update (chỉ update nếu có thay đổi)
  getUpdateFields(newData, existingData) {
    const fieldsToCheck = [
      'status', 
      'lastHeartbeat', 
      'vendor', 
      'model', 
      'firmwareVersion', 
      'ownerId',
      'connectors'
    ];

    const updateData = {};
    
    for (const field of fieldsToCheck) {
      if (newData[field] !== undefined && 
          JSON.stringify(newData[field]) !== JSON.stringify(existingData[field])) {
        updateData[field] = newData[field];
      }
    }

    // Luôn cập nhật lastUpdated
    updateData.lastUpdated = newData.lastUpdated;

    return updateData;
  }

  // Tạo connectors mặc định
  getDefaultConnectors() {
    return {
      1: {
        status: 'Available',
        errorCode: 'NoError',
        info: null,
        vendorId: null,
        vendorErrorCode: null,
        lastUpdate: Date.now()
      },
      2: {
        status: 'Available',
        errorCode: 'NoError',
        info: null,
        vendorId: null,
        vendorErrorCode: null,
        lastUpdate: Date.now()
      }
    };
  }

  // Sync thủ công cho một station cụ thể
  async forceSyncStation(stationId) {
    try {
      logger.info(`🔄 Force syncing station: ${stationId}`);
      
      const liveData = await realtimeService.getStationLiveData(stationId);
      if (!liveData) {
        logger.warn(`No live data found for station: ${stationId}`);
        return false;
      }

      const result = await this.syncSingleStation(stationId, liveData);
      logger.info(`✅ Force sync completed for ${stationId}: ${result}`);
      return true;
    } catch (error) {
      logger.error(`Error force syncing station ${stationId}:`, error);
      return false;
    }
  }

  // Sync với owner ID cụ thể
  async syncStationsByOwner(ownerId) {
    try {
      logger.info(`🔄 Syncing stations for owner: ${ownerId}`);
      
      const liveStations = await realtimeService.getAllStationsLiveData();
      if (!liveStations) {
        logger.info('No live stations found');
        return { synced: 0, skipped: 0 };
      }

      let syncedCount = 0;
      let skippedCount = 0;

      for (const [stationId, liveData] of Object.entries(liveStations)) {
        // Chỉ sync stations của owner này hoặc stations chưa có owner
        if (liveData.ownerId === ownerId || !liveData.ownerId) {
          try {
            // Đặt ownerId cho station
            const dataWithOwner = { ...liveData, ownerId };
            const result = await this.syncSingleStation(stationId, dataWithOwner);
            
            if (result !== 'skipped') {
              syncedCount++;
              logger.info(`✅ Synced station ${stationId} for owner ${ownerId}`);
            } else {
              skippedCount++;
            }
          } catch (error) {
            logger.error(`Error syncing station ${stationId} for owner ${ownerId}:`, error);
            skippedCount++;
          }
        }
      }

      logger.info(`✅ Owner sync completed: ${syncedCount} synced, ${skippedCount} skipped`);
      return { synced: syncedCount, skipped: skippedCount };
    } catch (error) {
      logger.error(`Error syncing stations for owner ${ownerId}:`, error);
      return { synced: 0, skipped: 0 };
    }
  }

  // Cleanup stations không còn online
  async cleanupOfflineStations() {
    if (!firestoreService.isAvailable()) return;

    try {
      const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 giờ trước
      const allStations = await firestoreService.getAllStations();
      
      let cleanedCount = 0;
      
      for (const station of allStations) {
        if (station.status === 'offline' && 
            station.lastHeartbeat && 
            station.lastHeartbeat < cutoffTime) {
          
          // Kiểm tra xem station còn tồn tại trong realtime không
          const liveData = await realtimeService.getStationLiveData(station.id);
          
          if (!liveData) {
            // Xóa station khỏi Firestore nếu không còn trong realtime
            await firestoreService.db.collection('stations').doc(station.id).delete();
            logger.info(`🗑️ Cleaned up offline station: ${station.id}`);
            cleanedCount++;
          }
        }
      }
      
      if (cleanedCount > 0) {
        logger.info(`🧹 Cleanup completed: ${cleanedCount} stations removed`);
      }
    } catch (error) {
      logger.error('Error cleaning up offline stations:', error);
    }
  }

  // Get status
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastSyncTime: this.lastSyncTime,
      syncMode: 'on-demand' // Chỉ sync khi cần thiết
    };
  }
}

export const syncService = new SyncService();
