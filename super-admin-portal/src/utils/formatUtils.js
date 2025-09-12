/**
 * Format Utilities - Các hàm tiện ích để format dữ liệu
 */

// ===== DATE FORMATTING =====

/**
 * Format date từ nhiều định dạng khác nhau
 * @param {*} timestamp - Timestamp có thể là Firestore timestamp, ISO string, Date object
 * @param {string} locale - Locale (mặc định 'vi-VN')
 * @param {Object} options - Options cho toLocaleDateString
 * @returns {string} Formatted date string
 */
export const formatDate = (timestamp, locale = 'vi-VN', options = {}) => {
  if (!timestamp) return 'N/A';
  
  let date;
  try {
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      // Firestore timestamp
      date = timestamp.toDate();
    } else if (typeof timestamp === 'string') {
      // ISO string format like "2025-09-02T04:56:54.800Z"
      date = new Date(timestamp);
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'number') {
      // Unix timestamp
      date = new Date(timestamp);
    } else {
      return 'N/A';
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    
    const defaultOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      ...options
    };
    
    return date.toLocaleDateString(locale, defaultOptions);
  } catch (error) {
    console.warn('Error formatting date:', error);
    return 'N/A';
  }
};

/**
 * Format datetime với cả ngày và giờ
 * @param {*} timestamp 
 * @param {string} locale 
 * @returns {string}
 */
