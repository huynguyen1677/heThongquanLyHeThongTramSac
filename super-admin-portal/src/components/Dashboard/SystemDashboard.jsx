import React, { useState, useEffect, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { Zap, Activity, DollarSign, AlertTriangle, TrendingUp, Battery, Clock, Eye, Download } from 'lucide-react';
import FirestoreService from '../../services/FirestoreService';
import RealtimeService from '../../services/RealtimeService';
import AuthService from '../../services/AuthService';
import './SystemDashboard.css';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement);

const SystemDashboard = ({ timeRange = 'today', onDataLoad = null }) => {
  const [dashboardData, setDashboardData] = useState({
    overview: {
      totalStations: 0,
      onlineStations: 0,
      offlineStations: 0,
      faultedStations: 0,
      totalConnectors: 0,
      chargingConnectors: 0,
      availableConnectors: 0,
      totalRevenue: 0,
      totalEnergy: 0,
      totalSessions: 0,
      avgSessionDuration: 0,
      peakHours: []
    },
    realtime: {},
    payments: [],
    stations: [],
    revenueChart: [],
    energyChart: [],
    stationChart: [],
    connectorChart: []
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [adminWallet, setAdminWallet] = useState(0);

  const getDateRange = (range) => {
    const now = new Date();
    let startDate, endDate;

    switch (range) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      case 'week': {
        const dayOfWeek = now.getDay();
        startDate = new Date(now.getTime() - (dayOfWeek * 24 * 60 * 60 * 1000));
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate.getTime() + (6 * 24 * 60 * 60 * 1000));
        endDate.setHours(23, 59, 59, 999);
        break;
      }
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    }

    return { startDate, endDate };
  };

  const calculateOverviewMetrics = (stations, payments, realtimeData) => {
    console.log('🔢 Calculating metrics with data:', {
      stationsCount: stations?.length || 0,
      paymentsCount: payments?.length || 0,
      realtimeKeys: realtimeData ? Object.keys(realtimeData).length : 0,
      samplePayment: payments?.[0] || null,
      sampleStation: stations?.[0] || null
    });

    const totalStations = stations.length;
    let onlineStations = 0;
    let offlineStations = 0;
    let faultedStations = 0;
    let totalConnectors = 0;
    let chargingConnectors = 0;
    let availableConnectors = 0;

    // Calculate station and connector metrics from realtime data
    stations.forEach(station => {
      const realtimeStation = realtimeData[station.id] || realtimeData[station.stationId];
      
      if (realtimeStation) {
        const isOnline = realtimeStation.online === true;
        const isFaulted = realtimeStation.connectors && 
          Object.values(realtimeStation.connectors).some(c => c.status === 'Faulted');
        
        if (isFaulted) {
          faultedStations++;
        } else if (isOnline) {
          onlineStations++;
        } else {
          offlineStations++;
        }

        // Count connectors
        if (realtimeStation.connectors) {
          Object.values(realtimeStation.connectors).forEach(connector => {
            totalConnectors++;
            if (connector.status === 'Charging' || connector.status === 'InUse') {
              chargingConnectors++;
            } else if (connector.status === 'Available') {
              availableConnectors++;
            }
          });
        }
      } else {
        offlineStations++;
        // Default connector count if no realtime data
        totalConnectors += 2;
        availableConnectors += 2;
      }
    });

      // Calculate payment metrics
      let totalRevenue = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
      let totalEnergy = payments.reduce((sum, payment) => sum + (payment.energyConsumed || 0), 0);
      let totalSessions = payments.length;

      console.log('💰 Payment calculation results:', {
        totalRevenue,
        totalEnergy,
        totalSessions,
        paymentsDataSample: payments?.slice(0, 3) || [],
        hasRealData: totalSessions > 0
      });    // Calculate average session duration (estimate from payment data)
    const avgSessionDuration = totalSessions > 0 ? Math.round(totalEnergy / totalSessions * 60) : 0;

    // Calculate peak hours
    const hourCounts = new Array(24).fill(0);
    payments.forEach(payment => {
      try {
        const date = new Date(payment.createdAt);
        const hour = date.getHours();
        hourCounts[hour]++;
      } catch {
        // Skip invalid dates
      }
    });

    const peakHours = hourCounts
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .filter(item => item.count > 0)
      .map(item => `${item.hour.toString().padStart(2, '0')}:00`);

    const metrics = {
      totalStations,
      onlineStations,
      offlineStations,
      faultedStations,
      totalConnectors,
      chargingConnectors,
      availableConnectors,
      totalRevenue,
      totalEnergy: Math.round(totalEnergy * 100) / 100,
      totalSessions,
      avgSessionDuration,
      peakHours
    };

    console.log('📊 Final calculated metrics:', metrics);
    return metrics;
  };

  const generateRevenueChart = useCallback((payments, timeRange) => {
    const data = [];
    const labels = [];

    if (timeRange === 'today') {
      // Hourly data for today
      for (let i = 0; i < 24; i++) {
        labels.push(`${i.toString().padStart(2, '0')}:00`);
        data.push(0);
      }

      payments.forEach(payment => {
        try {
          let date;
          if (typeof payment.createdAt === 'string') {
            date = new Date(payment.createdAt);
          } else if (payment.createdAt.toDate) {
            date = payment.createdAt.toDate();
          } else {
            date = new Date(payment.createdAt);
          }
          const hour = date.getHours();
          data[hour] += payment.amount || 0;
        } catch {
          // Skip invalid dates
        }
      });
    } else if (timeRange === 'week') {
      // Daily data for this week
      const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      for (let i = 0; i < 7; i++) {
        labels.push(days[i]);
        data.push(0);
      }

      payments.forEach(payment => {
        try {
          let date;
          if (typeof payment.createdAt === 'string') {
            date = new Date(payment.createdAt);
          } else if (payment.createdAt.toDate) {
            date = payment.createdAt.toDate();
          } else {
            date = new Date(payment.createdAt);
          }
          const dayOfWeek = date.getDay();
          data[dayOfWeek] += payment.amount || 0;
        } catch {
          // Skip invalid dates
        }
      });
    } else {
      // Monthly data
      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      
      for (let i = 1; i <= daysInMonth; i++) {
        labels.push(i.toString());
        data.push(0);
      }

      payments.forEach(payment => {
        try {
          let date;
          if (typeof payment.createdAt === 'string') {
            date = new Date(payment.createdAt);
          } else if (payment.createdAt.toDate) {
            date = payment.createdAt.toDate();
          } else {
            date = new Date(payment.createdAt);
          }
          const day = date.getDate();
          if (day >= 1 && day <= daysInMonth) {
            data[day - 1] += payment.amount || 0;
          }
        } catch {
          // Skip invalid dates
        }
      });
    }

    return { labels, data };
  }, []);

  const generateEnergyChart = useCallback((payments, timeRange) => {
    const data = [];
    const labels = [];

    if (timeRange === 'today') {
      // Hourly data for today
      for (let i = 0; i < 24; i++) {
        labels.push(`${i.toString().padStart(2, '0')}:00`);
        data.push(0);
      }

      payments.forEach(payment => {
        try {
          let date;
          if (typeof payment.createdAt === 'string') {
            date = new Date(payment.createdAt);
          } else if (payment.createdAt.toDate) {
            date = payment.createdAt.toDate();
          } else {
            date = new Date(payment.createdAt);
          }
          const hour = date.getHours();
          data[hour] += payment.energyConsumed || 0;
        } catch {
          // Skip invalid dates
        }
      });
    } else {
      // Use same logic as revenue but for energy
      const revenueChart = generateRevenueChart(payments, timeRange);
      labels.push(...revenueChart.labels);
      
      revenueChart.labels.forEach(() => data.push(0));
      
      payments.forEach(payment => {
        try {
          let date;
          if (typeof payment.createdAt === 'string') {
            date = new Date(payment.createdAt);
          } else if (payment.createdAt.toDate) {
            date = payment.createdAt.toDate();
          } else {
            date = new Date(payment.createdAt);
          }
          let index;
          
          if (timeRange === 'week') {
            index = date.getDay();
          } else {
            index = date.getDate() - 1;
          }
          
          if (index >= 0 && index < data.length) {
            data[index] += payment.energyConsumed || 0;
          }
        } catch {
          // Skip invalid dates
        }
      });
    }

    return { labels, data };
  }, [generateRevenueChart]);

  const generateStationChart = useCallback((stations, realtimeData) => {
    const stationTypes = {};

    stations.forEach(station => {
      const realtimeStation = realtimeData[station.id] || realtimeData[station.stationId];
      let status = 'Ngoại Tuyến';
      
      if (realtimeStation) {
        const isFaulted = realtimeStation.connectors && 
          Object.values(realtimeStation.connectors).some(c => c.status === 'Faulted');
        
        if (isFaulted) {
          status = 'Lỗi';
        } else if (realtimeStation.online === true) {
          status = 'Trực Tuyến';
        }
      }

      stationTypes[status] = (stationTypes[status] || 0) + 1;
    });

    return {
      labels: Object.keys(stationTypes),
      data: Object.values(stationTypes)
    };
  }, []);

  const generateConnectorChart = useCallback((realtimeData) => {
    const connectorStatus = {
      'Sẵn Sàng': 0,
      'Đang Sạc': 0,
      'Lỗi': 0,
      'Không Khả Dụng': 0
    };

    Object.values(realtimeData).forEach(station => {
      if (station.connectors) {
        Object.values(station.connectors).forEach(connector => {
          switch (connector.status) {
            case 'Available':
              connectorStatus['Sẵn Sàng']++;
              break;
            case 'Charging':
            case 'InUse':
              connectorStatus['Đang Sạc']++;
              break;
            case 'Faulted':
              connectorStatus['Lỗi']++;
              break;
            default:
              connectorStatus['Không Khả Dụng']++;
          }
        });
      }
    });

    return {
      labels: Object.keys(connectorStatus),
      data: Object.values(connectorStatus)
    };
  }, []);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Loading dashboard data...');
      
      // Get date range based on timeRange
      const { startDate, endDate } = getDateRange(timeRange);
      
      // Get current user and admin wallet balance
      const currentUser = AuthService.getCurrentUser();
      
      // Load data from multiple sources - try different payment collections
      const [stations, payments, sessions, realtimeData, adminProfile] = await Promise.allSettled([
        FirestoreService.getAllStations(),
        FirestoreService.getPaymentsInRange(startDate, endDate),
        FirestoreService.getSessionsInRange(startDate, endDate),
        RealtimeService.getRealtimeStations(),
        currentUser ? AuthService.getUserProfile(currentUser.uid) : Promise.resolve(null)
      ]);

      console.log('🔍 Data loading results:', {
        stations: stations.status,
        payments: payments.status,
        sessions: sessions.status,
        realtimeData: realtimeData.status,
        adminProfile: adminProfile.status
      });

      const stationsData = stations.status === 'fulfilled' ? stations.value : [];
      const paymentsData = payments.status === 'fulfilled' ? payments.value : [];
      const sessionsData = sessions.status === 'fulfilled' ? sessions.value : [];
      const realtimeDataValue = realtimeData.status === 'fulfilled' ? realtimeData.value : {};
      const adminProfileData = adminProfile.status === 'fulfilled' ? adminProfile.value : null;

      // Update admin wallet balance
      setAdminWallet(adminProfileData?.walletBalance || 0);

      // Combine payment and session data for comprehensive metrics
      const combinedData = [...paymentsData];
      
      // If we have sessions but not payments, use sessions as backup
      if (paymentsData.length === 0 && sessionsData.length > 0) {
        console.log('📊 Using sessions data as backup for payments');
        combinedData.push(...sessionsData.map(session => ({
          amount: session.totalCost || 0,
          energyConsumed: session.energyConsumed || 0,
          createdAt: session.endTime || session.startTime,
          type: 'session_payment',
          status: 'completed'
        })));
      }

      // Log any errors
      if (stations.status === 'rejected') {
        console.error('❌ Stations loading failed:', stations.reason);
      }
      if (payments.status === 'rejected') {
        console.error('❌ Payments loading failed:', payments.reason);
      }
      if (sessions.status === 'rejected') {
        console.error('❌ Sessions loading failed:', sessions.reason);
      }
      if (realtimeData.status === 'rejected') {
        console.error('❌ Realtime data loading failed:', realtimeData.reason);
      }
      if (adminProfile.status === 'rejected') {
        console.error('❌ Admin profile loading failed:', adminProfile.reason);
      }

      console.log('📊 Raw data loaded:', {
        stationsCount: stationsData?.length || 0,
        paymentsCount: paymentsData?.length || 0,
        sessionsCount: sessionsData?.length || 0,
        combinedDataCount: combinedData?.length || 0,
        realtimeKeys: realtimeDataValue ? Object.keys(realtimeDataValue).length : 0
      });

      // Calculate overview metrics using combined data
      const overview = calculateOverviewMetrics(stationsData, combinedData, realtimeDataValue);
      
      // Generate chart data using combined data
      const revenueChart = generateRevenueChart(combinedData, timeRange);
      const energyChart = generateEnergyChart(combinedData, timeRange);
      const stationChart = generateStationChart(stationsData, realtimeDataValue);
      const connectorChart = generateConnectorChart(realtimeDataValue);

      const newDashboardData = {
        overview,
        realtime: realtimeDataValue,
        payments: combinedData,
        stations: stationsData,
        revenueChart,
        energyChart,
        stationChart,
        connectorChart
      };

      setDashboardData(newDashboardData);
      setLastUpdated(new Date());
      
      // Callback for parent component
      if (onDataLoad) {
        onDataLoad(newDashboardData);
      }
      
      console.log('✅ Dashboard data loaded successfully');
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
      setError('Không thể tải dữ liệu dashboard. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, onDataLoad, generateRevenueChart, generateEnergyChart, generateStationChart, generateConnectorChart]);

  // Separate function for realtime-only refresh (doesn't cost Firebase quota)
  const refreshRealtimeData = useCallback(async () => {
    try {
      console.log('🔄 Refreshing realtime data only...');
      const realtimeData = await RealtimeService.getRealtimeStations();
      
      if (realtimeData) {
        setDashboardData(prevData => {
          // Recalculate only realtime-dependent metrics
          const overview = calculateOverviewMetrics(prevData.stations, prevData.payments, realtimeData);
          const stationChart = generateStationChart(prevData.stations, realtimeData);
          const connectorChart = generateConnectorChart(realtimeData);
          
          return {
            ...prevData,
            overview,
            realtime: realtimeData,
            stationChart,
            connectorChart
          };
        });
        setLastUpdated(new Date());
        console.log('✅ Realtime data refreshed');
      }
    } catch (error) {
      console.warn('⚠️ Failed to refresh realtime data:', error.message);
    }
  }, [generateStationChart, generateConnectorChart]);

  useEffect(() => {
    // Initial load of all data
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    // Auto refresh only realtime data every 30 seconds (free!)
    const interval = setInterval(() => {
      refreshRealtimeData();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshRealtimeData]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const formatEnergy = (energy) => {
    return `${formatNumber(energy)} Wh`;
  };

  const exportData = () => {
    const dataToExport = {
      exportInfo: {
        timestamp: new Date().toISOString(),
        timeRange,
        generatedBy: 'SystemDashboard',
        version: '1.0.0'
      },
      overview: dashboardData.overview,
      summary: {
        totalRevenue: dashboardData.overview.totalRevenue,
        totalEnergy: dashboardData.overview.totalEnergy,
        totalSessions: dashboardData.overview.totalSessions,
        stationCount: dashboardData.overview.totalStations,
        onlineRate: dashboardData.overview.totalStations > 0 
          ? ((dashboardData.overview.onlineStations / dashboardData.overview.totalStations) * 100).toFixed(1)
          : '0',
        utilizationRate: dashboardData.overview.totalConnectors > 0
          ? ((dashboardData.overview.chargingConnectors / dashboardData.overview.totalConnectors) * 100).toFixed(1)
          : '0'
      },
      chartData: {
        revenue: dashboardData.revenueChart,
        energy: dashboardData.energyChart,
        stationStatus: dashboardData.stationChart,
        connectorStatus: dashboardData.connectorChart
      },
      rawData: {
        paymentsCount: dashboardData.payments.length,
        stationsCount: dashboardData.stations.length,
        realtimeStationsCount: Object.keys(dashboardData.realtime).length
      }
    };

    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `dashboard-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    console.log('📁 Dashboard data exported:', exportFileDefaultName);
  };

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h2>Dashboard Tổng Quan Hệ Thống</h2>
          <div className="dashboard-loading">
            <div className="loading-spinner"></div>
            <span>Đang tải dữ liệu...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h2>Dashboard Tổng Quan Hệ Thống</h2>
        </div>
        <div className="dashboard-error">
          <AlertTriangle size={48} color="#ef4444" />
          <p>{error}</p>
          <button onClick={loadDashboardData} className="retry-button">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
    maintainAspectRatio: false,
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h2>Dashboard Tổng Quan Hệ Thống</h2>
          <p className="dashboard-subtitle">
            Giám sát realtime - Cập nhật lần cuối: {lastUpdated.toLocaleTimeString('vi-VN')}
          </p>
        </div>
        <div className="dashboard-actions">
          <button 
            onClick={loadDashboardData} 
            className="refresh-button manual"
            disabled={isLoading}
            title="Tải lại tất cả dữ liệu (tốn quota)"
          >
            Tải lại tất cả
          </button>
          <button 
            onClick={refreshRealtimeData} 
            className="refresh-button realtime"
            disabled={isLoading}
            title="Chỉ cập nhật realtime (miễn phí)"
          >
            Realtime
          </button>
          <button onClick={exportData} className="export-button">
            <Download size={16} />
            Xuất dữ liệu
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card revenue">
          <div className="metric-icon">
            <DollarSign size={24} />
          </div>
          <div className="metric-content">
            <h3>Tổng Doanh Thu</h3>
            <p className="metric-value">{formatCurrency(dashboardData.overview.totalRevenue)}</p>
            <span className="metric-label">{dashboardData.overview.totalSessions} giao dịch</span>
            <span className="metric-label" style={{ color: '#0ea5e9', fontWeight: 500, display: 'block', marginTop: '4px' }}>
              Số dư ví : {formatCurrency(adminWallet)}
            </span>
          </div>
        </div>

        <div className="metric-card energy">
          <div className="metric-icon">
            <Battery size={24} />
          </div>
          <div className="metric-content">
            <h3>Tổng Năng Lượng</h3>
            <p className="metric-value">{formatEnergy(dashboardData.overview.totalEnergy)}</p>
            <span className="metric-label">Đã cung cấp</span>
          </div>
        </div>

        <div className="metric-card stations">
          <div className="metric-icon">
            <Zap size={24} />
          </div>
          <div className="metric-content">
            <h3>Trạm Hoạt Động</h3>
            <p className="metric-value">
              {dashboardData.overview.onlineStations}/{dashboardData.overview.totalStations}
            </p>
            <span className="metric-label">
              {((dashboardData.overview.onlineStations / dashboardData.overview.totalStations) * 100).toFixed(1)}% online
            </span>
          </div>
        </div>

        <div className="metric-card connectors">
          <div className="metric-icon">
            <Activity size={24} />
          </div>
          <div className="metric-content">
            <h3>Connector Đang Sạc</h3>
            <p className="metric-value">
              {dashboardData.overview.chargingConnectors}/{dashboardData.overview.totalConnectors}
            </p>
            <span className="metric-label">
              {((dashboardData.overview.chargingConnectors / dashboardData.overview.totalConnectors) * 100).toFixed(1)}% sử dụng
            </span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Revenue Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Biểu Đồ Doanh Thu</h3>
            <span className="chart-period">{timeRange === 'today' ? 'Theo giờ' : timeRange === 'week' ? 'Theo ngày' : 'Theo tháng'}</span>
          </div>
          <div className="chart-content">
            <Bar
              data={{
                labels: dashboardData.revenueChart.labels,
                datasets: [
                  {
                    label: 'Doanh thu (VND)',
                    data: dashboardData.revenueChart.data,
                    backgroundColor: 'rgba(34, 197, 94, 0.8)',
                    borderColor: 'rgba(34, 197, 94, 1)',
                    borderWidth: 1,
                  },
                ],
              }}
              options={chartOptions}
            />
          </div>
        </div>

        {/* Energy Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Biểu Đồ Năng Lượng</h3>
            <span className="chart-period">{timeRange === 'today' ? 'Theo giờ' : timeRange === 'week' ? 'Theo ngày' : 'Theo tháng'}</span>
          </div>
          <div className="chart-content">
            <Line
              data={{
                labels: dashboardData.energyChart.labels,
                datasets: [
                  {
                    label: 'Năng lượng (Wh)',
                    data: dashboardData.energyChart.data,
                    borderColor: 'rgba(59, 130, 246, 1)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    fill: true,
                  },
                ],
              }}
              options={chartOptions}
            />
          </div>
        </div>

        {/* Station Status Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Trạng Thái Trạm</h3>
            <span className="chart-period">Thời gian thực</span>
          </div>
          <div className="chart-content doughnut-chart">
            <Doughnut
              data={{
                labels: dashboardData.stationChart.labels,
                datasets: [
                  {
                    data: dashboardData.stationChart.data,
                    backgroundColor: [
                      'rgba(34, 197, 94, 0.8)',  // Online - Green
                      'rgba(239, 68, 68, 0.8)',  // Offline - Red
                      'rgba(245, 158, 11, 0.8)', // Faulted - Yellow
                    ],
                    borderWidth: 0,
                  },
                ],
              }}
              options={doughnutOptions}
            />
          </div>
        </div>

        {/* Connector Status Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Trạng Thái Connector</h3>
            <span className="chart-period">Thời gian thực</span>
          </div>
          <div className="chart-content doughnut-chart">
            <Doughnut
              data={{
                labels: dashboardData.connectorChart.labels,
                datasets: [
                  {
                    data: dashboardData.connectorChart.data,
                    backgroundColor: [
                      'rgba(34, 197, 94, 0.8)',  // Available - Green
                      'rgba(59, 130, 246, 0.8)', // Charging - Blue
                      'rgba(239, 68, 68, 0.8)',  // Faulted - Red
                      'rgba(156, 163, 175, 0.8)', // Unavailable - Gray
                    ],
                    borderWidth: 0,
                  },
                ],
              }}
              options={doughnutOptions}
            />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="summary-stats">
        <div className="stat-item">
          <Clock size={16} />
          <span>Thời gian sạc TB: {dashboardData.overview.avgSessionDuration} phút</span>
        </div>
        {dashboardData.overview.peakHours.length > 0 && (
          <div className="stat-item">
            <TrendingUp size={16} />
            <span>Giờ cao điểm: {dashboardData.overview.peakHours.join(', ')}</span>
          </div>
        )}
        <div className="stat-item">
          <Eye size={16} />
          <span>Cập nhật: {lastUpdated.toLocaleString('vi-VN')}</span>
        </div>
      </div>
    </div>
  );
};

export default SystemDashboard;