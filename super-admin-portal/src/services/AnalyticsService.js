/**
 * AnalyticsService - Service chuyên tính toán metrics, reports và analytics
 * Kế thừa từ BaseService để sử dụng các utilities chung
 */

import BaseService from './BaseService';
import FirestoreService from './FirestoreService';
import RealtimeService from './RealtimeService';

export class AnalyticsService extends BaseService {


  // ===== SYSTEM OVERVIEW ANALYTICS =====

  /**
   * Tính toán system overview cho Super Admin
   * @param {string} timeRange - Khoảng thời gian: 'today', 'week', 'month', 'year'
   * @param {number} selectedMonth - Tháng được chọn (0-11)
   * @param {number} selectedYear - Năm được chọn
   */
  static async calculateSystemOverview(timeRange = 'today', selectedMonth = null, selectedYear = null) {
    try {
      // Cache key for performance
      const cacheKey = `system_overview_${timeRange}_${selectedMonth}_${selectedYear}`;
      const cached = this.getCached(cacheKey, 2 * 60 * 1000); // 2 minutes cache
      if (cached) return cached;

      console.log('📊 Calculating system overview...');

      // Use Promise.allSettled to handle potential errors gracefully
      const [stationsResult, sessionsResult, paymentsResult, /* errorsResult, */ realtimeResult] = await Promise.allSettled([
        FirestoreService.getAllStations(),
        FirestoreService.getSessionsByOwner(null, timeRange, selectedMonth, selectedYear),
        FirestoreService.getPaymentsByTimeRange(timeRange, selectedMonth, selectedYear),
        RealtimeService.getRealtimeStations()
      ]);

      // Extract successful results, use empty arrays for failures
      const stations = stationsResult.status === 'fulfilled' ? stationsResult.value : [];
      const sessions = sessionsResult.status === 'fulfilled' ? sessionsResult.value : [];
      const payments = paymentsResult.status === 'fulfilled' ? paymentsResult.value : [];
      const realtimeData = realtimeResult.status === 'fulfilled' ? realtimeResult.value : null;

      // Log any failures
      if (stationsResult.status === 'rejected') console.warn('⚠️ Failed to load stations:', stationsResult.reason);
      if (sessionsResult.status === 'rejected') console.warn('⚠️ Failed to load sessions:', sessionsResult.reason);
      if (paymentsResult.status === 'rejected') console.warn('⚠️ Failed to load payments:', paymentsResult.reason);
      if (realtimeResult.status === 'rejected') console.warn('⚠️ Failed to load realtime data:', realtimeResult.reason);

      // Tính toán metrics cơ bản
      const totalStations = stations.length;
      const onlineStations = this.calculateOnlineStations(stations, realtimeData);
      const offlineStations = totalStations - onlineStations;
      
      const activeSessions = this.countChargingConnectors(realtimeData);

      const todayRevenue = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
      const todayEnergy = payments.reduce((sum, payment) => sum + (payment.energyConsumed || 0), 0);

      // Most common error: chỉ lấy từ realtime
      let mostCommonError = 'No errors';
      let errorCount = 0;
      if (realtimeData) {
        Object.values(realtimeData).forEach(station => {
          if (station.connectors) {
            Object.values(station.connectors).forEach(connector => {
              if (connector.status === 'Faulted') {
                mostCommonError = 'Faulted';
                errorCount++;
              }
            });
          }
        });
      }

      const overview = {
        totalStations,
        onlineStations,
        offlineStations,
        activeSessions,
        todayRevenue,
        todayEnergy: this.roundNumber(todayEnergy, 2),
        mostCommonError,
        errorCount,
        uptime: this.calculateSystemUptime(stations, realtimeData),
        utilizationRate: this.calculateUtilizationRate(stations, sessions),
        averageSessionDuration: this.calculateAverageSessionDuration(sessions),
        peakHours: this.calculatePeakHours(sessions),
        timestamp: new Date().toISOString(),
        hasDataIssues: paymentsResult.status === 'rejected' || sessionsResult.status === 'rejected'
      };

      // If no stations available, return demo data for development
      if (totalStations === 0) {
        console.warn('⚠️ No stations found, returning demo data');
        return this.generateDemoOverview(timeRange);
      }

      // Cache result
      this.setCached(cacheKey, overview);
      
      return overview;
    } catch (error) {
      console.warn('⚠️ Failed to calculate system overview, returning demo data:', error.message);
      return this.generateDemoOverview(timeRange);
    }
  }

