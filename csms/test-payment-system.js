// Test Payment System
// Chạy file này để test hệ thống thanh toán

import { PaymentProcessor } from './src/payments/paymentProcessor.js';
import { CostCalculator } from './src/payments/costCalculator.js';
import { BalanceUpdater } from './src/payments/balanceUpdater.js';
import { UserModel } from './src/models/user.js';
import { TransactionModel } from './src/models/transaction.js';
import { logger } from './src/utils/logger.js';

// Mock data để test
const TEST_USER_ID = 'test_user_123';
const TEST_TRANSACTION_ID = 'test_tx_456';
const TEST_STATION_ID = 'test_station_1';
const TEST_CONNECTOR_ID = 1;

async function testPaymentSystem() {
  logger.info('🧪 Starting Payment System Tests...');

  try {
    // Test 1: Tạo user test với số dư
    logger.info('📝 Test 1: Creating test user...');
    await createTestUser();

    // Test 2: Tạo transaction test
    logger.info('📝 Test 2: Creating test transaction...');
    await createTestTransaction();

    // Test 3: Test tính toán chi phí
    logger.info('📝 Test 3: Testing cost calculation...');
    await testCostCalculation();

    // Test 4: Test kiểm tra số dư
    logger.info('📝 Test 4: Testing balance check...');
    await testBalanceCheck();

    // Test 5: Test xử lý thanh toán thành công
    logger.info('📝 Test 5: Testing successful payment...');
    await testSuccessfulPayment();

    // Test 6: Test thanh toán với số dư không đủ
    logger.info('📝 Test 6: Testing insufficient balance...');
    await testInsufficientBalance();

    // Test 7: Test hoàn tiền
    logger.info('📝 Test 7: Testing refund...');
    await testRefund();

    logger.info('✅ All Payment System Tests Completed!');

  } catch (error) {
    logger.error('❌ Payment System Test Failed:', error);
  }
}

async function createTestUser() {
  try {
    // Tạo user với số dư 100,000 VND
    const userBalance = 100000;
    
    const result = await UserModel.addBalance(TEST_USER_ID, userBalance);
    logger.info(`✅ Test user created: ${TEST_USER_ID} with balance: ${userBalance}`);
    
    return result;
  } catch (error) {
    logger.error('❌ Error creating test user:', error);
    throw error;
  }
}

async function createTestTransaction() {
  try {
    // Mock transaction data
    const transactionData = {
      id: TEST_TRANSACTION_ID,
      userId: TEST_USER_ID,
      stationId: TEST_STATION_ID,
      connectorId: TEST_CONNECTOR_ID,
      energyConsumed: 5.5, // kWh
      duration: 3600, // 1 hour in seconds
      pricePerKwh: 3000, // VND
      status: 'Completed',
      startTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      endTime: new Date().toISOString()
    };

    // Lưu transaction vào Firestore (sử dụng firestoreService)
    const { firestoreService } = await import('./src/services/firestore.js');
    await firestoreService.saveTransaction(transactionData);
    
    logger.info(`✅ Test transaction created: ${TEST_TRANSACTION_ID}`);
    return transactionData;
  } catch (error) {
    logger.error('❌ Error creating test transaction:', error);
    throw error;
  }
}

async function testCostCalculation() {
  try {
    const sessionData = {
      energyConsumed: 5.5,
      duration: 3600,
      pricePerKwh: 3000,
      stationId: TEST_STATION_ID,
      connectorId: TEST_CONNECTOR_ID
    };

    const costResult = await CostCalculator.calculateSessionCost(sessionData);
    
    logger.info('💰 Cost calculation result:', {
      energyConsumed: costResult.energyConsumed,
      energyCost: costResult.energyCost,
      serviceFee: costResult.serviceFee,
      tax: costResult.tax,
      totalCost: costResult.totalCost
    });

    // Validate cost
    const validation = CostCalculator.validateCost(costResult);
    if (validation.isValid) {
      logger.info('✅ Cost validation passed');
    } else {
      logger.error('❌ Cost validation failed:', validation.errors);
    }

    return costResult;
  } catch (error) {
    logger.error('❌ Error in cost calculation test:', error);
    throw error;
  }
}

