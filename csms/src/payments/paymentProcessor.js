import { CostCalculator } from './costCalculator.js';
import { BalanceUpdater } from './balanceUpdater.js';
import { RevenueSharing } from './revenueSharing.js';
import { UserModel } from '../models/user.js';
import { TransactionModel } from '../models/transaction.js';
import { logger } from '../utils/logger.js';

/**
 * Payment Processor - Xử lý thanh toán chính khi kết thúc phiên sạc
 */
export class PaymentProcessor {
  /**
   * Xử lý thanh toán khi kết thúc phiên sạc
   * @param {Object} paymentData - Dữ liệu thanh toán
   * @returns {Object} Kết quả xử lý thanh toán
   */
  static async processSessionPayment(paymentData) {
    const startTime = Date.now();
    logger.info('Starting session payment processing...', { paymentData });

    try {
      const {
        userId,
        transactionId,
        sessionId,
        sessionCost,
        stationId,
        connectorId,
        energyConsumed,
        duration
      } = paymentData;

      // Bước 1: Validate dữ liệu đầu vào
      await this.validatePaymentData(paymentData);

      // Bước 2: Lấy dữ liệu phiên sạc từ Firestore
      const sessionData = await this.getSessionData(transactionId, sessionId);
      
      // Bước 3: Tính toán chi phí
      const costResult = await this.calculateFinalCost(sessionData, sessionCost);
      
      // Bước 4: Validate chi phí
      const costValidation = CostCalculator.validateCost(costResult);
      if (!costValidation.isValid) {
        throw new Error(`Cost validation failed: ${costValidation.errors.join(', ')}`);
      }

      // Bước 5: Kiểm tra số dư user
      const balanceCheck = await BalanceUpdater.checkSufficientBalance(userId, costResult.totalCost);
      if (!balanceCheck.sufficient) {
        throw new Error(`Insufficient balance. Required: ${costResult.totalCost}, Available: ${balanceCheck.currentBalance}`);
      }

      // Bước 6: Thực hiện thanh toán (trừ tiền)
      const paymentResult = await BalanceUpdater.processPayment(userId, costResult.totalCost, {
        transactionId,
        sessionId,
        stationId,
        connectorId,
        energyConsumed,
        description: `Charging session payment - Station ${stationId}`,
        costBreakdown: costResult
      });

      // Bước 7: Xử lý chia sẻ doanh thu (Revenue Sharing)
      let revenueSharingResult = null;
      try {
        revenueSharingResult = await RevenueSharing.processRevenueSharing({
          totalAmount: costResult.totalCost,
          stationId,
          transactionId,
          userId,
          sessionDetails: {
            sessionId,
            connectorId,
            energyConsumed,
            duration,
            costBreakdown: costResult
          }
        });
        
        logger.info('✅ Revenue sharing completed:', {
          ownerAmount: revenueSharingResult.revenueSharing.owner.amount,
          commissionAmount: revenueSharingResult.revenueSharing.superAdmin.amount
        });
      } catch (revenueSharingError) {
        logger.error('❌ Revenue sharing failed:', revenueSharingError);
        // Không throw error vì thanh toán của user đã thành công
        // Chỉ log lỗi để xử lý sau
      }

      // Bước 8: Cập nhật trạng thái transaction (tạm bỏ qua để test)
      try {
        await this.updateTransactionStatus(transactionId, paymentResult, costResult);
      } catch (updateError) {
        logger.warn(`⚠️ Could not update transaction status, but payment succeeded:`, updateError.message);
      }

      // Bước 9: Tạo kết quả cuối cùng
      const finalResult = {
        success: true,
        userId,
        transactionId,
        sessionId,
        costCalculation: costResult,
        payment: paymentResult,
        revenueSharing: revenueSharingResult,
        processingTime: Date.now() - startTime,
        completedAt: new Date().toISOString(),
        message: 'Session payment processed successfully'
      };

      logger.info('✅ Session payment completed successfully', {
        userId,
        transactionId,
        amount: costResult.totalCost,
        newBalance: paymentResult.newBalance,
        processingTime: finalResult.processingTime
      });

      return finalResult;

    } catch (error) {
      logger.error('Error processing session payment:', error);
      
      return {
        success: false,
        error: error.message,
        errorCode: error.code || 'PAYMENT_ERROR',
        processingTime: Date.now() - startTime,
        failedAt: new Date().toISOString(),
        paymentData
      };
    }
  }

  /**
   * Validate dữ liệu thanh toán
   * @param {Object} paymentData - Dữ liệu cần validate
   */
  static async validatePaymentData(paymentData) {
    const { userId, transactionId, sessionCost } = paymentData;

    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!transactionId && !paymentData.sessionId) {
      throw new Error('Transaction ID or Session ID is required');
    }

    if (sessionCost !== undefined && sessionCost < 0) {
      throw new Error('Session cost cannot be negative');
    }

    // Kiểm tra user tồn tại
    const user = await UserModel.getUserById(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    logger.debug('Payment data validation passed');
  }

