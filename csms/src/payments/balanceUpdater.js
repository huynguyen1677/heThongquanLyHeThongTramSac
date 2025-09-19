import { UserModel } from '../models/user.js';
import { logger } from '../utils/logger.js';
import { firestoreService } from '../services/firestore.js';

/**
 * Balance Updater - Quản lý cập nhật số dư user
 */
export class BalanceUpdater {
  /**
   * Cập nhật số dư user sau khi thanh toán
   * @param {string} userId - ID của user
   * @param {number} newBalance - Số dư mới
   * @returns {Object} Kết quả cập nhật
   */
  static async updateUserBalance(userId, newBalance) {
    try {
      const success = await UserModel.updateUserBalance(userId, newBalance);
      
      if (success) {
        logger.info(`Balance updated successfully: ${userId} -> ${newBalance}`);
        return {
          userId,
          newBalance,
          success: true,
          updatedAt: new Date().toISOString()
        };
      } else {
        throw new Error('Failed to update balance');
      }
    } catch (error) {
      logger.error(`Error updating balance for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Thực hiện thanh toán (trừ tiền từ tài khoản user)
   * @param {string} userId - ID của user
   * @param {number} amount - Số tiền cần trừ
   * @param {Object} paymentDetails - Chi tiết thanh toán
   * @returns {Object} Kết quả thanh toán
   */
  static async processPayment(userId, amount, paymentDetails = {}) {
    try {
      logger.info(`💳 Processing payment: User ${userId}, Amount: ${amount} VND`);
      
      // Kiểm tra số tiền hợp lệ
      if (amount <= 0) {
        throw new Error('Payment amount must be positive');
      }

      // Lấy số dư hiện tại
      const currentBalance = await UserModel.getBalance(userId);
      logger.info(`💰 Current balance: ${currentBalance} VND, Required: ${amount} VND`);
      
      // Kiểm tra số dư đủ để thanh toán
      if (currentBalance < amount) {
        throw new Error(`Insufficient balance. Current: ${currentBalance} VND, Required: ${amount} VND`);
      }

      // Thực hiện trừ tiền
      const deductResult = await UserModel.deductBalance(userId, amount);

      // Lưu lịch sử thanh toán
      const paymentRecord = await this.savePaymentRecord(userId, amount, paymentDetails, deductResult);

      const result = {
        ...deductResult,
        paymentRecord,
        message: 'Payment processed successfully'
      };

      logger.info(`✅ Payment processed: ${userId}, Amount: ${amount}, New balance: ${deductResult.newBalance}`);
      return result;

    } catch (error) {
      logger.error(`❌ Error processing payment for user ${userId}: ${error.message}`);
      throw error; // Throw thay vì return error object
    }
  }

  /**
   * Hoàn tiền cho user
   * @param {string} userId - ID của user
   * @param {number} amount - Số tiền cần hoàn
   * @param {Object} refundDetails - Chi tiết hoàn tiền
   * @returns {Object} Kết quả hoàn tiền
   */
  static async processRefund(userId, amount, refundDetails = {}) {
    try {
      if (amount <= 0) {
        throw new Error('Refund amount must be positive');
      }

      // Thực hiện cộng tiền
      const addResult = await UserModel.addBalance(userId, amount);

      // Lưu lịch sử hoàn tiền
      const refundRecord = await this.saveRefundRecord(userId, amount, refundDetails, addResult);

      const result = {
        ...addResult,
        refundRecord,
        message: 'Refund processed successfully'
      };

      logger.info(`Refund processed: ${userId}, Amount: ${amount}, New balance: ${addResult.newBalance}`);
      return result;

    } catch (error) {
      logger.error(`Error processing refund for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Lưu lịch sử thanh toán
   * @param {string} userId - ID của user
   * @param {number} amount - Số tiền
   * @param {Object} paymentDetails - Chi tiết thanh toán
   * @param {Object} deductResult - Kết quả trừ tiền
   * @returns {Object} Record đã lưu
   */
  static async savePaymentRecord(userId, amount, paymentDetails, deductResult) {
    try {
      if (!firestoreService.isAvailable()) {
        logger.warn('Firestore not available for saving payment record');
        return null;
      }

      const paymentRecord = {
        userId,
        type: 'payment',
        amount,
        previousBalance: deductResult.previousBalance,
        newBalance: deductResult.newBalance,
        transactionId: paymentDetails.transactionId || null,
        sessionId: paymentDetails.sessionId || null,
        stationId: paymentDetails.stationId || null,
        connectorId: paymentDetails.connectorId || null,
        energyConsumed: paymentDetails.energyConsumed || 0,
        description: paymentDetails.description || 'Charging session payment',
        status: 'completed',
        createdAt: new Date().toISOString()
      };

      // Lưu vào collection payment_history
      const recordRef = firestoreService.db.collection('payment_history').doc();
      await recordRef.set(paymentRecord);

      paymentRecord.id = recordRef.id;
      logger.debug(`Payment record saved: ${recordRef.id}`);
      
      return paymentRecord;

    } catch (error) {
      logger.error('Error saving payment record:', error);
      return null;
    }
  }

  /**
   * Lưu lịch sử hoàn tiền
   * @param {string} userId - ID của user
   * @param {number} amount - Số tiền
   * @param {Object} refundDetails - Chi tiết hoàn tiền
   * @param {Object} addResult - Kết quả cộng tiền
   * @returns {Object} Record đã lưu
   */
  static async saveRefundRecord(userId, amount, refundDetails, addResult) {
    try {
      if (!firestoreService.isAvailable()) {
        logger.warn('Firestore not available for saving refund record');
        return null;
      }

      const refundRecord = {
        userId,
        type: 'refund',
        amount,
        previousBalance: addResult.previousBalance,
        newBalance: addResult.newBalance,
        originalTransactionId: refundDetails.originalTransactionId || null,
        reason: refundDetails.reason || 'Transaction refund',
        description: refundDetails.description || 'Refund for charging session',
        status: 'completed',
        createdAt: new Date().toISOString()
      };

      // Lưu vào collection payment_history
      const recordRef = firestoreService.db.collection('payment_history').doc();
      await recordRef.set(refundRecord);

      refundRecord.id = recordRef.id;
      logger.debug(`Refund record saved: ${recordRef.id}`);
      
      return refundRecord;

    } catch (error) {
      logger.error('Error saving refund record:', error);
      return null;
    }
  }

  /**
   * Lấy lịch sử thanh toán của user
   * @param {string} userId - ID của user
   * @param {number} limit - Giới hạn số lượng
   * @returns {Array} Danh sách lịch sử thanh toán
   */
  static async getPaymentHistory(userId, limit = 50) {
    try {
      if (!firestoreService.isAvailable()) {
        logger.warn('Firestore not available for getting payment history');
        return [];
      }

      const query = firestoreService.db.collection('payment_history')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(limit);

      const snapshot = await query.get();
      const history = [];
      
      snapshot.forEach(doc => {
        history.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      logger.debug(`Retrieved ${history.length} payment records for user ${userId}`);
      return history;

    } catch (error) {
      logger.error(`Error getting payment history for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Kiểm tra số dư user có đủ để thanh toán
   * @param {string} userId - ID của user
   * @param {number} amount - Số tiền cần kiểm tra
   * @returns {Object} Kết quả kiểm tra
   */
  static async checkSufficientBalance(userId, amount) {
    try {
      const currentBalance = await UserModel.getBalance(userId);
      const sufficient = currentBalance >= amount;
      
      return {
        userId,
        currentBalance,
        requiredAmount: amount,
        sufficient,
        shortage: sufficient ? 0 : (amount - currentBalance)
      };

    } catch (error) {
      logger.error(`Error checking balance for user ${userId}:`, error);
      throw error;
    }
  }
}

export default BalanceUpdater;
