import { logger } from '../utils/logger.js';
import { firestoreService } from '../services/firestore.js';
import { TransactionModel } from '../models/transaction.js';

/**
 * Cost Calculator - Tính toán chi phí phiên sạc
 */
export class CostCalculator {
  /**
   * Tính toán chi phí dựa trên dữ liệu phiên sạc
   * @param {Object} sessionData - Dữ liệu phiên sạc
   * @param {Object} options - Tùy chọn tính toán
   * @returns {Object} Thông tin chi phí chi tiết
   */
  static async calculateSessionCost(sessionData, options = {}) {
    try {
      const {
        energyConsumed = 0,
        duration = 0,
        pricePerKwh = null,
        stationId = null,
        connectorId = null,
        startTime = null,
        endTime = null
      } = sessionData;

      // Lấy giá điện hiện tại nếu chưa có
      let currentPricePerKwh = pricePerKwh;
      if (!currentPricePerKwh) {
        currentPricePerKwh = await this.getCurrentPricePerKwh();
      }

      // BTH - Tính cost theo simulator logic
      // Chuyển Wh sang kWh
      const energyKwh = energyConsumed / 1000;
      const energyCost = energyKwh * currentPricePerKwh;

      // BTH - Làm tròn lên (ceiling) như simulator để match
      const totalCost = Math.ceil(energyCost);

      const costBreakdown = {
        energyConsumed: Math.round(energyKwh * 100) / 100, // kWh với 2 chữ số thập phân
        duration: duration,
        pricePerKwh: currentPricePerKwh,
        energyCost: Math.ceil(energyCost),      // BTH - làm tròn lên như simulator
        serviceFee: 0,                          // BTH - không phí dịch vụ
        timeFee: 0,                             // BTH - không phí thời gian
        tax: 0,                                 // BTH - không thuế
        subtotal: Math.ceil(energyCost),        // BTH - chỉ có năng lượng
        totalCost: totalCost,                   // BTH - tổng = năng lượng (ceiling)
        currency: 'VND',
        calculatedAt: new Date().toISOString()
      };

      logger.debug('Cost calculated:', costBreakdown);
      return costBreakdown;

    } catch (error) {
      logger.error('Error calculating session cost:', error);
      throw error;
    }
  }

  /**
   * Tính toán lại chi phí từ transaction ID
   * @param {string|number} transactionId - ID của transaction
   * @param {number} sessionCost - Chi phí từ session (để so sánh)
   * @returns {Object} Thông tin chi phí
   */
  static async recalculateCost(transactionId, sessionCost = null) {
    try {
      // Lấy dữ liệu transaction từ Firestore
      const transaction = await TransactionModel.getTransactionById(transactionId);
      if (!transaction) {
        throw new Error(`Transaction not found: ${transactionId}`);
      }

      // Tính toán lại chi phí
      const calculatedCost = await this.calculateSessionCost(transaction);

      // So sánh với session cost nếu có
      const result = {
        transactionId,
        ...calculatedCost
      };

      if (sessionCost !== null) {
        result.sessionCost = sessionCost;
        result.costDifference = parseFloat(calculatedCost.totalCost - sessionCost);
        result.costMatch = Math.abs(result.costDifference) < 0.01; // Sai số dưới 0.01
      }

      logger.info(`Cost recalculated for transaction ${transactionId}: ${calculatedCost.totalCost}`);
      return result;

    } catch (error) {
      logger.error(`Error recalculating cost for transaction ${transactionId}:`, error);
      throw error;
    }
  }

  /**
   * Lấy giá điện hiện tại
   * @returns {number} Giá điện per kWh
   */
  static async getCurrentPricePerKwh() {
    try {
      const price = await firestoreService.getPricePerKwh();
      return price || 3000; // Giá mặc định 3000 VND/kWh
    } catch (error) {
      logger.warn('Error getting current price per kWh, using default:', error);
      return 3000;
    }
  }

  /**
   * Lấy tỷ lệ phí dịch vụ
   * @param {string} stationId - ID của station
   * @returns {number} Tỷ lệ phí dịch vụ (0.05 = 5%)
   */
  static async getServiceFeeRate(stationId = null) {
    try {
      // Có thể lấy từ config hoặc theo station
      const config = await firestoreService.getConfiguration('serviceFeeRate');
      return config?.value || 0.05; // 5% mặc định
    } catch (error) {
      logger.warn('Error getting service fee rate, using default:', error);
      return 0.05;
    }
  }

  /**
   * Tính phí theo thời gian
   * @param {number} duration - Thời gian sạc (phút)
   * @param {string} stationId - ID của station
   * @returns {number} Phí theo thời gian
   */
  static async calculateTimeFee(duration = 0, stationId = null) {
    try {
      // Chưa áp dụng phí theo thời gian
      return 0;
    } catch (error) {
      logger.warn('Error calculating time fee:', error);
      return 0;
    }
  }

  /**
   * Lấy tỷ lệ thuế
   * @returns {number} Tỷ lệ thuế (0.1 = 10%)
   */
  static async getTaxRate() {
    try {
      const config = await firestoreService.getConfiguration('taxRate');
      return config?.value || 0.1; // 10% VAT mặc định
    } catch (error) {
      logger.warn('Error getting tax rate, using default:', error);
      return 0.1;
    }
  }

  /**
   * Validate chi phí trước khi thanh toán
   * @param {Object} costData - Dữ liệu chi phí
   * @returns {Object} Kết quả validation
   */
  static validateCost(costData) {
    try {
      const {
        energyConsumed = 0,
        totalCost = 0,
        pricePerKwh = 0
      } = costData;

      const errors = [];

      // Kiểm tra các giá trị âm
      if (energyConsumed < 0) errors.push('Energy consumed cannot be negative');
      if (totalCost < 0) errors.push('Total cost cannot be negative');
      if (pricePerKwh < 0) errors.push('Price per kWh cannot be negative');

      // Kiểm tra logic cost
      if (energyConsumed > 0 && totalCost === 0) {
        errors.push('Total cost should not be zero when energy is consumed');
      }

      // Kiểm tra cost quá cao (có thể do lỗi)
      const maxReasonableCost = energyConsumed * 10000; // 10,000 VND/kWh max
      if (totalCost > maxReasonableCost) {
        errors.push(`Total cost seems too high: ${totalCost} > ${maxReasonableCost}`);
      }

      const isValid = errors.length === 0;

      return {
        isValid,
        errors,
        costData
      };

    } catch (error) {
      logger.error('Error validating cost:', error);
      return {
        isValid: false,
        errors: ['Validation error occurred'],
        costData
      };
    }
  }
}

export default CostCalculator;
