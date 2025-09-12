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
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { X, TrendingUp, DollarSign, Zap, Clock } from 'lucide-react';
import { DashboardService } from '../services/dashboardService';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement
);

const StationDashboard = ({ station, onClose }) => {
  const [dashboardData, setDashboardData] = useState({
    totalRevenue: 0,
    totalSessions: 0,
    totalEnergy: 0,
    averageSessionTime: 0,
    dailyRevenue: [],
    hourlyRevenue: [],
    connectorUsage: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('week');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (station?.id) {
      loadStationData();
    }
  }, [station?.id, timeRange, selectedMonth, selectedYear]);

  const loadStationData = async () => {
    if (!station?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await DashboardService.getStationDashboardData(
        station.id,
        timeRange,
        selectedMonth,
        selectedYear
      );
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading station dashboard:', error);
      setError('Không thể tải dữ liệu thống kê trạm sạc. Vui lòng thử lại sau.');
      setDashboardData({
        totalRevenue: 0,
        totalSessions: 0,
        totalEnergy: 0,
        averageSessionTime: 0,
        dailyRevenue: [],
        hourlyRevenue: [],
        connectorUsage: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes} phút`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  // Chart configurations
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

  const hourlyRevenueChartData = {
    labels: dashboardData.hourlyRevenue.map(item => item.hour),
    datasets: [
      {
        label: 'Doanh thu theo giờ (VND)',
        data: dashboardData.hourlyRevenue.map(item => item.revenue),
        backgroundColor: 'rgba(147, 51, 234, 0.5)',
        borderColor: 'rgba(147, 51, 234, 1)',
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

  if (isLoading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div className="card" style={{ width: '400px' }}>
          <div className="card-body" style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="loading" style={{ width: '40px', height: '40px', margin: '0 auto' }}></div>
            <p style={{ marginTop: '1rem', color: '#6b7280' }}>Đang tải thống kê trạm sạc...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '1200px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.25rem' }}>
              📊 Thống kê trạm sạc
            </h2>
            <p style={{ color: '#6b7280', margin: 0 }}>
              {station.stationName || station.id} • ID: {station.id}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              color: '#6b7280'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {error ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ color: '#dc2626', marginBottom: '1rem' }}>
                <span style={{ fontSize: '2rem' }}>⚠️</span>
              </div>
              <p style={{ color: '#dc2626', fontWeight: '500' }}>{error}</p>
              <button 
                onClick={loadStationData}
                className="btn btn-primary"
                style={{ marginTop: '1rem' }}
              >
                Thử lại
              </button>
            </div>
          ) : (
            <>
              {/* Time Range Selector */}
              <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <label style={{ fontWeight: '500', color: '#374151' }}>Khoảng thời gian:</label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                >
                  <option value="today">Hôm nay</option>
                  <option value="yesterday">Hôm qua</option>
                  <option value="week">7 ngày qua</option>
                  <option value="month">Tháng hiện tại</option>
                </select>

                {timeRange === 'month' && (
                  <>
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
                  </>
                )}

                <button
                  onClick={loadStationData}
                  className="btn btn-outline"
                >
                  🔄 Cập nhật
                </button>
              </div>

              {/* Key Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div className="card">
                  <div className="card-body" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💰</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1f2937' }}>
                      {formatCurrency(dashboardData.totalRevenue)}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Tổng doanh thu</div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-body" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚡</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1f2937' }}>
                      {formatNumber(dashboardData.totalSessions)}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Tổng phiên sạc</div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-body" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔋</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1f2937' }}>
                      {formatNumber(dashboardData.totalEnergy)} kWh
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Tổng năng lượng</div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-body" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏱️</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1f2937' }}>
                      {formatTime(dashboardData.averageSessionTime)}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Thời gian TB/phiên</div>
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div style={{ display: 'grid', gridTemplateColumns: timeRange === 'today' || timeRange === 'yesterday' ? '1fr' : '1fr 1fr', gap: '1.5rem' }}>
                {/* Hourly Chart for Today/Yesterday */}
                {(timeRange === 'today' || timeRange === 'yesterday') && dashboardData.hourlyRevenue.length > 0 && (
                  <div className="card">
                    <div className="card-header">
                      <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>
                        🕐 Doanh thu theo giờ - {timeRange === 'today' ? 'Hôm nay' : 'Hôm qua'}
                      </h3>
                    </div>
                    <div className="card-body">
                      <Bar data={hourlyRevenueChartData} options={chartOptions} />
                    </div>
                  </div>
                )}

                {/* Daily Chart for Week/Month */}
                {dashboardData.dailyRevenue.length > 0 && timeRange !== 'today' && timeRange !== 'yesterday' && (
                  <div className="card">
                    <div className="card-header">
                      <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>
                        📅 Doanh thu theo ngày
                      </h3>
                    </div>
                    <div className="card-body">
                      <Line data={dailyRevenueChartData} options={chartOptions} />
                    </div>
                  </div>
                )}

                {/* Connector Usage */}
                {dashboardData.connectorUsage.length > 0 && (
                  <div className="card">
                    <div className="card-header">
                      <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>
                        🔌 Hiệu suất cổng sạc
                      </h3>
                    </div>
                    <div className="card-body">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {dashboardData.connectorUsage.map((connector, index) => (
                          <div key={index} style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            padding: '0.75rem',
                            backgroundColor: '#f8fafc',
                            borderRadius: '6px'
                          }}>
                            <div>
                              <div style={{ fontWeight: '600', color: '#1f2937' }}>
                                Cổng {connector.connectorId}
                              </div>
                              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                {connector.sessions} phiên • {formatCurrency(connector.revenue)}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{
                                width: '60px',
                                height: '8px',
                                backgroundColor: '#e5e7eb',
                                borderRadius: '4px',
                                overflow: 'hidden',
                                marginBottom: '0.25rem'
                              }}>
                                <div style={{
                                  width: `${connector.usage}%`,
                                  height: '100%',
                                  backgroundColor: connector.usage > 70 ? '#10b981' : connector.usage > 50 ? '#f59e0b' : '#ef4444'
                                }} />
                              </div>
                              <div style={{ fontSize: '0.75rem', fontWeight: '600' }}>
                                {connector.usage}%
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Empty State */}
              {dashboardData.totalSessions === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
                  <h3 style={{ marginBottom: '0.5rem' }}>Chưa có dữ liệu</h3>
                  <p>Chưa có phiên sạc nào cho trạm này trong khoảng thời gian đã chọn.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StationDashboard;