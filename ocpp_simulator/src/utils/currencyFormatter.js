/**
 * Currency formatting utilities for OCPP Simulator
 * Ensures consistent rounding and formatting across all components
 */

/**
 * Formats a currency value in Vietnamese Dong with consistent rounding
 * @param {number} amount - The amount to format
 * @param {boolean} showSymbol - Whether to show the ₫ symbol
 * @returns {string} - Formatted currency string
 */
export function formatVND(amount, showSymbol = true) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return showSymbol ? '0₫' : '0';
  }
  
  // Always round to nearest dong (no decimals)
  const roundedAmount = Math.round(Number(amount));
  const formatted = roundedAmount.toLocaleString('vi-VN');
  
  return showSymbol ? `${formatted}₫` : formatted;
}

/**
 * Formats energy values consistently
 * @param {number} wh - Energy in Wh
 * @returns {string} - Formatted energy string
 */
export function formatEnergy(wh) {
  if (!wh || wh <= 0) return '0 Wh';
  
  const roundedWh = Math.round(Number(wh));
  
  if (roundedWh >= 1000) {
    return `${(roundedWh / 1000).toFixed(2)} kWh`;
  }
  return `${roundedWh} Wh`;
}

/**
 * Formats power values consistently
 * @param {number} kw - Power in kW
 * @returns {string} - Formatted power string
 */
export function formatPower(kw) {
  if (!kw || kw <= 0) return '0 kW';
  
  return `${Number(kw).toFixed(1)} kW`;
}

/**
 * Formats price per kWh consistently
 * @param {number} pricePerKwh - Price per kWh in VND
 * @returns {string} - Formatted price string
 */
export function formatPricePerKwh(pricePerKwh) {
  if (!pricePerKwh || pricePerKwh <= 0) return '0₫/kWh';
  
  const roundedPrice = Math.round(Number(pricePerKwh));
  return `${roundedPrice.toLocaleString('vi-VN')}₫/kWh`;
}

/**
 * Rounds a number to the nearest dong (for cost calculations)
 * @param {number} amount - The amount to round
 * @returns {number} - Rounded amount
 */
export function roundToDong(amount) {
  return Math.round(Number(amount) || 0);
}

/**
 * Formats kWh values consistently with decimal places
 * @param {number} kwh - Energy in kWh
 * @returns {string} - Formatted kWh string
 */
export function formatKwh(kwh) {
  if (!kwh || kwh <= 0) return '0.00 kWh';
  
  // kWh hiển thị với 2 chữ số thập phân
  return `${Number(kwh).toFixed(2)} kWh`;
}

/**
 * Calculates cost and rounds it properly
 * @param {number} energyKwh - Energy in kWh
 * @param {number} pricePerKwh - Price per kWh in VND
 * @returns {number} - Calculated and rounded cost
 */
export function calculateRoundedCost(energyKwh, pricePerKwh) {
  const cost = (Number(energyKwh) || 0) * (Number(pricePerKwh) || 0);
  return roundToDong(cost);
}
