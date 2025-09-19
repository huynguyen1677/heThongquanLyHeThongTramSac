import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

export class DashboardService {
  
  // Lấy tất cả dữ liệu dashboard cho owner
  static async getDashboardData(ownerId, timeRange = 'month', selectedMonth = null, selectedYear = null) {
    try {
      const [stations, sessions, payments, realtimeData] = await Promise.all([
        this.getStationsByOwner(ownerId),
        this.getSessionsByOwner(ownerId, timeRange, selectedMonth, selectedYear),
        this.getPaymentsByTimeRange(timeRange, selectedMonth, selectedYear),
        this.getRealtimeStationsData()
      ]);

      return this.calculateDashboardMetrics(stations, sessions, payments, timeRange, selectedMonth, selectedYear, realtimeData);
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      throw error;
    }
  }

  // Lấy stations của owner
  static async getStationsByOwner(ownerId) {
    try {
      const stationsRef = collection(db, 'stations');
      const q = query(stationsRef, where('ownerId', '==', ownerId));
      const querySnapshot = await getDocs(q);
      
      const stations = [];
      querySnapshot.forEach((doc) => {
        stations.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return stations;
    } catch (error) {
      console.error('Error getting stations:', error);
      return [];
    }
  }

  // Lấy dữ liệu realtime của các trạm sạc
  static async getRealtimeStationsData() {
    try {
      // Gọi API để lấy dữ liệu realtime từ CSMS
      const response = await fetch('http://localhost:3000/api/realtime/stations');
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      return {};
    } catch (error) {
      console.warn('Could not fetch realtime data:', error);
      return {};
    }
  }

  // Lấy charging sessions theo owner trong khoảng thời gian
  static async getSessionsByOwner(ownerId, timeRange, selectedMonth, selectedYear) {
    try {
      console.log('[DashboardService] getSessionsByOwner', { ownerId, timeRange, selectedMonth, selectedYear });

      const sessionsRef = collection(db, 'chargingSessions');
      const q = query(
        sessionsRef,
        where('ownerId', '==', ownerId)
      );

      const querySnapshot = await getDocs(q);
      console.log('[DashboardService] Sessions querySnapshot.size:', querySnapshot.size);

      const { startDate, endDate } = this.getDateRange(timeRange, selectedMonth, selectedYear);
      console.log('[DashboardService] Filter range:', { startDate, endDate });

      const sessions = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const start = new Date(data.startTime);
        if (start >= startDate && start <= endDate) {
          sessions.push({
            id: doc.id,
            ...data,
            startTime: start,
            endTime: data.stopTime ? new Date(data.stopTime) : null
          });
        }
      });

      console.log('[DashboardService] Filtered sessions:', sessions.length);
      return sessions;
    } catch (error) {
      console.error('[DashboardService] Error getting sessions:', error);
      throw error;
    }
  }

  // Lấy payment history trong khoảng thời gian
  static async getPaymentsByTimeRange(timeRange, selectedMonth, selectedYear) {
    try {
      console.log('[DashboardService] getPaymentsByTimeRange', { timeRange, selectedMonth, selectedYear });

      const paymentsRef = collection(db, 'payment_history');
      const q = query(
        paymentsRef,
        where('type', '==', 'payment'),
        where('status', '==', 'completed')
      );

      const querySnapshot = await getDocs(q);
      console.log('[DashboardService] Payments querySnapshot.size:', querySnapshot.size);

      const { startDate, endDate } = this.getDateRange(timeRange, selectedMonth, selectedYear);

      const payments = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const createdAt = new Date(data.createdAt);
        if (createdAt >= startDate && createdAt <= endDate) {
          payments.push({
            id: doc.id,
            ...data,
            createdAt: createdAt
          });
        }
      });

