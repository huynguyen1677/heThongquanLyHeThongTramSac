/**
 * BaseService - Lớp cơ sở cho tất cả services
 * Chứa các method dùng chung như error handling, date utilities, validation
 */

export class BaseService {
  
  // ===== ERROR HANDLING =====
  
  /**
   * Xử lý lỗi thống nhất cho tất cả services
   * @param {Error} error - Lỗi cần xử lý
   * @param {string} context - Ngữ cảnh xảy ra lỗi
   * @param {boolean} throwError - Có throw lỗi lại không
   */
  static handleError(error, context = 'Unknown context', throwError = true) {
    const errorMessage = `[${context}] ${error.message}`;
    console.error(errorMessage, error);
    
    // Log detailed error for debugging
    if (import.meta.env?.DEV) {
      console.error('Error stack:', error.stack);
    }
    
    if (throwError) {
      throw new Error(errorMessage);
    }
    
    return null;
  }

  /**
   * Validate required fields
   * @param {Object} data - Dữ liệu cần validate
   * @param {Array} requiredFields - Danh sách field bắt buộc
   */
  static validateRequiredFields(data, requiredFields) {
    const missingFields = requiredFields.filter(field => 
      !Object.prototype.hasOwnProperty.call(data, field) || 
      data[field] === null || 
      data[field] === undefined || 
      data[field] === ''
    );
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
  }

  // ===== DATE UTILITIES =====
  
  /**
   * Lấy khoảng thời gian theo loại
   * @param {string} timeRange - Loại thời gian: 'today', 'yesterday', 'week', 'month', 'year'
   * @param {number} selectedMonth - Tháng được chọn (0-11)
   * @param {number} selectedYear - Năm được chọn
   */
  static getDateRange(timeRange, selectedMonth = null, selectedYear = null) {
    const now = new Date();
    let startDate, endDate;

    switch (timeRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      
      case 'yesterday': {
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
        endDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);
        break;
      }
      
      case 'week': {
        const startOfWeek = new Date(now.getTime() - (now.getDay() * 24 * 60 * 60 * 1000));
        startDate = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      }
      
      case 'month':
        if (selectedMonth !== null && selectedYear !== null) {
          startDate = new Date(selectedYear, selectedMonth, 1);
          endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);
        } else {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        }
        break;
      
      case 'year': {
        const year = selectedYear || now.getFullYear();
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 11, 31, 23, 59, 59);
        break;
      }
      
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    return { startDate, endDate };
  }

  /**
   * Format date theo định dạng Việt Nam
   * @param {Date|string|number} date - Ngày cần format
   * @param {boolean} includeTime - Có bao gồm giờ không
   */
  static formatDate(date, includeTime = false) {
    if (!date) return 'N/A';
    
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'Invalid Date';
    
    const options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'Asia/Ho_Chi_Minh'
    };
    
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
      options.second = '2-digit';
    }
    
    return dateObj.toLocaleString('vi-VN', options);
  }

  /**
   * Chuyển đổi timestamp thành Date object
   * @param {Object} timestamp - Firebase Timestamp
   */
  static timestampToDate(timestamp) {
    if (!timestamp) return null;
    
    // Firebase Timestamp
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000);
    }
    
    // Regular timestamp
    if (typeof timestamp === 'number') {
      return new Date(timestamp);
    }
    
    // ISO string
    if (typeof timestamp === 'string') {
      return new Date(timestamp);
    }
    
    return timestamp;
  }

  // ===== DATA UTILITIES =====
  
  /**
   * Format currency theo VND
   * @param {number} amount - Số tiền
   */
  static formatCurrency(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) return '0 ₫';
    
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  /**
   * Format số lượng với dấu phân cách
   * @param {number} number - Số cần format
   */
  static formatNumber(number) {
    if (typeof number !== 'number' || isNaN(number)) return '0';
    
    return new Intl.NumberFormat('vi-VN').format(number);
  }

  /**
   * Tính phần trăm thay đổi
   * @param {number} current - Giá trị hiện tại
   * @param {number} previous - Giá trị trước đó
   */
  static calculatePercentageChange(current, previous) {
    if (!previous || previous === 0) return current > 0 ? 100 : 0;
    
    return Math.round(((current - previous) / previous) * 100);
  }

  /**
   * Làm tròn số đến n chữ số thập phân
   * @param {number} number - Số cần làm tròn
   * @param {number} decimals - Số chữ số thập phân
   */
  static roundNumber(number, decimals = 2) {
    if (typeof number !== 'number' || isNaN(number)) return 0;
    
    return Math.round(number * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  // ===== VALIDATION UTILITIES =====
  
  /**
   * Validate email format
   * @param {string} email - Email cần validate
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number (Việt Nam)
   * @param {string} phone - Số điện thoại cần validate
   */
  static isValidPhone(phone) {
    const phoneRegex = /^(\+84|84|0)([3|5|7|8|9])+([0-9]{8})$/;
    return phoneRegex.test(phone);
  }

  /**
   * Validate station ID format
   * @param {string} stationId - Station ID cần validate
   */
  static isValidStationId(stationId) {
    if (!stationId || typeof stationId !== 'string') return false;
    
    // Station ID format: 3-50 characters, alphanumeric và dash
    const stationIdRegex = /^[a-zA-Z0-9_-]{3,50}$/;
    return stationIdRegex.test(stationId);
  }

  // ===== ASYNC UTILITIES =====
  
  /**
   * Retry async function với exponential backoff
   * @param {Function} fn - Function cần retry
   * @param {number} maxRetries - Số lần retry tối đa
   * @param {number} baseDelay - Delay cơ bản (ms)
   */
  static async retryAsync(fn, maxRetries = 3, baseDelay = 1000) {
    let lastError;
    
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (i === maxRetries) {
          break;
        }
        
        // Exponential backoff
        const delay = baseDelay * Math.pow(2, i);
        await this.sleep(delay);
      }
    }
    
    throw lastError;
  }

  /**
   * Sleep function
   * @param {number} ms - Milliseconds to sleep
   */
  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Thực hiện các promises song song với giới hạn concurrency
   * @param {Array} items - Danh sách items
   * @param {Function} asyncFn - Async function để xử lý từng item
   * @param {number} concurrency - Số lượng promise chạy song song
   */
  static async mapConcurrent(items, asyncFn, concurrency = 5) {
    const results = [];
    
    for (let i = 0; i < items.length; i += concurrency) {
      const batch = items.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map(item => asyncFn(item))
      );
      results.push(...batchResults);
    }
    
    return results;
  }

  // ===== CACHE UTILITIES =====
  
  static cache = new Map();
  
  /**
   * Get cached data
   * @param {string} key - Cache key
   * @param {number} maxAge - Max age in milliseconds
   */
  static getCached(key, maxAge = 5 * 60 * 1000) { // 5 minutes default
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > maxAge) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  /**
   * Set cache data
   * @param {string} key - Cache key
   * @param {*} data - Data to cache
   */
  static setCached(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Clear cache
   * @param {string} key - Cache key to clear (optional, clears all if not provided)
   */
  static clearCache(key = null) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}

export default BaseService;