  /**
   * Lấy dữ liệu phiên sạc từ Firestore
   * @param {string} transactionId - ID transaction
   * @param {string} sessionId - ID session
   * @returns {Object} Dữ liệu phiên sạc
   */
  static async getSessionData(transactionId, sessionId) {
    let sessionData = null;

    // Thử lấy từ transaction trước
    if (transactionId) {
      sessionData = await TransactionModel.getTransactionById(transactionId);
    }

    // Nếu không có, thử lấy từ charging session
    if (!sessionData && sessionId) {
      sessionData = await TransactionModel.getChargingSessionById(sessionId);
    }

    if (!sessionData) {
      throw new Error(`Session data not found. TransactionId: ${transactionId}, SessionId: ${sessionId}`);
    }

    logger.debug('Session data retrieved successfully', {
      transactionId,
      sessionId,
      energyConsumed: sessionData.energyConsumed
    });

    return sessionData;
  }

  /**
   * Tính toán chi phí cuối cùng
   * @param {Object} sessionData - Dữ liệu phiên sạc
   * @param {number} sessionCost - Chi phí từ session
   * @returns {Object} Kết quả tính toán chi phí
   */
  static async calculateFinalCost(sessionData, sessionCost) {
    // Tính toán chi phí từ dữ liệu session
    const calculatedCost = await CostCalculator.calculateSessionCost(sessionData);

    // Nếu có sessionCost từ simulator, so sánh và quyết định
    if (sessionCost !== undefined && sessionCost !== null) {
      const difference = Math.abs(calculatedCost.totalCost - sessionCost);
      const tolerance = 1.0; // Cho phép sai số 1 VND

      if (difference <= tolerance) {
        // Sử dụng chi phí đã tính toán
        logger.debug('Using calculated cost (matches session cost)', {
          calculated: calculatedCost.totalCost,
          session: sessionCost,
          difference
        });
        return calculatedCost;
      } else {
        // Có sự khác biệt lớn, log cảnh báo nhưng vẫn dùng calculated cost
        logger.warn('Cost mismatch detected', {
          calculated: calculatedCost.totalCost,
          session: sessionCost,
          difference
        });
        return calculatedCost;
      }
    } else {
      // Không có sessionCost, sử dụng calculated cost
      return calculatedCost;
    }
  }

  /**
   * Cập nhật trạng thái transaction sau thanh toán
   * @param {string} transactionId - ID transaction
   * @param {Object} paymentResult - Kết quả thanh toán
   * @param {Object} costResult - Kết quả tính chi phí
   */
  static async updateTransactionStatus(transactionId, paymentResult, costResult) {
    try {
      const updateData = {
        paymentStatus: paymentResult.success ? 'paid' : 'failed',
        paymentAmount: costResult.totalCost,
        paymentTime: new Date().toISOString(),
        finalBalance: paymentResult.newBalance,
        // costBreakdown: costResult, // Tạm bỏ để test
        status: paymentResult.success ? 'Completed' : 'Payment Failed'
      };

      logger.info(`Attempting to update transaction ${transactionId} with:`, updateData);
      await TransactionModel.updateTransactionPayment(transactionId, updateData);
      logger.debug(`Transaction status updated: ${transactionId}`);

    } catch (error) {
      logger.error('Error updating transaction status:', error.message);
      logger.warn('Continuing without transaction update - payment may still have succeeded');
      // Không throw error vì thanh toán có thể đã thành công
    }
  }

  /**
   * Xử lý hoàn tiền cho transaction
   * @param {Object} refundData - Dữ liệu hoàn tiền
   * @returns {Object} Kết quả hoàn tiền
   */
  static async processRefund(refundData) {
    try {
      const { userId, transactionId, reason, amount } = refundData;

      // Validate dữ liệu hoàn tiền
      if (!userId || !transactionId) {
        throw new Error('User ID and Transaction ID are required for refund');
      }

      // Lấy thông tin transaction
      const transaction = await TransactionModel.getTransactionById(transactionId);
      if (!transaction) {
        throw new Error(`Transaction not found: ${transactionId}`);
      }

      // Xác định số tiền hoàn
      const refundAmount = amount || transaction.paymentAmount || 0;
      if (refundAmount <= 0) {
        throw new Error('Invalid refund amount');
      }

      // Thực hiện hoàn tiền
      const refundResult = await BalanceUpdater.processRefund(userId, refundAmount, {
        originalTransactionId: transactionId,
        reason: reason || 'Transaction refund',
        description: `Refund for transaction ${transactionId}`
      });

      // Cập nhật trạng thái transaction
      await TransactionModel.updateTransactionPayment(transactionId, {
        paymentStatus: 'refunded',
        refundAmount,
        refundTime: new Date().toISOString(),
        refundReason: reason
      });

      logger.info(`Refund processed successfully: ${transactionId}, Amount: ${refundAmount}`);

      return {
        success: true,
        transactionId,
        refundAmount,
        refundResult,
        processedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Error processing refund:', error);
      throw error;
    }
  }

  /**
   * Lấy thống kê thanh toán
   * @param {Object} options - Tùy chọn thống kê
   * @returns {Object} Thống kê thanh toán
   */
  static async getPaymentStatistics(options = {}) {
    try {
      const { userId, startDate, endDate, stationId } = options;

      // Sẽ implement sau khi cần thiết
      logger.info('Getting payment statistics...', options);

      return {
        totalPayments: 0,
        totalAmount: 0,
        averageSessionCost: 0,
        // ... thêm các thống kê khác
      };

    } catch (error) {
      logger.error('Error getting payment statistics:', error);
      throw error;
    }
  }
}

export default PaymentProcessor;
