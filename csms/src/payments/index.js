// Payment System Main Exports

import { handleStopTransaction } from './paymentService.js';

// Main processor
export { PaymentProcessor } from './paymentProcessor.js';

// Cost calculation
export { CostCalculator } from './costCalculator.js';

// Balance management
export { BalanceUpdater } from './balanceUpdater.js';

// Transaction handling
export { handleStopTransaction } from './paymentService.js';

// Convenience function để sử dụng nhanh
export async function processChargingSessionPayment(paymentData) {
  const { PaymentProcessor } = await import('./paymentProcessor.js');
  return PaymentProcessor.processSessionPayment(paymentData);
}

// Convenience function để hoàn tiền
export async function processRefund(refundData) {
  const { PaymentProcessor } = await import('./paymentProcessor.js');
  return PaymentProcessor.processRefund(refundData);
}

// Convenience function để kiểm tra số dư
export async function checkUserBalance(userId, amount) {
  const { BalanceUpdater } = await import('./balanceUpdater.js');
  return BalanceUpdater.checkSufficientBalance(userId, amount);
}

// Default export
export default {
  PaymentProcessor,
  CostCalculator,
  BalanceUpdater,
  processChargingSessionPayment,
  processRefund,
  checkUserBalance
};
