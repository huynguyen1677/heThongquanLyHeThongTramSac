export function formatEnergy(value) {
  if (value < 1) {
    return Math.round(value * 1000) + " Wh";
  }
  return value.toFixed(3) + " kWh";
}

export function formatCurrency(amount) {
  if (!amount || isNaN(amount)) return "0₫";
  return Math.floor(amount).toLocaleString('vi-VN') + "₫";
}