export class ChargingStateManager {
  constructor(fullChargeThresholdKwh = 37.23) {
    this.fullChargeThresholdKwh = fullChargeThresholdKwh;
    this.energyKwh = 0;
    this.currentPowerKw = 0;
    this.estimatedCost = 0;
    this.pricePerKwh = 3500; // Giá mặc định (VND)
    this.isChargingComplete = false;
  }

  /**
   * Cập nhật trạng thái năng lượng
   * @param {number} energyKwh - Năng lượng hiện tại (kWh)
   * @param {number} powerKw - Công suất hiện tại (kW)
   */
  updateEnergyState(energyKwh, powerKw) {
    this.energyKwh = Math.max(0, energyKwh);
    this.currentPowerKw = Math.max(0, powerKw);
    
    // Tính toán chi phí ước tính
    this.estimatedCost = Math.round(this.energyKwh * this.pricePerKwh);
    
    // Kiểm tra sạc đầy
    this.isChargingComplete = this.energyKwh >= this.fullChargeThresholdKwh;
  }

  /**
   * Đặt giá điện
   * @param {number} pricePerKwh - Giá điện (VND/kWh)
   */
  setPricePerKwh(pricePerKwh) {
    this.pricePerKwh = Math.max(0, pricePerKwh);
    // Cập nhật lại chi phí ước tính
    this.estimatedCost = Math.round(this.energyKwh * this.pricePerKwh);
  }

  /**
   * Kiểm tra xem đã sạc đầy chưa
   */
  isFullyCharged(currentEnergyKwh = null) {
    const energyToCheck = currentEnergyKwh !== null ? currentEnergyKwh : this.energyKwh;
    return energyToCheck >= this.fullChargeThresholdKwh;
  }

  /**
   * Lấy ngưỡng sạc đầy
   */
  getFullChargeThreshold() {
    return this.fullChargeThresholdKwh;
  }

  /**
   * Cập nhật ngưỡng sạc đầy
   */
  setFullChargeThreshold(thresholdKwh) {
    this.fullChargeThresholdKwh = Math.max(0.1, thresholdKwh);
    // Cập nhật lại trạng thái sạc đầy
    this.isChargingComplete = this.energyKwh >= this.fullChargeThresholdKwh;
  }

  /**
   * Tính phần trăm sạc
   */
  getChargingPercentage(currentEnergyKwh = null) {
    const energyToCheck = currentEnergyKwh !== null ? currentEnergyKwh : this.energyKwh;
    return Math.min(100, (energyToCheck / this.fullChargeThresholdKwh) * 100);
  }

  /**
   * Reset trạng thái về ban đầu
   */
  reset() {
    this.energyKwh = 0;
    this.currentPowerKw = 0;
    this.estimatedCost = 0;
    this.isChargingComplete = false;
  }

  // Getter methods
  getEnergyKwh() {
    return this.energyKwh;
  }

  getCurrentPowerKw() {
    return this.currentPowerKw;
  }

  getEstimatedCost() {
    return this.estimatedCost;
  }

  getPricePerKwh() {
    return this.pricePerKwh;
  }

  getIsFullyCharged() {
    return this.isChargingComplete;
  }
}