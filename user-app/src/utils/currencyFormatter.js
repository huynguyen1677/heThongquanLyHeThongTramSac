/**
 * Utility functions for formatting currency values in Vietnamese Dong
 */

/**
 * Formats a number as Vietnamese currency (VND) with proper rounding
 * @param {number|string} amount - The amount to format
 * @returns {string} - Formatted currency string with ₫ symbol
 */
export function formatVND(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0₫';
  }
  
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numericAmount)) {
    return '0₫';
  }
  
  // Round to nearest dong (no decimal places)
  const roundedAmount = Math.round(numericAmount);
  
  // Format with Vietnamese locale
  return `${roundedAmount.toLocaleString('vi-VN')}₫`;
}

/**
 * Formats a number as Vietnamese currency with sign prefix
 * @param {number|string} amount - The amount to format
 * @param {string} transactionType - Type of transaction ('deposit', 'withdraw', 'payment')
 * @returns {string} - Formatted currency string with +/- prefix and ₫ symbol
 */
export function formatVNDWithSign(amount, transactionType = 'payment') {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0₫';
  }
  
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numericAmount)) {
    return '0₫';
  }
  
  // Round to nearest dong
  const roundedAmount = Math.round(Math.abs(numericAmount));
  const formattedAmount = roundedAmount.toLocaleString('vi-VN');
  
  // Determine sign based on transaction type
  const sign = transactionType === 'deposit' ? '+' : '-';
  
  return `${sign}${formattedAmount}₫`;
}

/**
 * Parses a currency string or number to get the numeric value
 * @param {string|number} value - The value to parse
 * @returns {number} - Numeric value rounded to nearest dong
 */
export function parseVND(value) {
  if (value === null || value === undefined) {
    return 0;
  }
  
  if (typeof value === 'number') {
    return Math.round(value);
  }
  
  if (typeof value === 'string') {
    // Remove currency symbols, commas, and spaces
    const cleanValue = value.replace(/[₫,\s]/g, '');
    const numericValue = parseFloat(cleanValue);
    return isNaN(numericValue) ? 0 : Math.round(numericValue);
  }
  
  return 0;
}

/**
 * Formats a large number with appropriate units (K, M, B)
 * @param {number} amount - The amount to format
 * @returns {string} - Formatted string with unit suffix
 */
export function formatVNDCompact(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0₫';
  }
  
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numericAmount)) {
    return '0₫';
  }
  
  const roundedAmount = Math.round(numericAmount);
  
  if (roundedAmount >= 1000000000) {
    return `${(roundedAmount / 1000000000).toFixed(1)}B₫`;
  } else if (roundedAmount >= 1000000) {
    return `${(roundedAmount / 1000000).toFixed(1)}M₫`;
  } else if (roundedAmount >= 1000) {
    return `${(roundedAmount / 1000).toFixed(1)}K₫`;
  } else {
    return `${roundedAmount.toLocaleString('vi-VN')}₫`;
  }
}

/**
 * Checks if an amount is valid for transaction
 * @param {number|string} amount - The amount to validate
 * @param {number} minAmount - Minimum allowed amount (default: 1000)
 * @returns {object} - Validation result with isValid and message
 */
export function validateVNDAmount(amount, minAmount = 1000) {
  const numericAmount = parseVND(amount);
  
  if (numericAmount <= 0) {
    return {
      isValid: false,
      message: 'Số tiền phải lớn hơn 0₫'
    };
  }
  
  if (numericAmount < minAmount) {
    return {
      isValid: false,
      message: `Số tiền tối thiểu là ${formatVND(minAmount)}`
    };
  }
  
  return {
    isValid: true,
    message: 'Số tiền hợp lệ'
  };
}