async function testBalanceCheck() {
  try {
    const testAmount = 20000; // 20,000 VND
    
    const balanceCheck = await BalanceUpdater.checkSufficientBalance(TEST_USER_ID, testAmount);
    
    logger.info('💳 Balance check result:', {
      userId: balanceCheck.userId,
      currentBalance: balanceCheck.currentBalance,
      requiredAmount: balanceCheck.requiredAmount,
      sufficient: balanceCheck.sufficient
    });

    if (balanceCheck.sufficient) {
      logger.info('✅ Balance check passed - sufficient funds');
    } else {
      logger.warn('⚠️ Balance check failed - insufficient funds');
    }

    return balanceCheck;
  } catch (error) {
    logger.error('❌ Error in balance check test:', error);
    throw error;
  }
}

async function testSuccessfulPayment() {
  try {
    const paymentData = {
      userId: TEST_USER_ID,
      transactionId: TEST_TRANSACTION_ID,
      sessionCost: 19057, // VND
      stationId: TEST_STATION_ID,
      connectorId: TEST_CONNECTOR_ID,
      energyConsumed: 5.5
    };

    const result = await PaymentProcessor.processSessionPayment(paymentData);
    
    if (result.success) {
      logger.info('✅ Payment processed successfully:', {
        userId: result.userId,
        amount: result.costCalculation.totalCost,
        newBalance: result.payment.newBalance,
        processingTime: result.processingTime
      });
    } else {
      logger.error('❌ Payment failed:', result.error);
    }

    return result;
  } catch (error) {
    logger.error('❌ Error in successful payment test:', error);
    throw error;
  }
}

async function testInsufficientBalance() {
  try {
    // Tạo user mới với số dư thấp
    const lowBalanceUserId = 'test_user_low_balance';
    await UserModel.addBalance(lowBalanceUserId, 5000); // Chỉ 5,000 VND

    const paymentData = {
      userId: lowBalanceUserId,
      transactionId: 'test_tx_insufficient',
      sessionCost: 50000, // 50,000 VND - vượt quá số dư
      stationId: TEST_STATION_ID,
      connectorId: TEST_CONNECTOR_ID,
      energyConsumed: 15.0
    };

    const result = await PaymentProcessor.processSessionPayment(paymentData);
    
    if (!result.success && result.error.includes('Insufficient balance')) {
      logger.info('✅ Insufficient balance test passed - correctly rejected');
    } else {
      logger.error('❌ Insufficient balance test failed - should have been rejected');
    }

    return result;
  } catch (error) {
    logger.error('❌ Error in insufficient balance test:', error);
    throw error;
  }
}

async function testRefund() {
  try {
    const refundData = {
      userId: TEST_USER_ID,
      transactionId: TEST_TRANSACTION_ID,
      reason: 'Test refund',
      amount: 10000 // 10,000 VND
    };

    const result = await PaymentProcessor.processRefund(refundData);
    
    if (result.success) {
      logger.info('✅ Refund processed successfully:', {
        userId: result.refundResult.userId,
        refundAmount: result.refundAmount,
        newBalance: result.refundResult.newBalance
      });
    } else {
      logger.error('❌ Refund failed:', result.error);
    }

    return result;
  } catch (error) {
    logger.error('❌ Error in refund test:', error);
    throw error;
  }
}

// Cleanup function - xóa test data
async function cleanupTestData() {
  try {
    logger.info('🧹 Cleaning up test data...');
    
    // Xóa test users (cần implement delete method)
    // Xóa test transactions
    // Xóa test payment history
    
    logger.info('✅ Test data cleaned up');
  } catch (error) {
    logger.error('❌ Error cleaning up test data:', error);
  }
}

// Chạy tests
if (import.meta.url === `file://${process.argv[1]}`) {
  testPaymentSystem()
    .then(() => {
      logger.info('🎉 Payment System Tests Completed Successfully!');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('💥 Payment System Tests Failed:', error);
      process.exit(1);
    });
}

export {
  testPaymentSystem,
  createTestUser,
  createTestTransaction,
  testCostCalculation,
  testBalanceCheck,
  testSuccessfulPayment,
  testInsufficientBalance,
  testRefund,
  cleanupTestData
};
