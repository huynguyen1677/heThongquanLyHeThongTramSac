import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { 
  Zap, 
  Activity, 
  DollarSign, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Users,
  MapPin
} from 'lucide-react';
import SuperAdminService from '../services/superAdminService';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Overview = () => {
  const [overview, setOverview] = useState({
    totalStations: 0,
    onlineStations: 0,
    offlineStations: 0,
    activeSessions: 0,
    todayRevenue: 0,
    todayEnergy: 0,
    mostCommonError: 'No errors',
    errorCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadOverviewData();
  }, []);

  const loadOverviewData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await SuperAdminService.getSystemOverview();
      setOverview(data);
      
      // Show warning if using demo data
      if (data.isDemoData) {
        console.warn('📊 Using demo data - please set up Firestore indexes for real data');
      }
    } catch (error) {
      console.error('Error loading overview:', error);
      setError('Không thể tải dữ liệu tổng quan. Vui lòng thử lại sau.');
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

  // Chart data for station status
  const stationStatusData = {
    labels: ['Trực Tuyến', 'Ngoại Tuyến'],
    datasets: [
      {
        data: [overview.onlineStations, overview.offlineStations],
        backgroundColor: ['#10b981', '#ef4444'],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
    maintainAspectRatio: false,
  };

  if (isLoading) {
    return (
      <div className="page-header">
        <h1 className="page-title">Tổng Quan Hệ Thống</h1>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <div className="loading" style={{ width: '40px', height: '40px' }}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-header">
        <h1 className="page-title">Tổng Quan Hệ Thống</h1>
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
          <p style={{ color: '#ef4444', fontWeight: '500' }}>{error}</p>
          <button onClick={loadOverviewData} className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Tổng Quan Hệ Thống</h1>
        <p className="page-description">
          Giám sát thời gian thực cơ sở hạ tầng mạng lưới trạm sạc
        </p>
      </div>

      {/* Demo Data Warning */}
      {overview.isDemoData && (
        <div className="card" style={{ 
          backgroundColor: '#fef3c7', 
          border: '1px solid #f59e0b', 
          marginBottom: '2rem',
          padding: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={20} color="#f59e0b" />
            <p style={{ margin: 0, color: '#92400e', fontWeight: '500' }}>
              Đang hiển thị dữ liệu mẫu - Cần tạo Firestore indexes để sử dụng dữ liệu thật
            </p>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-4" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>
                Tổng Số Trạm
              </p>
              <p style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>
                {formatNumber(overview.totalStations)}
              </p>
              <p style={{ fontSize: '0.875rem', color: '#10b981', margin: '0.25rem 0 0 0' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <MapPin size={14} />
                  Toàn Mạng Lưới
                </span>
              </p>
            </div>
            <div style={{ 
              padding: '1rem', 
              backgroundColor: '#dbeafe', 
              borderRadius: '0.75rem',
              color: '#1e40af'
            }}>
              <Zap size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>
                Phiên Sạc Đang Hoạt Động
              </p>
              <p style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>
                {formatNumber(overview.activeSessions)}
              </p>
              <p style={{ fontSize: '0.875rem', color: '#10b981', margin: '0.25rem 0 0 0' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Activity size={14} />
                  Đang Sạc
                </span>
              </p>
            </div>
            <div style={{ 
              padding: '1rem', 
              backgroundColor: '#dcfce7', 
              borderRadius: '0.75rem',
              color: '#166534'
            }}>
              <Activity size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>
                Doanh Thu Hôm Nay
              </p>
              <p style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>
                {formatCurrency(overview.todayRevenue)}
              </p>
              <p style={{ fontSize: '0.875rem', color: '#10b981', margin: '0.25rem 0 0 0' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <TrendingUp size={14} />
                  {formatNumber(overview.todayEnergy)} kWh
                </span>
              </p>
            </div>
            <div style={{ 
              padding: '1rem', 
              backgroundColor: '#fef3c7', 
              borderRadius: '0.75rem',
              color: '#92400e'
            }}>
              <DollarSign size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>
                Cảnh Báo Hệ Thống
              </p>
              <p style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>
                {formatNumber(overview.errorCount)}
              </p>
              <p style={{ 
                fontSize: '0.875rem', 
                color: overview.errorCount > 0 ? '#ef4444' : '#6b7280', 
                margin: '0.25rem 0 0 0' 
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <AlertTriangle size={14} />
                  {overview.errorCount > 0 ? overview.mostCommonError : 'Tất Cả Ổn'}
                </span>
              </p>
            </div>
            <div style={{ 
              padding: '1rem', 
              backgroundColor: overview.errorCount > 0 ? '#fee2e2' : '#f3f4f6', 
              borderRadius: '0.75rem',
              color: overview.errorCount > 0 ? '#991b1b' : '#6b7280'
            }}>
              <AlertTriangle size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Details */}
      <div className="grid grid-2">
        {/* Station Status Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Phân Bố Trạng Thái Trạm</h3>
          </div>
          <div style={{ height: '300px', position: 'relative' }}>
            <Doughnut data={stationStatusData} options={chartOptions} />
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between' }}>
            <div className="status-badge status-online">
              🟢 {overview.onlineStations} Trực Tuyến ({Math.round((overview.onlineStations / overview.totalStations) * 100)}%)
            </div>
            <div className="status-badge status-offline">
              🔴 {overview.offlineStations} Ngoại Tuyến ({Math.round((overview.offlineStations / overview.totalStations) * 100)}%)
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Thao Tác Nhanh</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button className="btn btn-primary" style={{ justifyContent: 'flex-start' }}>
              <Users size={16} />
              Quản Lý Chủ Trạm
            </button>
            <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              <Zap size={16} />
              Điều Khiển Trạm
            </button>
            <button className="btn btn-success" style={{ justifyContent: 'flex-start' }}>
              <DollarSign size={16} />
              Báo Cáo Doanh Thu
            </button>
            <button className="btn btn-outline" style={{ justifyContent: 'flex-start' }}>
              <AlertTriangle size={16} />
              Chẩn Đoán Hệ Thống
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity Summary */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <div className="card-header">
          <h3 className="card-title">Tóm Tắt Tình Trạng Hệ Thống</h3>
        </div>
        <div className="grid grid-3">
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
              {((overview.onlineStations / overview.totalStations) * 100).toFixed(1)}%
            </div>
            <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Thời Gian Hoạt Động Mạng</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
              {formatNumber(overview.activeSessions)}
            </div>
            <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Phiên Đang Hoạt Động</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
              {overview.errorCount === 0 ? '✅' : '⚠️'}
            </div>
            <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Trạng Thái Hệ Thống</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;