export const formatDateTime = (timestamp, locale = 'vi-VN') => {
  return formatDate(timestamp, locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

/**
 * Format time only
 * @param {*} timestamp 
 * @param {string} locale 
 * @returns {string}
 */
export const formatTime = (timestamp, locale = 'vi-VN') => {
  return formatDate(timestamp, locale, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

/**
 * Format relative time (ago)
 * @param {*} timestamp 
 * @returns {string}
 */
export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return 'N/A';
  
  try {
    let date;
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      return 'N/A';
    }
    
    if (isNaN(date.getTime())) return 'N/A';
    
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSecs < 60) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng trước`;
    return `${Math.floor(diffDays / 365)} năm trước`;
  } catch (error) {
    console.warn('Error formatting relative time:', error);
    return 'N/A';
  }
};

// ===== NUMBER FORMATTING =====

/**
 * Format currency (VND)
 * @param {number} amount 
 * @param {string} locale 
 * @param {string} currency 
 * @returns {string}
 */
export const formatCurrency = (amount, locale = 'vi-VN', currency = 'VND') => {
  if (amount === null || amount === undefined || isNaN(amount)) return '0 VND';
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    // Fallback
    return `${Number(amount).toLocaleString(locale)} ${currency}`;
  }
};

/**
 * Format number với dấu phẩy phân cách
 * @param {number} number 
 * @param {string} locale 
 * @param {number} decimals 
 * @returns {string}
 */
export const formatNumber = (number, locale = 'vi-VN', decimals = 0) => {
  if (number === null || number === undefined || isNaN(number)) return '0';
  
  try {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(number);
  } catch (error) {
    return Number(number).toFixed(decimals);
  }
};

/**
 * Format percentage
 * @param {number} value 
 * @param {number} total 
 * @param {number} decimals 
 * @returns {string}
 */
export const formatPercentage = (value, total, decimals = 1) => {
  if (!value || !total || total === 0) return '0%';
  
  const percentage = (value / total) * 100;
  return `${formatNumber(percentage, 'vi-VN', decimals)}%`;
};

/**
 * Format file size
 * @param {number} bytes 
 * @param {number} decimals 
 * @returns {string}
 */
export const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// ===== STRING FORMATTING =====

/**
 * Truncate text với ellipsis
 * @param {string} text 
 * @param {number} maxLength 
 * @param {string} suffix 
 * @returns {string}
 */
export const truncateText = (text, maxLength = 50, suffix = '...') => {
  if (!text || typeof text !== 'string') return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * Capitalize first letter
 * @param {string} text 
 * @returns {string}
 */
export const capitalizeFirst = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Format phone number
 * @param {string} phone 
 * @returns {string}
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Vietnamese phone number format
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  
  if (cleaned.length === 11 && cleaned.startsWith('84')) {
    return `+84 ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  }
  
  return phone;
};

/**
 * Format email để hiển thị (ẩn một phần)
 * @param {string} email 
 * @returns {string}
 */
export const formatEmailForDisplay = (email) => {
  if (!email || !email.includes('@')) return email;
  
  const [username, domain] = email.split('@');
  if (username.length <= 3) return email;
  
  const visiblePart = username.slice(0, 2);
  const hiddenPart = '*'.repeat(username.length - 2);
  
  return `${visiblePart}${hiddenPart}@${domain}`;
};

// ===== STATUS FORMATTING =====

/**
 * Format status với màu sắc và text
 * @param {string} status 
 * @returns {Object}
 */
export const formatStatus = (status) => {
  const statusMap = {
    'active': {
      text: 'Hoạt động',
      color: 'success',
      bgColor: '#dcfce7',
      textColor: '#166534'
    },
    'inactive': {
      text: 'Tạm ngưng',
      color: 'warning',
      bgColor: '#fee2e2',
      textColor: '#991b1b'
    },
    'pending': {
      text: 'Chờ xử lý',
      color: 'info',
      bgColor: '#dbeafe',
      textColor: '#1e40af'
    },
    'completed': {
      text: 'Hoàn thành',
      color: 'success',
      bgColor: '#dcfce7',
      textColor: '#166534'
    },
    'failed': {
      text: 'Thất bại',
      color: 'danger',
      bgColor: '#fee2e2',
      textColor: '#991b1b'
    },
    'processing': {
      text: 'Đang xử lý',
      color: 'info',
      bgColor: '#dbeafe',
      textColor: '#1e40af'
    }
  };
  
  return statusMap[status] || {
    text: status || 'N/A',
    color: 'secondary',
    bgColor: '#f3f4f6',
    textColor: '#374151'
  };
};

/**
 * Format role với màu sắc
 * @param {string} role 
 * @returns {Object}
 */
export const formatRole = (role) => {
  const roleMap = {
    'admin': {
      text: 'Admin',
      color: 'danger',
      bgColor: '#fce7f3',
      textColor: '#be185d'
    },
    'owner': {
      text: 'Owner',
      color: 'warning',
      bgColor: '#fef3c7',
      textColor: '#92400e'
    },
    'user': {
      text: 'User',
      color: 'info',
      bgColor: '#dbeafe',
      textColor: '#1e40af'
    },
    'driver': {
      text: 'Driver',
      color: 'success',
      bgColor: '#dcfce7',
      textColor: '#166534'
    }
  };
  
  return roleMap[role] || {
    text: role || 'N/A',
    color: 'secondary',
    bgColor: '#f3f4f6',
    textColor: '#374151'
  };
};

// ===== VALIDATION UTILITIES =====

/**
 * Validate email format
 * @param {string} email 
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate Vietnamese phone number
 * @param {string} phone 
 * @returns {boolean}
 */
export const isValidPhoneNumber = (phone) => {
  if (!phone) return false;
  
  const cleaned = phone.replace(/\D/g, '');
  
  // Vietnamese phone patterns
  return (
    (cleaned.length === 10 && cleaned.startsWith('0')) ||
    (cleaned.length === 11 && cleaned.startsWith('84'))
  );
};

/**
 * Validate URL
 * @param {string} url 
 * @returns {boolean}
 */
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// ===== DATA TRANSFORMATION =====

/**
 * Transform user data for display
 * @param {Object} user 
 * @returns {Object}
 */
export const transformUserForDisplay = (user) => {
  if (!user) return null;
  
  return {
    ...user,
    formattedName: user.name || 'N/A',
    formattedEmail: user.email || 'N/A',
    formattedPhone: formatPhoneNumber(user.phone),
    formattedCreatedAt: formatDate(user.createdAt),
    formattedUpdatedAt: formatDate(user.updatedAt || user.lastUpdated),
    formattedWalletBalance: formatCurrency(user.walletBalance),
    statusInfo: formatStatus(user.status),
    roleInfo: formatRole(user.role),
    relativeCreatedAt: formatRelativeTime(user.createdAt)
  };
};

/**
 * Transform array of data for display
 * @param {Array} dataArray 
 * @param {Function} transformFn 
 * @returns {Array}
 */
export const transformArrayForDisplay = (dataArray, transformFn = transformUserForDisplay) => {
  if (!Array.isArray(dataArray)) return [];
  
  return dataArray.map(item => transformFn(item));
};

// ===== EXPORT ALL =====
export default {
  // Date
  formatDate,
  formatDateTime,
  formatTime,
  formatRelativeTime,
  
  // Number
  formatCurrency,
  formatNumber,
  formatPercentage,
  formatFileSize,
  
  // String
  truncateText,
  capitalizeFirst,
  formatPhoneNumber,
  formatEmailForDisplay,
  
  // Status
  formatStatus,
  formatRole,
  
  // Validation
  isValidEmail,
  isValidPhoneNumber,
  isValidUrl,
  
  // Transform
  transformUserForDisplay,
  transformArrayForDisplay
};