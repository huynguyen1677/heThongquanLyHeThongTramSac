// Example: Cách sử dụng Payment System trong CSMS

import { realtimeService } from './src/services/realtime.js';
import { processChargingSessionPayment, checkUserBalance } from './src/payments/index.js';
import { logger } from './src/utils/logger.js';

/**
 * EXAMPLE 1: Xử lý thanh toán tự động khi kết thúc phiên sạc
 * Đây là cách chính để tích hợp vào OCPP handler
 */
async function handleStopTransactionWithPayment(stationId, connectorId, transactionId, finalMeterValue) {
  try {
    logger.info(`🔌 Stopping transaction: ${stationId}/${connectorId} -> ${transactionId}`);

    // 1. Cập nhật meter value cuối cùng
    await realtimeService.updateConnectorMeterValues(stationId, connectorId, {
      currentWhReading: finalMeterValue,
      W_now: 0 // Công suất về 0 khi kết thúc
    });

    // 2. Dừng transaction và tự động xử lý thanh toán
    const result = await realtimeService.stopTransaction(
      stationId, 
      connectorId, 
      transactionId, 
      true // shouldProcessPayment = true
    );

    if (result) {
      logger.info('✅ Transaction stopped and payment processed successfully');
    } else {
      logger.error('❌ Failed to stop transaction');
    }

    return result;

  } catch (error) {
    logger.error('💥 Error in stop transaction with payment:', error);
    return false;
  }
}

/**
 * EXAMPLE 2: Kiểm tra số dư trước khi bắt đầu sạc
 * Sử dụng trong StartTransaction hoặc khi user yêu cầu sạc
 */
async function checkBalanceBeforeCharging(userId, estimatedSessionCost = 20000) {
  try {
    logger.info(`💳 Checking balance for user ${userId}...`);

    // Kiểm tra số dư qua realtime service
    const balanceCheck = await realtimeService.checkUserBalanceForCharging(userId, estimatedSessionCost);

    if (balanceCheck.sufficient) {
      logger.info(`✅ User has sufficient balance: ${balanceCheck.currentBalance} >= ${estimatedSessionCost}`);
      return true;
    } else {
      logger.warn(`⚠️ Insufficient balance: ${balanceCheck.currentBalance} < ${estimatedSessionCost}`);
      logger.warn(`💰 User needs to top up: ${balanceCheck.shortage} VND`);
      
      // Gửi notification cho user
      await realtimeService.sendNotification(
        'insufficient_balance',
        `Insufficient balance. Please top up ${balanceCheck.shortage} VND to start charging.`,
        null,
        userId
      );
      
      return false;
    }

  } catch (error) {
    logger.error('💥 Error checking balance:', error);
    return false;
  }
}

/**
 * EXAMPLE 3: Xử lý thanh toán thủ công (nếu cần)
 * Dùng khi thanh toán tự động thất bại hoặc cần xử lý lại
 */
async function manualPaymentProcessing(paymentData) {
  try {
    logger.info('🔧 Processing manual payment...', { 
      userId: paymentData.userId,
      transactionId: paymentData.transactionId 
    });

    const result = await processChargingSessionPayment(paymentData);

    if (result.success) {
      logger.info('✅ Manual payment successful:', {
        amount: result.costCalculation.totalCost,
        newBalance: result.payment.newBalance
      });

      // Gửi notification thành công
      await realtimeService.sendNotification(
        'payment_success',
        `Payment processed: ${result.costCalculation.totalCost} VND. New balance: ${result.payment.newBalance} VND`,
        null,
        paymentData.userId
      );

    } else {
      logger.error('❌ Manual payment failed:', result.error);

      // Gửi notification thất bại
      await realtimeService.sendNotification(
        'payment_failed',
        `Payment failed: ${result.error}`,
        null,
        paymentData.userId
      );
    }

    return result;

  } catch (error) {
    logger.error('💥 Error in manual payment processing:', error);
    throw error;
  }
}

/**
 * EXAMPLE 4: Lấy lịch sử thanh toán của user
 * Dùng cho API endpoint hoặc khi user yêu cầu xem lịch sử
 */
async function getUserPaymentHistory(userId, limit = 20) {
  try {
    logger.info(`📋 Getting payment history for user ${userId}...`);

    const history = await realtimeService.getPaymentHistory(userId, limit);

    logger.info(`📊 Found ${history.length} payment records`);

    // Format dữ liệu để trả về cho client
    const formattedHistory = history.map(record => ({
      id: record.id,
      type: record.type, // 'payment' hoặc 'refund'
      amount: record.amount,
      transactionId: record.transactionId,
      stationId: record.stationId,
      description: record.description,
      status: record.status,
      createdAt: record.createdAt,
      newBalance: record.newBalance
    }));

    return formattedHistory;

  } catch (error) {
    logger.error('💥 Error getting payment history:', error);
    return [];
  }
}

