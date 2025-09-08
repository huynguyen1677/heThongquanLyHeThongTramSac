import { fetchPricePerKwh } from '../api/priceApi.js';

export class PricingService {
  constructor() {
    this.pricePerKwh = null;
  }

  /**
   * Lấy giá điện từ API
   */
  async updatePriceFromApi(apiUrl) {
    try {
      const price = await fetchPricePerKwh(apiUrl);
      if (price) {
        this.setPricePerKwh(price);
        return price;
      }
      throw new Error('Invalid price received from API');
    } catch (error) {
      console.error('Failed to fetch price from API:', error);
      return null;
    }
  }

  /**
   * Cập nhật giá điện
   */
  setPricePerKwh(price) {
    this.pricePerKwh = price;
  }

  /**
   * Lấy giá điện hiện tại
   */
  getPricePerKwh() {
    return this.pricePerKwh || 0;
  }

  /**
   * Tính chi phí dựa trên năng lượng tiêu thụ
   */
  calculateCost(energyKwh) {
    return energyKwh * this.getPricePerKwh();
  }

  /**
   * Tính chi phí (làm tròn)
   */
  calculateCostRounded(energyKwh) {
    return this.calculateCost(energyKwh).toFixed(0);
  }
}