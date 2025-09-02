/**
 * Đếm số lần sạc trong tháng hiện tại
 */
export function countMonthlyCharges(chargingHistory) {
  if (!Array.isArray(chargingHistory)) return 0;
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  return chargingHistory.filter(item => {
    const date = new Date(item.startTime);
    return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
  }).length;
}

/**
 * Tính tổng năng lượng đã sạc trong tháng hiện tại (kWh)
 */
export function totalMonthlyEnergy(chargingHistory) {
  if (!Array.isArray(chargingHistory)) return 0;
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  return chargingHistory.reduce((sum, item) => {
    const date = new Date(item.startTime);
    // Sử dụng đúng trường energyConsumed
    const energy = typeof item.energyConsumed === "number"
      ? item.energyConsumed
      : parseFloat(item.energyConsumed || 0);
    if (
      date.getMonth() === thisMonth &&
      date.getFullYear() === thisYear &&
      !isNaN(energy)
    ) {
      return sum + energy;
    }
    return sum;
  }, 0);
}

/**
 * Tính toán CO2 đã được tiết kiệm
 * @param {number} totalKWh - Tổng số kWh đã sử dụng
 * @param {number} [emissionFactor=0.25] - Hệ số phát thải, mặc định là 0.25 kg CO₂ mỗi kWh
 * @returns {number} - Số kg CO₂ đã được tiết kiệm
 */
export function calculateCO2Saved(totalKWh, emissionFactor = 0.25) {
  // emissionFactor: kg CO₂ tiết kiệm mỗi kWh
  return +(totalKWh * emissionFactor).toFixed(2); // làm tròn 2 số thập phân
}