  /**
   * Tính số stations online từ realtime data
   * @param {Array} stations - Danh sách stations
   * @param {Object} realtimeData - Dữ liệu realtime
   */
  static calculateOnlineStations(stations, realtimeData) {
    if (!realtimeData || Object.keys(realtimeData).length === 0) {
      // Fallback: check Firestore status
      return stations.filter(station => station.status === 'online').length;
    }

    return stations.filter(station => {
      const realtimeStation = realtimeData[station.id] || realtimeData[station.stationId];
      return realtimeStation?.online === true;
    }).length;
  }

  /**
   * Tìm lỗi phổ biến nhất
   * @param {Array} errors - Danh sách lỗi
   */
  static calculateMostCommonError(errors) {
    if (!errors || errors.length === 0) return 'No errors';

    const errorCounts = {};
    errors.forEach(error => {
      const errorCode = error.errorCode || error.type || 'Unknown';
      errorCounts[errorCode] = (errorCounts[errorCode] || 0) + 1;
    });

    return Object.keys(errorCounts).reduce((a, b) => 
      errorCounts[a] > errorCounts[b] ? a : b, 'No errors'
    );
  }

  /**
   * Tính system uptime
   * @param {Array} stations - Danh sách stations
   * @param {Object} realtimeData - Dữ liệu realtime
   */
  static calculateSystemUptime(stations, realtimeData) {
    if (!stations || stations.length === 0) return 100;

    const onlineCount = this.calculateOnlineStations(stations, realtimeData);
    return this.roundNumber((onlineCount / stations.length) * 100, 1);
  }

  /**
   * Tính utilization rate
   * @param {Array} stations - Danh sách stations
   * @param {Array} sessions - Danh sách sessions
   */
  static calculateUtilizationRate(stations, sessions) {
    if (!stations || stations.length === 0) return 0;

    const totalConnectors = stations.reduce((sum, station) => {
      const connectorCount = Object.keys(station.connectors || {}).length || 2;
      return sum + connectorCount;
    }, 0);

    if (totalConnectors === 0) return 0;

    const busyConnectors = sessions.filter(session => 
      session.status === 'charging' || session.status === 'active'
    ).length;

    return this.roundNumber((busyConnectors / totalConnectors) * 100, 1);
  }

  /**
   * Tính thời gian phiên sạc trung bình (phút)
   * @param {Array} sessions - Danh sách sessions
   */
  static calculateAverageSessionDuration(sessions) {
    const completedSessions = sessions.filter(session => 
      session.status === 'completed' && session.startTime && session.endTime
    );

    if (completedSessions.length === 0) return 0;

    const totalDuration = completedSessions.reduce((sum, session) => {
      const start = this.timestampToDate(session.startTime);
      const end = this.timestampToDate(session.endTime);
      if (start && end) {
        return sum + (end.getTime() - start.getTime());
      }
      return sum + (session.duration || 0);
    }, 0);

    // Convert from milliseconds to minutes
    return Math.round(totalDuration / (completedSessions.length * 60 * 1000));
  }

  /**
   * Tính peak hours
   * @param {Array} sessions - Danh sách sessions
   */
  static calculatePeakHours(sessions) {
    if (!sessions || sessions.length === 0) return [];

    const hourCounts = new Array(24).fill(0);

    sessions.forEach(session => {
      const startTime = this.timestampToDate(session.startTime);
      if (startTime) {
        const hour = startTime.getHours();
        hourCounts[hour]++;
      }
    });

    // Tìm 3 giờ có nhiều sessions nhất
    const peakHours = hourCounts
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .filter(item => item.count > 0)
      .map(item => `${item.hour.toString().padStart(2, '0')}:00`);

    return peakHours;
  }

  // ===== REVENUE ANALYTICS =====

