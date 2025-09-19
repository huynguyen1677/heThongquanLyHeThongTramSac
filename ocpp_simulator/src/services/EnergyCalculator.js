/**
 * EnergyCalculator - Tính toán năng lượng tiêu thụ
 */
export class EnergyCalculator {
  constructor(basePowerKw = 11) {
    this.basePowerKw = basePowerKw;
  }

  /**
   * Tính toán công suất hiện tại dựa trên thời gian sạc
   * @param {number} chargingTimeMinutes - Thời gian sạc tính bằng phút
   * @param {number} basePowerKw - Công suất cơ bản
   * @returns {number} - Công suất hiện tại (kW)
   */
  calculateCurrentPowerKw(chargingTimeMinutes, basePowerKw = this.basePowerKw) {
    // Mô phỏng công suất giảm dần theo thời gian (curve charging)
    const timeHours = chargingTimeMinutes / 60;
    let targetPower;

    if (timeHours < 0.5) {
      // 30 phút đầu: công suất full
      targetPower = basePowerKw;
    } else if (timeHours < 1.5) {
      // Từ 30-90 phút: giảm dần xuống 80%
      const reductionFactor = 1 - (timeHours - 0.5) * 0.2;
      targetPower = basePowerKw * Math.max(reductionFactor, 0.8);
    } else {
      // Sau 90 phút: duy trì 80% công suất
      targetPower = basePowerKw * 0.8;
    }

    // Thêm dao động ngẫu nhiên để mô phỏng biến thiên công suất thực tế
    // Cho phép công suất dao động trong khoảng ±2 kW quanh target power
    const jitter = Math.random() * 4 - 2; // -2 đến +2 kW
    const maxPower = basePowerKw + 2; // giới hạn trên cho dao động
    const power = Math.max(0, Math.min(maxPower, targetPower + jitter));

    return Math.round(power * 100) / 100;
  }

  /**
   * Tính toán năng lượng tiêu thụ trong khoảng thời gian
   * @param {number} powerKw - Công suất (kW)
   * @param {number} intervalMs - Khoảng thời gian (milliseconds)
   * @returns {number} - Năng lượng tiêu thụ (Wh)
   */
  calculateEnergyConsumption(powerKw, intervalMs) {
    const intervalHours = intervalMs / (1000 * 60 * 60);
    const energyKwh = powerKw * intervalHours;
    return this.kwhToWh(energyKwh);
  }

  /**
   * Chuyển đổi kWh sang Wh
   * @param {number} kwh - Năng lượng (kWh)
   * @returns {number} - Năng lượng (Wh)
   */
  kwhToWh(kwh) {
    return kwh * 1000;
  }

  /**
   * Chuyển đổi Wh sang kWh
   * @param {number} wh - Năng lượng (Wh)
   * @returns {number} - Năng lượng (kWh)
   */
  whToKwh(wh) {
    return wh / 1000;
  }

  /**
   * Làm tròn giá trị năng lượng
   * @param {number} value - Giá trị cần làm tròn
   * @param {number} decimals - Số chữ số thập phân
   * @returns {number} - Giá trị đã làm tròn
   */
  roundEnergy(value, decimals = 0) {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }
}
