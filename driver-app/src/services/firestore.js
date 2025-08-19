import { firestore } from './firebase';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';

export const firestoreService = {
  // Lấy lịch sử giao dịch của user
  async getTransactionHistory(userId, limit = 50) {
    try {
      // Tạm thời disable để tránh lỗi permissions
      console.warn('Transaction history temporarily disabled due to permissions');
      return [];
      
      // TODO: Cần config Firebase rules cho collection transactions
      const q = query(
        collection(firestore, 'transactions'),
        where('userId', '==', userId),
        orderBy('startTs', 'desc'),
        // limit(limit)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return []; // Return empty array instead of throwing
    }
  },

  // Lấy chi tiết giao dịch
  async getTransaction(txId) {
    try {
      const docRef = doc(firestore, 'transactions', txId.toString());
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      } else {
        throw new Error('Transaction not found');
      }
    } catch (error) {
      console.error('Error getting transaction:', error);
      throw error;
    }
  },

  // Lấy giá điện hiện tại từ settings
  async getCurrentPrice() {
    try {
      const docRef = doc(firestore, 'setting', 'pricePerKwh');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const value = docSnap.data().value;
        return typeof value === 'number' ? value : 3500;
      } else {
        console.warn('Price document not found, using default price');
        return 3500; // Giá mặc định
      }
    } catch (error) {
      console.warn('Error getting current price from Firestore:', error.message);
      return 3500; // Fallback
    }
  }
};