  /**
   * Tính toán revenue analytics
   * @param {string} timeRange - Khoảng thời gian
   * @param {number} selectedMonth - Tháng được chọn
   * @param {number} selectedYear - Năm được chọn
   */
  static async calculateRevenueAnalytics(timeRange = 'month', selectedMonth = null, selectedYear = null) {
    try {
      const payments = await FirestoreService.getPaymentsByTimeRange(timeRange, selectedMonth, selectedYear);
      
      const totalRevenue = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
      const totalTransactions = payments.length;
      const averageTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

      // Revenue by time periods
      const revenueByPeriod = this.generateRevenueByPeriod(payments, timeRange, selectedMonth, selectedYear);
      
      // Revenue by payment method
      const revenueByPaymentMethod = this.calculateRevenueByPaymentMethod(payments);
      
      // Growth metrics
      const previousPeriodPayments = await this.getPreviousPeriodPayments(timeRange, selectedMonth, selectedYear);
      const growthMetrics = this.calculateGrowthMetrics(payments, previousPeriodPayments);

      return {
        totalRevenue,
        totalTransactions,
        averageTransactionValue: this.roundNumber(averageTransactionValue, 0),
        revenueByPeriod,
        revenueByPaymentMethod,
        growthMetrics,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return this.handleError(error, 'Calculating revenue analytics');
    }
  }

  /**
   * Generate revenue by period (daily, weekly, monthly)
   * @param {Array} payments - Danh sách payments
   * @param {string} timeRange - Khoảng thời gian
   * @param {number} selectedMonth - Tháng được chọn
   * @param {number} selectedYear - Năm được chọn
   */
  static generateRevenueByPeriod(payments, timeRange, selectedMonth, selectedYear) {
    switch (timeRange) {
      case 'today':
      case 'yesterday':
        return this.generateHourlyRevenue(payments);
      case 'week':
        return this.generateDailyRevenue(payments, timeRange);
      case 'month':
        return this.generateDailyRevenue(payments, timeRange, selectedMonth, selectedYear);
      case 'year':
        return this.generateMonthlyRevenue(payments, selectedYear);
      default:
        return this.generateDailyRevenue(payments, timeRange, selectedMonth, selectedYear);
    }
  }

  /**
   * Generate hourly revenue data
   * @param {Array} payments - Danh sách payments
   */
  static generateHourlyRevenue(payments) {
    const hourlyData = new Array(24).fill(0).map((_, index) => ({
      hour: `${index.toString().padStart(2, '0')}:00`,
      revenue: 0,
      transactions: 0
    }));

    payments.forEach(payment => {
      const paymentDate = this.timestampToDate(payment.createdAt);
      if (paymentDate) {
        const hour = paymentDate.getHours();
        hourlyData[hour].revenue += payment.amount || 0;
        hourlyData[hour].transactions += 1;
      }
    });

    return hourlyData;
  }

  /**
   * Generate daily revenue data
   * @param {Array} payments - Danh sách payments
   * @param {string} timeRange - Khoảng thời gian
   * @param {number} selectedMonth - Tháng được chọn
   * @param {number} selectedYear - Năm được chọn
   */
  static generateDailyRevenue(payments, timeRange, selectedMonth = null, selectedYear = null) {
    const now = new Date();
    let days, startDate;

    if (timeRange === 'week') {
      days = 7;
      startDate = new Date(now.getTime() - (now.getDay() * 24 * 60 * 60 * 1000));
    } else {
      const year = selectedYear || now.getFullYear();
      const month = selectedMonth !== null ? selectedMonth : now.getMonth();
      days = new Date(year, month + 1, 0).getDate();
      startDate = new Date(year, month, 1);
    }

    const dailyData = new Array(days).fill(0).map((_, index) => {
      const date = new Date(startDate.getTime() + (index * 24 * 60 * 60 * 1000));
      return {
        date: `${date.getDate()}/${date.getMonth() + 1}`,
        revenue: 0,
        transactions: 0
      };
    });

    payments.forEach(payment => {
      const paymentDate = this.timestampToDate(payment.createdAt);
      if (paymentDate) {
        const dayIndex = Math.floor((paymentDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
        if (dayIndex >= 0 && dayIndex < days) {
          dailyData[dayIndex].revenue += payment.amount || 0;
          dailyData[dayIndex].transactions += 1;
        }
      }
    });

    return dailyData;
  }

  /**
   * Generate monthly revenue data
   * @param {Array} payments - Danh sách payments
   * @param {number} year - Năm được chọn
   */
  static generateMonthlyRevenue(payments, year) {
    const currentYear = year || new Date().getFullYear();
    const monthlyData = new Array(12).fill(0).map((_, index) => ({
      month: `Tháng ${index + 1}`,
      revenue: 0,
      transactions: 0
    }));

    payments.forEach(payment => {
      const paymentDate = this.timestampToDate(payment.createdAt);
      if (paymentDate && paymentDate.getFullYear() === currentYear) {
        const month = paymentDate.getMonth();
        monthlyData[month].revenue += payment.amount || 0;
        monthlyData[month].transactions += 1;
      }
    });

    return monthlyData;
  }

  /**
   * Calculate revenue by payment method
   * @param {Array} payments - Danh sách payments
   */
  static calculateRevenueByPaymentMethod(payments) {
    const methods = {};

    payments.forEach(payment => {
      const method = payment.paymentMethod || 'Unknown';
      if (!methods[method]) {
        methods[method] = { revenue: 0, transactions: 0 };
      }
      methods[method].revenue += payment.amount || 0;
      methods[method].transactions += 1;
    });

    return Object.entries(methods).map(([method, data]) => ({
      method,
      revenue: data.revenue,
      transactions: data.transactions,
      percentage: payments.length > 0 ? this.roundNumber((data.transactions / payments.length) * 100, 1) : 0
    }));
  }

  /**
   * Get previous period payments for comparison
   * @param {string} timeRange - Khoảng thời gian
   * @param {number} selectedMonth - Tháng được chọn
   * @param {number} selectedYear - Năm được chọn
   */
  static async getPreviousPeriodPayments(timeRange, selectedMonth, selectedYear) {
    try {
      const now = new Date();
      let previousStartDate, previousEndDate;

      switch (timeRange) {
        case 'today': {
          const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          previousStartDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
          previousEndDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);
          break;
        }
        case 'week': {
          const lastWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          const weekDay = lastWeekStart.getDay();
          previousStartDate = new Date(lastWeekStart.getTime() - (weekDay * 24 * 60 * 60 * 1000));
          previousEndDate = new Date(previousStartDate.getTime() + 6 * 24 * 60 * 60 * 1000);
          break;
        }
        case 'month': {
          const year = selectedYear || now.getFullYear();
          const month = selectedMonth !== null ? selectedMonth : now.getMonth();
          const previousMonth = month === 0 ? 11 : month - 1;
          const previousYear = month === 0 ? year - 1 : year;
          previousStartDate = new Date(previousYear, previousMonth, 1);
          previousEndDate = new Date(previousYear, previousMonth + 1, 0, 23, 59, 59);
          break;
        }
        case 'year': {
          const year = selectedYear || now.getFullYear();
          previousStartDate = new Date(year - 1, 0, 1);
          previousEndDate = new Date(year - 1, 11, 31, 23, 59, 59);
          break;
        }
        default:
          return [];
      }

      return FirestoreService.getPaymentsInRange(previousStartDate, previousEndDate);
    } catch (error) {
      this.handleError(error, 'Getting previous period payments', false);
      return [];
    }
  }

  /**
   * Calculate growth metrics
   * @param {Array} currentPayments - Payments hiện tại
   * @param {Array} previousPayments - Payments kỳ trước
   */
  static calculateGrowthMetrics(currentPayments, previousPayments) {
    const currentRevenue = currentPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const previousRevenue = previousPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

    const currentTransactions = currentPayments.length;
    const previousTransactions = previousPayments.length;

    return {
      revenueGrowth: this.calculatePercentageChange(currentRevenue, previousRevenue),
      transactionGrowth: this.calculatePercentageChange(currentTransactions, previousTransactions),
      averageValueGrowth: this.calculatePercentageChange(
        currentTransactions > 0 ? currentRevenue / currentTransactions : 0,
        previousTransactions > 0 ? previousRevenue / previousTransactions : 0
      )
    };
  }

  // ===== STATION ANALYTICS =====

  /**
   * Calculate station performance analytics
   * @param {string} ownerId - ID của owner (optional)
   * @param {string} timeRange - Khoảng thời gian
   * @param {number} selectedMonth - Tháng được chọn
   * @param {number} selectedYear - Năm được chọn
   */
  static async calculateStationAnalytics(ownerId = null, timeRange = 'month', selectedMonth = null, selectedYear = null) {
    try {
      const [stations, sessions, payments] = await Promise.all([
        ownerId ? FirestoreService.getStationsByOwner(ownerId) : FirestoreService.getAllStations(),
        FirestoreService.getSessionsByOwner(ownerId, timeRange, selectedMonth, selectedYear),
        FirestoreService.getPaymentsByTimeRange(timeRange, selectedMonth, selectedYear)
      ]);

      const stationPerformance = this.calculateStationPerformance(stations, sessions, payments);
      const topPerformingStations = this.getTopPerformingStations(stationPerformance, 10);
      const utilizationByStation = this.calculateUtilizationByStation(stations, sessions);
      const revenueByStation = this.calculateRevenueByStation(stations, payments);

      return {
        stationPerformance,
        topPerformingStations,
        utilizationByStation,
        revenueByStation,
        totalStations: stations.length,
        averageUtilization: this.calculateAverageUtilization(utilizationByStation),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return this.handleError(error, 'Calculating station analytics');
    }
  }

  /**
   * Calculate performance for each station
   * @param {Array} stations - Danh sách stations
   * @param {Array} sessions - Danh sách sessions
   * @param {Array} payments - Danh sách payments
   */
  static calculateStationPerformance(stations, sessions, payments) {
    return stations.map(station => {
      const stationSessions = sessions.filter(session => 
        session.stationId === station.id || session.stationId === station.stationId
      );
      
      const stationPayments = payments.filter(payment => 
        payment.stationId === station.id || payment.stationId === station.stationId
      );

      const revenue = stationPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
      const energy = stationPayments.reduce((sum, payment) => sum + (payment.energyConsumed || 0), 0);
      const sessionCount = stationSessions.length;
      const averageSessionDuration = this.calculateAverageSessionDuration(stationSessions);

      return {
        stationId: station.id || station.stationId,
        stationName: station.stationName || `Station ${station.id}`,
        revenue,
        energy: this.roundNumber(energy, 2),
        sessionCount,
        averageSessionDuration,
        utilizationRate: this.calculateStationUtilization(station, stationSessions),
        status: station.status || 'unknown'
      };
    });
  }

  /**
   * Get top performing stations
   * @param {Array} stationPerformance - Station performance data
   * @param {number} limit - Số lượng top stations
   */
  static getTopPerformingStations(stationPerformance, limit = 10) {
    return stationPerformance
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }

  /**
   * Calculate utilization for each station
   * @param {Array} stations - Danh sách stations
   * @param {Array} sessions - Danh sách sessions
   */
  static calculateUtilizationByStation(stations, sessions) {
    return stations.map(station => ({
      stationId: station.id || station.stationId,
      stationName: station.stationName || `Station ${station.id}`,
      utilization: this.calculateStationUtilization(station, sessions.filter(session => 
        session.stationId === station.id || session.stationId === station.stationId
      ))
    }));
  }

  /**
   * Calculate utilization for a single station
   * @param {Object} station - Station data
   * @param {Array} stationSessions - Sessions của station
   */
  static calculateStationUtilization(station, stationSessions) {
    const connectorCount = Object.keys(station.connectors || {}).length || 2;
    const activeSessions = stationSessions.filter(session => 
      session.status === 'charging' || session.status === 'active'
    ).length;

    return this.roundNumber((activeSessions / connectorCount) * 100, 1);
  }

  /**
   * Calculate revenue for each station
   * @param {Array} stations - Danh sách stations
   * @param {Array} payments - Danh sách payments
   */
  static calculateRevenueByStation(stations, payments) {
    return stations.map(station => {
      const stationPayments = payments.filter(payment => 
        payment.stationId === station.id || payment.stationId === station.stationId
      );

      const revenue = stationPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

      return {
        stationId: station.id || station.stationId,
        stationName: station.stationName || `Station ${station.id}`,
        revenue,
        transactionCount: stationPayments.length
      };
    });
  }

  /**
   * Calculate average utilization across all stations
   * @param {Array} utilizationByStation - Utilization data
   */
  static calculateAverageUtilization(utilizationByStation) {
    if (!utilizationByStation || utilizationByStation.length === 0) return 0;

    const totalUtilization = utilizationByStation.reduce((sum, station) => sum + station.utilization, 0);
    return this.roundNumber(totalUtilization / utilizationByStation.length, 1);
  }

 /**
 * Đếm số connector đang sạc (trạng thái "Charging") từ realtimeData
 * @param {Object} realtimeData - Dữ liệu realtime của tất cả stations
 * @returns {number}
 */
static countChargingConnectors(realtimeData) {
  if (!realtimeData) return 0;
  let count = 0;
  Object.values(realtimeData).forEach(station => {
    if (station.connectors) {
      Object.values(station.connectors).forEach(connector => {
        if (
          connector.status === 'Charging' || // hoặc 'InUse' tùy hệ thống
          connector.status === 'InUse'
        ) {
          count++;
        }
      });
    }
  });
  return count;
}

  // ===== EXPORT ANALYTICS DATA =====

  /**
   * Prepare analytics data for export
   * @param {string} type - Loại data: 'overview', 'revenue', 'stations'
   * @param {Object} filters - Filters cho data
   */
  static async prepareAnalyticsForExport(type, filters = {}) {
    try {
      const { timeRange = 'month', selectedMonth, selectedYear, ownerId } = filters;

      switch (type) {
        case 'overview':
          return this.calculateSystemOverview(timeRange, selectedMonth, selectedYear);
        
        case 'revenue':
          return this.calculateRevenueAnalytics(timeRange, selectedMonth, selectedYear);
        
        case 'stations':
          return this.calculateStationAnalytics(ownerId, timeRange, selectedMonth, selectedYear);
        
        default:
          throw new Error(`Unsupported analytics export type: ${type}`);
      }
    } catch (error) {
      return this.handleError(error, `Preparing analytics for export: ${type}`);
    }
  }
}

export default AnalyticsService;