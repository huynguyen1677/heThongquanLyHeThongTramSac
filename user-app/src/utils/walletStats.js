/**
 * Tính tổng số tiền đã trừ ra cho các phiên sạc (demo)
 * @param {Array} transactions - Mảng lịch sử giao dịch
 * @returns {number} - Tổng số tiền đã thanh toán cho sạc
 */
export function totalChargingPayment(transactions) {
  if (!Array.isArray(transactions)) return 0;
  return transactions.reduce((sum, item) => {
    if (item.type === 'payment' && item.status === 'completed') {
      return sum + Math.abs(item.amount);
    }
    return sum;
  }, 0);
}