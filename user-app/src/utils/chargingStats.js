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
    // Sử dụng đúng trường energyConsumed (đơn vị Wh)
    const energyWh = typeof item.energyConsumed === "number"
      ? item.energyConsumed
      : parseFloat(item.energyConsumed || 0);
    
    if (
      date.getMonth() === thisMonth &&
      date.getFullYear() === thisYear &&
      !isNaN(energyWh)
    ) {
      // Chuyển đổi từ Wh sang kWh (chia cho 1000)
      return sum + (energyWh / 1000);
    }
    return sum;
  }, 0);
}

/**
 * Tính tổng năng lượng đã sạc của tất cả các phiên (kWh)
 */
export function totalAllEnergy(chargingHistory) {
  if (!Array.isArray(chargingHistory)) return 0;
  return chargingHistory.reduce((sum, item) => {
    const energyWh = typeof item.energyConsumed === "number"
      ? item.energyConsumed
      : parseFloat(item.energyConsumed || 0);
    return !isNaN(energyWh) ? sum + (energyWh / 1000) : sum;
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

/**
 * Đếm tổng số phiên sạc (có thể truyền vào mảng đã lọc)
 */
export function countTotalSessions(sessions) {
  if (!Array.isArray(sessions)) return 0;
  return sessions.length;
}

/**
 * Lọc các phiên hoàn thành (status hoàn thành hoặc có endTime)
 */
export function filterCompletedSessions(chargingHistory) {
  if (!Array.isArray(chargingHistory)) return [];
  return chargingHistory.filter(s => {
    const status = (s.status || '').toLowerCase();
    return (
      ['completed', 'finished', 'success'].includes(status) ||
      (!!s.endTime && status !== 'cancelled' && status !== 'failed')
    );
  });
}

/**
 * Tính tổng chi phí của tất cả các phiên sạc
 */
export function totalAllCost(chargingHistory) {
  if (!Array.isArray(chargingHistory)) return 0;
  return chargingHistory.reduce((sum, item) => {
    // Ưu tiên các trường cost phổ biến
    const cost = typeof item.estimatedCost === "number"
      ? item.estimatedCost
      : typeof item.cost === "number"
        ? item.cost
        : typeof item.totalCost === "number"
          ? item.totalCost
          : parseFloat(item.estimatedCost || item.cost || item.totalCost || 0);
    return !isNaN(cost) ? sum + cost : sum;
  }, 0);
}

/**
 * Tính thời gian trung bình (phút) của tất cả các phiên sạc
 */
export function averageSessionDuration(chargingHistory) {
  if (!Array.isArray(chargingHistory) || chargingHistory.length === 0) return 0;
  const totalDuration = chargingHistory.reduce((sum, item) => {
    // duration là số phút, nếu không có thì lấy 0
    const duration = typeof item.duration === "number"
      ? item.duration
      : parseFloat(item.duration || 0);
    return !isNaN(duration) ? sum + duration : sum;
  }, 0);
  return Math.round(totalDuration / chargingHistory.length);
}



/**
 * Tạo giao dịch thanh toán cho phiên sạc
 */
export function createPaymentTransaction(sessionData, cost) {
  return {
    id: Date.now(),
    type: 'payment',
    amount: -cost,
    method: 'Thanh toán sạc',
    status: 'completed',
    date: new Date(),
    description: `Thanh toán phiên sạc tại ${sessionData.stationName || 'Trạm sạc'}`,
    reference: `PAY${sessionData.sessionId?.slice(-6) || Date.now()}`,
    sessionId: sessionData.sessionId,
    energyConsumed: sessionData.energyConsumed,
    stationId: sessionData.stationId
  };
}