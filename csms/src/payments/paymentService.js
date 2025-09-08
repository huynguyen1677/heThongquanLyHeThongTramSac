import { TransactionModel } from '../models/transaction.js';
import { PaymentProcessor } from './paymentProcessor.js';
import { logger } from '../utils/logger.js';

/**
 * Xử lý thanh toán khi kết thúc phiên sạc
 * @param {string|number} transactionId
 * @returns {Object} Kết quả thanh toán
 */
export async function handleStopTransaction(transactionId) {
  try {
    logger.info(`🔄 Starting payment processing for transaction: ${transactionId}`);

    // 1. Lấy dữ liệu phiên sạc vừa kết thúc từ Firestore
    let transaction = await TransactionModel.getTransactionById(transactionId);
    // Nếu không tìm thấy, thử lại sau 2 giây để xử lý race condition
    if (!transaction) {
      logger.warn(`Transaction ${transactionId} not found, retrying in 2 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      transaction = await TransactionModel.getTransactionById(transactionId);
    }
    if (!transaction) {
      throw new Error(`Transaction not found in Firestore after retry: ${transactionId}`);
    }

    logger.info(`📋 Transaction data retrieved:`, {
      transactionId,
      userId: transaction.userId,
      stationId: transaction.stationId,
      connectorId: transaction.connectorId,
      energyConsumed: transaction.energyConsumed,
      status: transaction.status
    });

    // 2. Kiểm tra trạng thái phiên (cho phép cả Completed và Stopped)
    if (!['Completed', 'Stopped', 'Finishing'].includes(transaction.status)) {
      logger.warn(`⚠️ Transaction status not ready for payment: ${transaction.status}`);
      // Không throw error, chỉ warning và tiếp tục xử lý
    }

    // 3. Kiểm tra có userId không
    if (!transaction.userId) {
      throw new Error(`Transaction ${transactionId} has no userId for payment processing`);
    }

    // 4. Chuẩn bị dữ liệu thanh toán đầy đủ
    const paymentData = {
      userId: transaction.userId,
      transactionId: transactionId,
      sessionId: transaction.sessionId || transactionId, // fallback nếu không có sessionId
      sessionCost: transaction.cost || transaction.totalCost || 0, // lấy cost đã tính
      stationId: transaction.stationId,
      connectorId: transaction.connectorId,
      energyConsumed: transaction.energyConsumed || 0,
      duration: transaction.duration || 0,
      pricePerKwh: transaction.pricePerKwh || null,
      startTime: transaction.startTime,
      endTime: transaction.endTime
    };

    logger.info(`💰 Payment data prepared:`, {
      userId: paymentData.userId,
      sessionCost: paymentData.sessionCost,
      energyConsumed: paymentData.energyConsumed
    });

    // 5. Xử lý thanh toán
    const paymentResult = await PaymentProcessor.processSessionPayment(paymentData);

    // 6. Cập nhật trạng thái payment cho transaction (tạm bỏ qua lỗi Firestore)
    try {
      if (paymentResult.success) {
        await TransactionModel.updateTransactionPayment(transactionId, {
          paymentStatus: 'paid',
          paymentAmount: paymentResult.costCalculation.totalCost,
          paymentTime: new Date().toISOString(),
          finalBalance: paymentResult.payment.newBalance
          // costBreakdown: paymentResult.costCalculation // Tạm bỏ để test
        });

        logger.info(`✅ Payment completed successfully for transaction ${transactionId}`);
      } else {
        await TransactionModel.updateTransactionPayment(transactionId, {
          paymentStatus: 'failed',
          paymentError: paymentResult.error,
          paymentTime: new Date().toISOString()
        });

        logger.error(`❌ Payment failed for transaction ${transactionId}: ${paymentResult.error}`);
      }
    } catch (updateError) {
      logger.warn(`⚠️ Could not update transaction ${transactionId} in Firestore:`, updateError.message);
      logger.info(`💡 Payment result was: ${paymentResult.success ? 'SUCCESS' : 'FAILED'}`);
    }

    return paymentResult;

  } catch (error) {
    logger.error(`💥 Error in handleStopTransaction for ${transactionId}:`, error);
    
    // Cập nhật trạng thái lỗi cho transaction
    try {
      await TransactionModel.updateTransactionPayment(transactionId, {
        paymentStatus: 'error',
        paymentError: error.message,
        paymentTime: new Date().toISOString()
      });
    } catch (updateError) {
      logger.error('Error updating transaction payment status:', updateError);
    }

    return {
      success: false,
      error: error.message,
      errorCode: 'PAYMENT_PROCESSING_ERROR',
      transactionId
    };
  }
}