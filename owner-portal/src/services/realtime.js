import { ref, get, onValue, off } from 'firebase/database';
import { rtdb } from './firebase';
import FirestoreService from './firestore';

export class RealtimeService {
  
  // Lấy dữ liệu realtime của tất cả trạm sạc
  static async getRealtimeStations() {
    try {
      const stationsRef = ref(rtdb, 'live/stations');
      const snapshot = await get(stationsRef);
      
      if (snapshot.exists()) {
        return snapshot.val();
      } else {
        return {};
      }
    } catch (error) {
      console.error('Error getting realtime stations:', error);
      throw error;
    }
  }
  

  // Lấy dữ liệu realtime của một trạm sạc cụ thể
  static async getRealtimeStation(stationId) {
    try {
      const stationRef = ref(rtdb, `live/stations/${stationId}`);
      const snapshot = await get(stationRef);
      
      if (snapshot.exists()) {
        return snapshot.val();
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting realtime station:', error);
      throw error;
    }
  }

  // Đồng bộ dữ liệu từ Realtime Database sang Firestore
  static async syncRealtimeToFirestore(ownerId) {
    try {
      console.log('🔄 Starting sync from Realtime to Firestore for owner:', ownerId);
      
      // 1. Lấy tất cả dữ liệu realtime
      const realtimeStations = await this.getRealtimeStations();
      
      if (!realtimeStations || Object.keys(realtimeStations).length === 0) {
        console.log('⚠️ No realtime stations found');
        return { synced: 0, skipped: 0 };
      }

      let syncedCount = 0;
      let skippedCount = 0;

      // 2. Duyệt qua từng trạm sạc trong realtime
      for (const [stationId, realtimeData] of Object.entries(realtimeStations)) {
        try {
          // Kiểm tra xem trạm đã tồn tại trong Firestore chưa
          const existingStation = await FirestoreService.checkStationExists(stationId);
          
          if (existingStation) {
            console.log(`⏭️ Station ${stationId} already exists in Firestore, skipping...`);
            skippedCount++;
            continue;
          }

          // Tạo document mới cho Firestore với thông tin bổ sung
          const firestoreData = {
            stationId: stationId,
            ownerId: ownerId,
            
            // Thông tin cơ bản từ realtime (nếu có)
            vendor: realtimeData.vendor || 'Unknown',
            model: realtimeData.model || 'Unknown',
            firmwareVersion: realtimeData.firmwareVersion || '1.0.0',
            
            // Thông tin bổ sung cho app driver
            stationName: `Trạm sạc ${stationId}`, // Tên mặc định
            address: '', // Để trống, admin sẽ điền sau
            latitude: null,
            longitude: null,
            
            // Thông tin trạng thái
            status: realtimeData.online ? 'online' : 'offline',
            lastHeartbeat: realtimeData.lastHeartbeat || null,
            
            // Connectors từ realtime data
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

          // Tạo document trong Firestore
          await FirestoreService.createStation(firestoreData);
          console.log(`✅ Synced station ${stationId} to Firestore`);
          syncedCount++;

        } catch (error) {
          console.error(`❌ Error syncing station ${stationId}:`, error);
          skippedCount++;
        }
      }

      console.log(`🎉 Sync completed: ${syncedCount} synced, ${skippedCount} skipped`);
      return { synced: syncedCount, skipped: skippedCount };

    } catch (error) {
      console.error('Error syncing realtime to firestore:', error);
      throw error;
    }
  }

  // Lắng nghe thay đổi realtime của một trạm cụ thể
  static subscribeToStation(stationId, callback) {
    const stationRef = ref(rtdb, `live/stations/${stationId}`);
    
    const unsubscribe = onValue(stationRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val());
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Realtime subscription error:', error);
      callback(null);
    });

    return () => off(stationRef, 'value', unsubscribe);
  }

  // Lắng nghe thay đổi realtime của tất cả trạm sạc
  static subscribeToAllStations(callback) {
    const stationsRef = ref(rtdb, 'live/stations');
    
    const unsubscribe = onValue(stationsRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val());
      } else {
        callback({});
      }
    }, (error) => {
      console.error('Realtime subscription error:', error);
      callback({});
    });

    return () => off(stationsRef, 'value', unsubscribe);
  }
}

export default RealtimeService;
