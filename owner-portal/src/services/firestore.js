import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy 
} from 'firebase/firestore';
import { db } from './firebase';

export class FirestoreService {
  
  // Lấy tất cả trạm sạc của một owner
  static async getStationsByOwner(ownerId) {
    try {
      const stationsRef = collection(db, 'stations');
      const q = query(
        stationsRef, 
        where('ownerId', '==', ownerId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      const stations = [];
      querySnapshot.forEach((doc) => {
        stations.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return stations;
    } catch (error) {
      console.error('Error getting stations:', error);
      throw error;
    }
  }

  // Lấy thông tin chi tiết một trạm sạc
  static async getStation(stationId) {
    try {
      const stationRef = doc(db, 'stations', stationId);
      const stationSnap = await getDoc(stationRef);
      
      if (stationSnap.exists()) {
        return {
          id: stationSnap.id,
          ...stationSnap.data()
        };
      } else {
        throw new Error('Station not found');
      }
    } catch (error) {
      console.error('Error getting station:', error);
      throw error;
    }
  }

  // Tạo trạm sạc mới
  static async createStation(stationData) {
    try {
      const stationRef = doc(db, 'stations', stationData.stationId);
      
      const newStation = {
        ...stationData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'offline',
        lastHeartbeat: null,
        connectors: {
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
      
      await setDoc(stationRef, newStation);
      return { id: stationData.stationId, ...newStation };
    } catch (error) {
      console.error('Error creating station:', error);
      throw error;
    }
  }

  // Cập nhật thông tin trạm sạc
  static async updateStation(stationId, updateData) {
    try {
      const stationRef = doc(db, 'stations', stationId);
      
      const updatedData = {
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      
      await updateDoc(stationRef, updatedData);
      return updatedData;
    } catch (error) {
      console.error('Error updating station:', error);
      throw error;
    }
  }

  // Xóa trạm sạc
  static async deleteStation(stationId) {
    try {
      const stationRef = doc(db, 'stations', stationId);
      await deleteDoc(stationRef);
      return true;
    } catch (error) {
      console.error('Error deleting station:', error);
      throw error;
    }
  }

  // Kiểm tra xem stationId đã tồn tại chưa
  static async checkStationExists(stationId) {
    try {
      const stationRef = doc(db, 'stations', stationId);
      const stationSnap = await getDoc(stationRef);
      return stationSnap.exists();
    } catch (error) {
      console.error('Error checking station existence:', error);
      throw error;
    }
  }

  // Lấy tất cả transactions của owner
  static async getTransactionsByOwner(ownerId) {
    try {
      const transactionsRef = collection(db, 'transactions');
      const q = query(
        transactionsRef,
        where('ownerId', '==', ownerId),
        orderBy('startTime', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      const transactions = [];
      querySnapshot.forEach((doc) => {
        transactions.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return transactions;
    } catch (error) {
      console.error('Error getting transactions:', error);
      throw error;
    }
  }
}

export default FirestoreService;
