import { firestoreService } from './firestore';

export const pricingService = {
  // Cache cho giá điện
  currentPrice: null,
  lastFetched: null,
  cacheDuration: 5 * 60 * 1000, // 5 phút

  // Lấy giá điện hiệu lực (với cache)
  async getEffectivePrice(stationId = null) {
    const now = Date.now();
    
    // Sử dụng cache nếu còn hạn
    if (this.currentPrice && this.lastFetched && (now - this.lastFetched) < this.cacheDuration) {
      return this.currentPrice;
    }

    try {
      // Ưu tiên lấy từ CSMS nếu có stationId
      if (stationId) {
        try {
          const { csmsApi } = await import('./csmsApi');
          const response = await csmsApi.getEffectivePrice(stationId);
          this.currentPrice = response.pricePerKwh;
          this.lastFetched = now;
          return this.currentPrice;
        } catch (error) {
          console.warn('Failed to get price from CSMS, falling back to Firestore');
        }
      }

      // Fallback: lấy từ Firestore
      this.currentPrice = await firestoreService.getCurrentPrice();
      this.lastFetched = now;
      return this.currentPrice;
    } catch (error) {
      console.error('Error getting effective price:', error);
      return 3500; // Giá mặc định nếu lỗi
    }
  },

  // Alias method for backward compatibility
  async getPricePerKwh(stationId = null) {
    return this.getEffectivePrice(stationId);
  },

  // Tính ước tính chi phí
  calculateEstimate(energyKwh, pricePerKwh = null) {
    const price = pricePerKwh || this.currentPrice || 3500;
    return Math.round(energyKwh * price);
  },

  // Format giá tiền VND
  formatPrice(amount) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
};