/**
 * EXAMPLE 5: OCPP StopTransaction Handler với thanh toán
 */
async function ocppStopTransactionHandler(stationId, request) {
  try {
    const { transactionId, meterStop, reason } = request;
    
    logger.info(`🔌 OCPP StopTransaction received: ${stationId} -> ${transactionId}`);

    // 1. Tìm connector từ transactionId
    const connectorId = await findConnectorByTransaction(stationId, transactionId);
    if (!connectorId) {
      throw new Error(`Connector not found for transaction ${transactionId}`);
    }

    // 2. Cập nhật meter value cuối
    await realtimeService.updateConnectorMeterValues(stationId, connectorId, {
      currentWhReading: meterStop,
      W_now: 0
    });

    // 3. Cập nhật connector status
    await realtimeService.updateConnectorStatus(stationId, connectorId, {
      status: 'Finishing',
      txId: transactionId,
      Wh_total: meterStop
    });

    // 4. Dừng transaction với thanh toán tự động
    const stopResult = await realtimeService.stopTransaction(
      stationId, 
      connectorId, 
      transactionId, 
      true // Auto payment
    );

    // 5. Cập nhật status cuối
    await realtimeService.updateConnectorStatus(stationId, connectorId, {
      status: 'Available',
      txId: null
    });

    // 6. Trả về response cho OCPP
    return {
      idTagInfo: {
        status: 'Accepted'
      }
    };

  } catch (error) {
    logger.error('💥 Error in OCPP StopTransaction handler:', error);
    
    return {
      idTagInfo: {
        status: 'Invalid'
      }
    };
  }
}

/**
 * EXAMPLE 6: API Endpoint cho User App
 */
async function apiGetUserBalance(userId) {
  try {
    const balanceCheck = await checkUserBalance(userId, 0);
    
    return {
      success: true,
      data: {
        userId,
        balance: balanceCheck.currentBalance,
        currency: 'VND'
      }
    };

  } catch (error) {
    logger.error('API Error - Get User Balance:', error);
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * EXAMPLE 7: API Endpoint để top up số dư
 */
async function apiTopUpBalance(userId, amount, paymentMethod = 'manual') {
  try {
    const { UserModel } = await import('./src/models/user.js');
    
    // Validate amount
    if (!amount || amount <= 0) {
      throw new Error('Invalid top-up amount');
    }

    // Thực hiện top up
    const result = await UserModel.addBalance(userId, amount);

    if (result.success) {
      logger.info(`💰 Balance topped up: ${userId} + ${amount} = ${result.newBalance}`);
      
      // Gửi notification
      await realtimeService.sendNotification(
        'balance_topped_up',
        `Balance topped up: +${amount} VND. New balance: ${result.newBalance} VND`,
        null,
        userId
      );
    }

    return {
      success: true,
      data: {
        userId,
        addedAmount: amount,
        newBalance: result.newBalance,
        paymentMethod
      }
    };

  } catch (error) {
    logger.error('API Error - Top Up Balance:', error);
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Helper function
async function findConnectorByTransaction(stationId, transactionId) {
  try {
    const stationData = await realtimeService.getStationLiveData(stationId);
    
    if (stationData && stationData.connectors) {
      for (const connectorId in stationData.connectors) {
        const connector = stationData.connectors[connectorId];
        if (connector.txId === transactionId) {
          return parseInt(connectorId);
        }
      }
    }
    
    return null;
  } catch (error) {
    logger.error('Error finding connector by transaction:', error);
    return null;
  }
}

// Export các function example
export {
  handleStopTransactionWithPayment,
  checkBalanceBeforeCharging,
  manualPaymentProcessing,
  getUserPaymentHistory,
  ocppStopTransactionHandler,
  apiGetUserBalance,
  apiTopUpBalance
};

// Example usage trong main code:
/*
// Trong OCPP handler:
import { ocppStopTransactionHandler } from './payment-examples.js';

// Khi nhận StopTransaction request
const response = await ocppStopTransactionHandler(stationId, request);

// Trong API routes:
import { apiGetUserBalance, apiTopUpBalance } from './payment-examples.js';

app.get('/api/user/:userId/balance', async (req, res) => {
  const result = await apiGetUserBalance(req.params.userId);
  res.json(result);
});

app.post('/api/user/:userId/topup', async (req, res) => {
  const result = await apiTopUpBalance(req.params.userId, req.body.amount);
  res.json(result);
});
*/
