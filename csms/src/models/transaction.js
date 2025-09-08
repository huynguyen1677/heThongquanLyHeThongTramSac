import { firestoreService } from '../services/firestore.js';
import { logger } from '../utils/logger.js';

/**
 * Transaction Model - Quản lý dữ liệu phiên sạc/transaction
 */
export class TransactionModel {
  /**
   * Lấy thông tin transaction theo ID
   * @param {string|number} transactionId - ID của transaction
   * @returns {Object|null} Thông tin transaction hoặc null
   */
  static async getTransactionById(transactionId) {
    try {
      // Sử dụng Firestore service đã có sẵn
      const transaction = await firestoreService.getChargingSession(transactionId);
      
      if (transaction) {
        logger.debug(`Transaction retrieved: ${transactionId}`);
        return transaction;
      }
      
      logger.warn(`Transaction not found: ${transactionId}`);
      return null;
    } catch (error) {
      logger.error(`Error getting transaction ${transactionId}:`, error);
      throw error;
    }
  }

  /**
   * Lấy thông tin charging session theo ID
   * @param {string} sessionId - ID của charging session
   * @returns {Object|null} Thông tin session hoặc null
   */
  static async getChargingSessionById(sessionId) {
    try {
      // Sử dụng Firestore service đã có sẵn
      const session = await firestoreService.getChargingSession(sessionId);
      
      if (session) {
        logger.debug(`Charging session retrieved: ${sessionId}`);
        return session;
      }
      
      logger.warn(`Charging session not found: ${sessionId}`);
      return null;
    } catch (error) {
      logger.error(`Error getting charging session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Lấy các transaction đã hoàn thành của user
   * @param {string} userId - ID của user
   * @param {number} limit - Giới hạn số lượng
   * @returns {Array} Danh sách transactions
   */
  static async getCompletedTransactionsByUser(userId, limit = 50) {
    try {
      if (!firestoreService.isAvailable()) {
        logger.warn('Firestore not available for getCompletedTransactionsByUser');
        return [];
      }

      const query = firestoreService.db.collection('chargingSessions')
        .where('userId', '==', userId)
        .where('status', '==', 'Completed')
        .orderBy('endTime', 'desc')
        .limit(limit);

      const snapshot = await query.get();
      const transactions = [];
      
      snapshot.forEach(doc => {
        transactions.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      logger.debug(`Retrieved ${transactions.length} completed transactions for user ${userId}`);
      return transactions;
    } catch (error) {
      logger.error(`Error getting completed transactions for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Cập nhật trạng thái payment của transaction
   * @param {string|number} transactionId - ID của transaction
   * @param {Object} paymentData - Dữ liệu thanh toán
   * @returns {boolean} Thành công hay không
   */
  static async updateTransactionPayment(transactionId, paymentData) {
    try {
      const updateData = {
        paymentStatus: paymentData.status || 'paid',
        paymentAmount: paymentData.amount,
        paymentTime: new Date().toISOString(),
        ...paymentData
      };

      logger.debug('updateTransactionPayment - updateData:', updateData); // Thêm dòng này

      const success = await firestoreService.updateChargingSession(transactionId, updateData);
      
      if (success) {
        logger.info(`Transaction payment updated: ${transactionId}`);
      }
      
      return success;
    } catch (error) {
      logger.error(`Error updating transaction payment ${transactionId}:`, error);
      logger.error('Full error object:', error); // Thêm dòng này để log chi tiết lỗi
      throw error;
    }
  }

  /**
   * Tính toán cost từ transaction data
   * @param {Object} transaction - Dữ liệu transaction
   * @returns {Object} Thông tin chi phí
   */
  static calculateTransactionCost(transaction) {
    try {
      const energyConsumed = transaction.energyConsumed || 0;
      const duration = transaction.duration || 0;
      const pricePerKwh = transaction.pricePerKwh || 0;
      
      // Tính cost theo năng lượng tiêu thụ
      const energyCost = energyConsumed * pricePerKwh;
      
      // Có thể thêm phí dịch vụ, thuế, v.v.
      const serviceFee = energyCost * 0.05; // 5% phí dịch vụ
      const totalCost = energyCost + serviceFee;
      
      return {
        energyConsumed,
        duration,
        pricePerKwh,
        energyCost: parseFloat(energyCost.toFixed(2)),
        serviceFee: parseFloat(serviceFee.toFixed(2)),
        totalCost: parseFloat(totalCost.toFixed(2))
      };
    } catch (error) {
      logger.error('Error calculating transaction cost:', error);
      throw error;
    }
  }

  /**
   * Lấy chi phí cuối cùng từ transaction
   * @param {string|number} transactionId - ID của transaction
   * @returns {number} Chi phí cuối cùng
   */
  static async getFinalCost(transactionId) {
    try {
      const transaction = await this.getTransactionById(transactionId);
      if (!transaction) {
        throw new Error(`Transaction not found: ${transactionId}`);
      }

      // Nếu đã có cost trong transaction, sử dụng luôn
      if (transaction.cost !== undefined && transaction.cost !== null) {
        return parseFloat(transaction.cost);
      }

      // Nếu chưa có, tính toán lại
      const costInfo = this.calculateTransactionCost(transaction);
      return costInfo.totalCost;
    } catch (error) {
      logger.error(`Error getting final cost for transaction ${transactionId}:`, error);
      throw error;
    }
  }
}

export default TransactionModel;