      console.log('[DashboardService] Filtered payments:', payments.length);
      return payments;
    } catch (error) {
      console.error('[DashboardService] Error getting payments:', error);
      return [];
    }
  }

  // Tính toán khoảng thời gian
  static getDateRange(timeRange, selectedMonth, selectedYear) {
    const now = new Date();
    let startDate, endDate;

    switch (timeRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      
      case 'yesterday':
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0);
        endDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);
        break;
      
      case 'week':
        endDate = new Date(now);
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      
      case 'month':
        if (selectedMonth !== null && selectedYear !== null) {
          startDate = new Date(selectedYear, selectedMonth, 1);
          endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);
        } else {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        }
        break;
      
      case 'year':
        const year = selectedYear || now.getFullYear();
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 11, 31, 23, 59, 59);
        break;
      
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    return { startDate, endDate };
  }

  // Tính toán các metrics dashboard
  static calculateDashboardMetrics(stations, sessions, payments, timeRange, selectedMonth, selectedYear, realtimeData = {}) {
    // Lọc sessions hoàn thành
    const completedSessions = sessions.filter(session => 
      session.status === 'Completed' || session.status === 'completed'
    );

    // Tính tổng doanh thu từ payment_history
    const totalRevenue = payments.reduce((sum, payment) => {
      return sum + (payment.amount || 0);
    }, 0);

    // Tính tổng năng lượng từ payment_history
    const totalEnergy = payments.reduce((sum, payment) => {
      return sum + (payment.energyConsumed || 0);
    }, 0);

    // Tính thời gian phiên sạc trung bình
    const averageSessionTime = this.calculateAverageSessionTime(completedSessions);

    // Tính stations hoạt động từ realtime data hoặc hoạt động gần đây
    let activeStations = 0;
    
    if (Object.keys(realtimeData).length > 0) {
      // Sử dụng dữ liệu realtime nếu có
      activeStations = stations.filter(station => {
        const realtime = realtimeData[station.id];
        return realtime && realtime.online;
      }).length;
    } else {
      // Fallback: đếm stations có hoạt động gần đây
      const now = new Date();
      const recentThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 giờ qua
      
      activeStations = stations.filter(station => {
        // Kiểm tra xem trạm có phiên sạc nào trong 24h qua không
        const hasRecentActivity = sessions.some(session => {
          const sessionStart = new Date(session.startTime);
          return (session.stationId === station.id || session.stationId === station.stationId) 
            && sessionStart >= recentThreshold;
        });
        
        // Hoặc có thanh toán trong 24h qua
        const hasRecentPayments = payments.some(payment => {
          const paymentTime = new Date(payment.createdAt);
          return (payment.stationId === station.id || payment.stationId === station.stationId)
            && paymentTime >= recentThreshold;
        });

        return hasRecentActivity || hasRecentPayments;
      }).length;
    }

    // Tạo dữ liệu biểu đồ
    const monthlyRevenue = this.generateMonthlyRevenueFromPayments(payments, selectedYear);
    const dailyRevenue = this.generateDailyRevenueFromPayments(payments, selectedMonth, selectedYear);
    const hourlyRevenue = this.generateHourlyRevenueFromPayments(payments, timeRange);
    const stationUsage = this.calculateStationUsageFromPayments(stations, payments);

    return {
      totalRevenue,
      totalSessions: sessions.length,
      totalEnergy: Math.round(totalEnergy * 100) / 100,
      totalStations: stations.length,
      activeStations: activeStations,
      averageSessionTime,
      monthlyRevenue,
      dailyRevenue,
      hourlyRevenue,
      stationUsage,
      revenueByStation: stationUsage
    };
  }

  // Tính thời gian phiên sạc trung bình (phút)
  static calculateAverageSessionTime(sessions) {
    if (sessions.length === 0) return 0;

    const totalDuration = sessions.reduce((sum, session) => {
      if (session.startTime && session.endTime) {
        const duration = (new Date(session.endTime) - new Date(session.startTime)) / (1000 * 60);
        return sum + duration;
      }
      return sum + (session.duration || 0);
    }, 0);

    return Math.round(totalDuration / sessions.length);
  }

  // Tạo dữ liệu doanh thu theo tháng từ payment_history
  static generateMonthlyRevenueFromPayments(payments, year) {
    const monthlyData = new Array(12).fill(0).map((_, index) => ({
      month: `Tháng ${index + 1}`,
      revenue: 0,
      sessions: 0
    }));

    payments.forEach(payment => {
      const paymentDate = new Date(payment.createdAt);
      if (paymentDate.getFullYear() === year) {
        const month = paymentDate.getMonth();
        monthlyData[month].revenue += payment.amount;
        monthlyData[month].sessions += 1;
      }
    });

    return monthlyData;
  }

  // Tạo dữ liệu doanh thu theo ngày từ payment_history
  static generateDailyRevenueFromPayments(payments, month, year) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dailyData = new Array(daysInMonth).fill(0).map((_, index) => ({
      date: `${index + 1}/${month + 1}`,
      revenue: 0,
      sessions: 0
    }));

    payments.forEach(payment => {
      const paymentDate = new Date(payment.createdAt);
      if (paymentDate.getFullYear() === year && paymentDate.getMonth() === month) {
        const day = paymentDate.getDate() - 1;
        if (day >= 0 && day < daysInMonth) {
          dailyData[day].revenue += payment.amount;
          dailyData[day].sessions += 1;
        }
      }
    });

    return dailyData;
  }

  // Tạo dữ liệu doanh thu theo giờ (cho thống kê ngày)
  static generateHourlyRevenueFromPayments(payments, timeRange) {
    if (timeRange !== 'today' && timeRange !== 'yesterday') {
      return [];
    }

    const hourlyData = new Array(24).fill(0).map((_, index) => ({
      hour: `${index.toString().padStart(2, '0')}:00`,
      revenue: 0,
      sessions: 0
    }));

    payments.forEach(payment => {
      const paymentDate = new Date(payment.createdAt);
      const hour = paymentDate.getHours();
      hourlyData[hour].revenue += payment.amount;
      hourlyData[hour].sessions += 1;
    });

    return hourlyData;
  }

  // Tính toán usage và revenue theo station từ payment_history
  static calculateStationUsageFromPayments(stations, payments) {
    return stations.map(station => {
      const stationPayments = payments.filter(payment => 
        payment.stationId === station.id || payment.stationId === station.stationId
      );

      const revenue = stationPayments.reduce((sum, payment) => 
        sum + payment.amount, 0
      );

      // Tính usage percentage dựa trên số payments
      const maxPayments = Math.max(1, Math.max(...stations.map(s => {
        const sPayments = payments.filter(payment => 
          payment.stationId === s.id || payment.stationId === s.stationId
        );
        return sPayments.length;
      })));
      
      const usage = Math.min(100, Math.round((stationPayments.length / maxPayments) * 100));

      return {
        stationId: station.id || station.stationId,
        name: station.stationName || station.name || `Trạm ${station.id}`,
        usage,
        revenue,
        sessions: stationPayments.length
      };
    });
  }

  // Lấy thống kê so sánh với kỳ trước
  static async getComparisonStats(ownerId, timeRange, selectedMonth, selectedYear) {
    try {
      // Tính khoảng thời gian kỳ trước
      const { startDate: prevStart, endDate: prevEnd } = this.getPreviousPeriod(
        timeRange, selectedMonth, selectedYear
      );

      // Lấy payments kỳ trước
      const paymentsRef = collection(db, 'payment_history');
      const q = query(
        paymentsRef,
        where('type', '==', 'payment'),
        where('status', '==', 'completed')
      );

      const querySnapshot = await getDocs(q);
      const prevPayments = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const createdAt = new Date(data.createdAt);
        if (createdAt >= prevStart && createdAt <= prevEnd) {
          prevPayments.push({ id: doc.id, ...data });
        }
      });

      const prevRevenue = prevPayments.reduce((sum, payment) => 
        sum + payment.amount, 0
      );

      return {
        previousRevenue: prevRevenue,
        previousSessions: prevPayments.length
      };
    } catch (error) {
      console.error('Error getting comparison stats:', error);
      return { previousRevenue: 0, previousSessions: 0 };
    }
  }

  // Tính khoảng thời gian kỳ trước
  static getPreviousPeriod(timeRange, selectedMonth, selectedYear) {
    let startDate, endDate;

    switch (timeRange) {
      case 'today':
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0);
        endDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);
        break;
      
      case 'yesterday':
        const dayBeforeYesterday = new Date();
        dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
        startDate = new Date(dayBeforeYesterday.getFullYear(), dayBeforeYesterday.getMonth(), dayBeforeYesterday.getDate(), 0, 0, 0);
        endDate = new Date(dayBeforeYesterday.getFullYear(), dayBeforeYesterday.getMonth(), dayBeforeYesterday.getDate(), 23, 59, 59);
        break;
      
      case 'week':
        const now = new Date();
        endDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      
      case 'month':
        if (selectedMonth === 0) {
          startDate = new Date(selectedYear - 1, 11, 1);
          endDate = new Date(selectedYear - 1, 11, 31, 23, 59, 59);
        } else {
          startDate = new Date(selectedYear, selectedMonth - 1, 1);
          endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);
        }
        break;
      
      case 'year':
        startDate = new Date(selectedYear - 1, 0, 1);
        endDate = new Date(selectedYear - 1, 11, 31, 23, 59, 59);
        break;
      
      default:
        const currMonth = new Date().getMonth();
        const currYear = new Date().getFullYear();
        if (currMonth === 0) {
          startDate = new Date(currYear - 1, 11, 1);
          endDate = new Date(currYear - 1, 11, 31, 23, 59, 59);
        } else {
          startDate = new Date(currYear, currMonth - 1, 1);
          endDate = new Date(currYear, currMonth, 0, 23, 59, 59);
        }
    }

    return { startDate, endDate };
  }

  // Station-specific dashboard methods
  static async getStationDashboardData(stationId, timeRange = 'week', selectedMonth = null, selectedYear = null) {
    try {
      const { startDate, endDate } = this.getDateRange(timeRange, selectedMonth, selectedYear);
      
      const [sessions, payments] = await Promise.all([
        this.getStationSessions(stationId, startDate, endDate),
        this.getStationPayments(stationId, startDate, endDate)
      ]);

      return this.calculateStationMetrics(sessions, payments, timeRange, selectedMonth, selectedYear);
    } catch (error) {
      console.error('Error getting station dashboard data:', error);
      throw error;
    }
  }

  static async getStationSessions(stationId, startDate, endDate) {
    try {
      const sessionsRef = collection(db, 'chargingSessions');
      const q = query(
        sessionsRef,
        where('stationId', '==', stationId)
      );

      const querySnapshot = await getDocs(q);
      const sessions = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        let startTime;
        
        if (data.startTime && typeof data.startTime.toDate === 'function') {
          startTime = data.startTime.toDate();
        } else if (data.startTime) {
          startTime = new Date(data.startTime);
        } else {
          return; // Skip sessions without startTime
        }

        if (startTime >= startDate && startTime <= endDate) {
          let endTime = null;
          if (data.stopTime) {
            if (typeof data.stopTime.toDate === 'function') {
              endTime = data.stopTime.toDate();
            } else {
              endTime = new Date(data.stopTime);
            }
          }

          sessions.push({
            id: doc.id,
            ...data,
            startTime: startTime,
            endTime: endTime
          });
        }
      });

      return sessions;
    } catch (error) {
      console.error('Error fetching station sessions:', error);
      throw error;
    }
  }

  static async getStationPayments(stationId, startDate, endDate) {
    try {
      const paymentsRef = collection(db, 'payment_history');
      const q = query(
        paymentsRef,
        where('stationId', '==', stationId),
        where('type', '==', 'payment'),
        where('status', '==', 'completed')
      );

      const querySnapshot = await getDocs(q);
      const payments = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        let createdAt;
        
        if (data.createdAt && typeof data.createdAt.toDate === 'function') {
          createdAt = data.createdAt.toDate();
        } else if (data.createdAt) {
          createdAt = new Date(data.createdAt);
        } else {
          return; // Skip payments without createdAt
        }
        
        if (createdAt >= startDate && createdAt <= endDate) {
          payments.push({
            id: doc.id,
            ...data,
            createdAt: createdAt
          });
        }
      });

      return payments;
    } catch (error) {
      console.error('Error fetching station payments:', error);
      throw error;
    }
  }

  static calculateStationMetrics(sessions, payments, timeRange, selectedMonth, selectedYear) {
    const totalRevenue = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const totalEnergy = payments.reduce((sum, payment) => sum + (payment.energyConsumed || 0), 0);
    const totalSessions = sessions.length;
    
    // Tính thời gian phiên sạc trung bình
    const averageSessionTime = this.calculateAverageSessionTime(sessions);
    
    // Tạo dữ liệu biểu đồ
    const dailyRevenue = this.generateStationDailyRevenue(payments, selectedMonth, selectedYear, timeRange);
    const hourlyRevenue = this.generateStationHourlyRevenue(payments, timeRange);
    const connectorUsage = this.calculateStationConnectorUsage(sessions, payments);

    return {
      totalRevenue,
      totalSessions,
      totalEnergy: Math.round(totalEnergy * 100) / 100,
      averageSessionTime,
      dailyRevenue,
      hourlyRevenue,
      connectorUsage
    };
  }

  static generateStationDailyRevenue(payments, month, year, timeRange) {
    if (timeRange === 'today' || timeRange === 'yesterday') return [];
    
    if (timeRange === 'week') {
      // Tạo dữ liệu 7 ngày qua
      const dailyData = [];
      const today = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        dailyData.push({
          date: `${date.getDate()}/${date.getMonth() + 1}`,
          revenue: 0,
          sessions: 0
        });
      }

      payments.forEach(payment => {
        const paymentDate = new Date(payment.createdAt);
        const dayIndex = Math.floor((today.getTime() - paymentDate.getTime()) / (24 * 60 * 60 * 1000));
        if (dayIndex >= 0 && dayIndex < 7) {
          const dataIndex = 6 - dayIndex;
          dailyData[dataIndex].revenue += payment.amount;
          dailyData[dataIndex].sessions += 1;
        }
      });

      return dailyData;
    }

    // Cho tháng
    const actualYear = year || new Date().getFullYear();
    const actualMonth = month !== null ? month : new Date().getMonth();
    const daysInMonth = new Date(actualYear, actualMonth + 1, 0).getDate();
    const dailyData = new Array(daysInMonth).fill(0).map((_, index) => ({
      date: `${index + 1}/${actualMonth + 1}`,
      revenue: 0,
      sessions: 0
    }));

    payments.forEach(payment => {
      const paymentDate = new Date(payment.createdAt);
      if (paymentDate.getFullYear() === actualYear && paymentDate.getMonth() === actualMonth) {
        const day = paymentDate.getDate() - 1;
        if (day >= 0 && day < daysInMonth) {
          dailyData[day].revenue += payment.amount;
          dailyData[day].sessions += 1;
        }
      }
    });

    return dailyData;
  }

  static generateStationHourlyRevenue(payments, timeRange) {
    if (timeRange !== 'today' && timeRange !== 'yesterday') {
      return [];
    }

    const hourlyData = new Array(24).fill(0).map((_, index) => ({
      hour: `${index.toString().padStart(2, '0')}:00`,
      revenue: 0,
      sessions: 0
    }));

    payments.forEach(payment => {
      const paymentDate = new Date(payment.createdAt);
      const hour = paymentDate.getHours();
      hourlyData[hour].revenue += payment.amount;
      hourlyData[hour].sessions += 1;
    });

    return hourlyData;
  }

  static calculateStationConnectorUsage(sessions, payments) {
    const connectorData = new Map();

    // Từ sessions
    sessions.forEach(session => {
      const connectorId = session.connectorId;
      if (!connectorData.has(connectorId)) {
        connectorData.set(connectorId, {
          connectorId,
          sessions: 0,
          revenue: 0
        });
      }
      connectorData.get(connectorId).sessions += 1;
    });

    // Từ payments
    payments.forEach(payment => {
      const connectorId = payment.connectorId;
      if (connectorData.has(connectorId)) {
        connectorData.get(connectorId).revenue += payment.amount;
      }
    });

    // Tính usage percentage
    const connectors = Array.from(connectorData.values());
    const maxSessions = Math.max(1, Math.max(...connectors.map(c => c.sessions)));

    return connectors.map(connector => ({
      ...connector,
      usage: Math.min(100, Math.round((connector.sessions / maxSessions) * 100))
    }));
  }
}

export default DashboardService;