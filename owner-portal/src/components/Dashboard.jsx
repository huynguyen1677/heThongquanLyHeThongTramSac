import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { Calendar, TrendingUp, DollarSign, Zap, Users, MapPin } from 'lucide-react';
import DashboardService from '../services/dashboardService';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  ArcElement
);

const Dashboard = ({ ownerId }) => {
  const [dashboardData, setDashboardData] = useState({
    totalRevenue: 0,
    totalSessions: 0,
    totalEnergy: 0,
    totalStations: 0,
    activeStations: 0,
    averageSessionTime: 0,
    monthlyRevenue: [],
    dailyRevenue: [],
    stationUsage: [],
    revenueByStation: []
  });
  const [comparisonData, setComparisonData] = useState({
    previousRevenue: 0,
    previousSessions: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('month');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (ownerId) {
      loadDashboardData();
    }
  }, [ownerId, timeRange, selectedMonth, selectedYear]);

  const loadDashboardData = async () => {
    if (!ownerId) {
      console.warn('No ownerId provided');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Load main dashboard data
      const data = await DashboardService.getDashboardData(
        ownerId, 
        timeRange, 
        selectedMonth, 
        selectedYear
      );
      setDashboardData(data);

      // Load comparison data
      const comparison = await DashboardService.getComparisonStats(
        ownerId, 
        timeRange, 
        selectedMonth, 
        selectedYear
      );
      setComparisonData(comparison);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Không thể tải dữ liệu thống kê. Vui lòng thử lại sau.');
      // Fallback to empty data
      setDashboardData({
        totalRevenue: 0,
        totalSessions: 0,
        totalEnergy: 0,
        totalStations: 0,
        activeStations: 0,
        averageSessionTime: 0,
        monthlyRevenue: [],
        dailyRevenue: [],
        stationUsage: [],
        revenueByStation: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate percentage change
  const calculatePercentageChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100 * 10) / 10;
  };

  const revenueChange = calculatePercentageChange(dashboardData.totalRevenue, comparisonData.previousRevenue);
  const sessionsChange = calculatePercentageChange(dashboardData.totalSessions, comparisonData.previousSessions);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  // Chart configurations
  const monthlyRevenueChartData = {
    labels: dashboardData.monthlyRevenue.map(item => item.month),
    datasets: [
      {
        label: 'Doanh thu (VND)',
        data: dashboardData.monthlyRevenue.map(item => item.revenue),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
      },
    ],
  };

  const dailyRevenueChartData = {
    labels: dashboardData.dailyRevenue.map(item => item.date),
    datasets: [
      {
        label: 'Doanh thu hàng ngày',
        data: dashboardData.dailyRevenue.map(item => item.revenue),
        borderColor: 'rgba(16, 185, 129, 1)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const stationUsageChartData = {
    labels: dashboardData.stationUsage.map(item => item.name),
    datasets: [
      {
        data: dashboardData.stationUsage.map(item => item.revenue),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
        ],
        borderWidth: 2,
      },
    ],
  };

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
        ticks: {
          callback: function(value) {
            return new Intl.NumberFormat('vi-VN').format(value);
          }
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.label}: ${formatCurrency(context.raw)}`;
          }
        }
      }
    },
  };

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="loading" style={{ width: '40px', height: '40px' }}></div>
        <p style={{ marginTop: '1rem', color: '#6b7280' }}>Đang tải dữ liệu thống kê...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ color: '#dc2626', marginBottom: '1rem' }}>
          <span style={{ fontSize: '2rem' }}>⚠️</span>
        </div>
        <p style={{ color: '#dc2626', fontWeight: '500' }}>{error}</p>
        <button 
          onClick={loadDashboardData}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>
          📊 Dashboard & Thống kê
        </h2>
        <p style={{ color: '#6b7280' }}>
          Tổng quan doanh thu và hiệu suất hoạt động của hệ thống trạm sạc
        </p>
      </div>

      {/* Time Range Selector */}
      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <label style={{ fontWeight: '500', color: '#374151' }}>Khoảng thời gian:</label>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
        >
          <option value="week">7 ngày qua</option>
          <option value="month">Tháng hiện tại</option>
          <option value="year">Năm hiện tại</option>
        </select>

        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i} value={i}>Tháng {i + 1}</option>
          ))}
        </select>

        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
        >
          {[2023, 2024, 2025].map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>

        <button
          onClick={loadDashboardData}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          🔄 Cập nhật
        </button>
      </div>

      {/* Key Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card">
          <div className="card-body" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>Tổng doanh thu</p>
                <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', margin: '0.5rem 0' }}>
                  {formatCurrency(dashboardData.totalRevenue)}
                </p>
                <p style={{ color: revenueChange >= 0 ? '#16a34a' : '#dc2626', fontSize: '0.875rem', margin: 0 }}>
                  <TrendingUp size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                  {revenueChange >= 0 ? '+' : ''}{revenueChange}% so với kỳ trước
                </p>
              </div>
              <div style={{ 
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', 
                padding: '0.75rem', 
                borderRadius: '50%' 
              }}>
                <DollarSign size={24} color="white" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>Tổng phiên sạc</p>
                <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', margin: '0.5rem 0' }}>
                  {formatNumber(dashboardData.totalSessions)}
                </p>
                <p style={{ color: sessionsChange >= 0 ? '#16a34a' : '#dc2626', fontSize: '0.875rem', margin: 0 }}>
                  <TrendingUp size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                  {sessionsChange >= 0 ? '+' : ''}{sessionsChange}% so với kỳ trước
                </p>
              </div>
              <div style={{ 
                background: 'linear-gradient(135deg, #10b981, #047857)', 
                padding: '0.75rem', 
                borderRadius: '50%' 
              }}>
                <Users size={24} color="white" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>Tổng năng lượng</p>
                <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', margin: '0.5rem 0' }}>
                  {formatNumber(dashboardData.totalEnergy)} kWh
                </p>
                <p style={{ color: '#16a34a', fontSize: '0.875rem', margin: 0 }}>
                  <Zap size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                  Năng lượng sạch được cung cấp
                </p>
              </div>
              <div style={{ 
                background: 'linear-gradient(135deg, #f59e0b, #d97706)', 
                padding: '0.75rem', 
                borderRadius: '50%' 
              }}>
                <Zap size={24} color="white" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>Trạm hoạt động</p>
                <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', margin: '0.5rem 0' }}>
                  {dashboardData.activeStations}/{dashboardData.totalStations}
                </p>
                <p style={{ color: '#16a34a', fontSize: '0.875rem', margin: 0 }}>
                  Tỷ lệ: {dashboardData.totalStations > 0 ? Math.round((dashboardData.activeStations / dashboardData.totalStations) * 100) : 0}%
                </p>
              </div>
              <div style={{ 
                background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', 
                padding: '0.75rem', 
                borderRadius: '50%' 
              }}>
                <MapPin size={24} color="white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      {dashboardData.monthlyRevenue.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Monthly Revenue Chart */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>
                📈 Doanh thu theo tháng {selectedYear}
              </h3>
            </div>
            <div className="card-body">
              <Bar data={monthlyRevenueChartData} options={chartOptions} />
            </div>
          </div>

          {/* Station Revenue Distribution */}
          {dashboardData.stationUsage.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>
                  🏢 Doanh thu theo trạm
                </h3>
              </div>
              <div className="card-body">
                <Doughnut data={stationUsageChartData} options={doughnutOptions} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Daily Revenue Chart */}
      {dashboardData.dailyRevenue.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>
              📅 Doanh thu hàng ngày - Tháng {selectedMonth + 1}/{selectedYear}
            </h3>
          </div>
          <div className="card-body">
            <Line data={dailyRevenueChartData} options={chartOptions} />
          </div>
        </div>
      )}

      {/* Station Performance Table */}
      {dashboardData.stationUsage.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>
              🏆 Hiệu suất trạm sạc
            </h3>
          </div>
          <div className="card-body">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>
                      Trạm sạc
                    </th>
                    <th style={{ textAlign: 'center', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>
                      Phiên sạc
                    </th>
                    <th style={{ textAlign: 'center', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>
                      Tỷ lệ sử dụng
                    </th>
                    <th style={{ textAlign: 'right', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>
                      Doanh thu
                    </th>
                    <th style={{ textAlign: 'center', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>
                      Đánh giá
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.stationUsage.map((station, index) => (
                    <tr key={station.stationId} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.75rem' }}>
                        <div>
                          <div style={{ fontWeight: '500', color: '#1f2937' }}>{station.name}</div>
                          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{station.stationId}</div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', padding: '0.75rem', fontWeight: '500' }}>
                        {station.sessions}
                      </td>
                      <td style={{ textAlign: 'center', padding: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                          <div style={{
                            width: '60px',
                            height: '8px',
                            backgroundColor: '#e5e7eb',
                            borderRadius: '4px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${station.usage}%`,
                              height: '100%',
                              backgroundColor: station.usage > 70 ? '#10b981' : station.usage > 50 ? '#f59e0b' : '#ef4444',
                              transition: 'width 0.3s ease'
                            }} />
                          </div>
                          <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{station.usage}%</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', padding: '0.75rem', fontWeight: '600', color: '#1f2937' }}>
                        {formatCurrency(station.revenue)}
                      </td>
                      <td style={{ textAlign: 'center', padding: '0.75rem' }}>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: station.usage > 70 ? '#dcfce7' : station.usage > 50 ? '#fef3c7' : '#fee2e2',
                          color: station.usage > 70 ? '#166534' : station.usage > 50 ? '#92400e' : '#991b1b'
                        }}>
                          {station.usage > 70 ? 'Xuất sắc' : station.usage > 50 ? 'Tốt' : 'Cần cải thiện'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {dashboardData.totalSessions === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
          <h3 style={{ marginBottom: '0.5rem' }}>Chưa có dữ liệu</h3>
          <p>Chưa có phiên sạc nào trong khoảng thời gian đã chọn.</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;