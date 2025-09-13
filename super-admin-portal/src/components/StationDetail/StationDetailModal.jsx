import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, MapPin, Zap, Activity, DollarSign, Clock, 
  TrendingUp, Users, Battery, AlertTriangle, CheckCircle,
  Calendar, Phone, Mail, Building, Loader2, AlertCircle
} from 'lucide-react';
import StationBasicInfo from './StationBasicInfo';
import StationStatistics from './StationStatistics';
import StationConnectors from './StationConnectors';
import StationRevenue from './StationRevenue';
import StationSessions from './StationSessions';
import SuperAdminService from '../../services/superAdminService';
import RealtimeService from '../../services/RealtimeService';
import './StationDetailModal.css';

const StationDetailModal = ({ station, isOpen, onClose }) => {
  const [stationData, setStationData] = useState(null);
  const [realtimeData, setRealtimeData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadStationDetail = useCallback(async () => {
    if (!station) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Load dữ liệu song song
      const [
        realtimeResponse,
        sessionsResponse,
        paymentsResponse
      ] = await Promise.all([
        RealtimeService.getRealtimeStation(station.id),
        SuperAdminService.getSessionsInRange(
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 ngày trước
          new Date()
        ),
        SuperAdminService.getPaymentsInRange(
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 ngày trước
          new Date()
        )
      ]);

      // Filter dữ liệu theo station
      const stationSessions = (sessionsResponse || []).filter(s => s.stationId === station.id);
      const stationPayments = (paymentsResponse || []).filter(p => p.stationId === station.id);

      setStationData(station);
      setRealtimeData(realtimeResponse);
      setSessions(stationSessions);
      setPayments(stationPayments);
      
      // Tính analytics
      const analyticsData = calculateStationAnalytics(station, stationSessions, stationPayments, realtimeResponse);
      setAnalytics(analyticsData);

    } catch (error) {
      console.error('Error loading station detail:', error);
      setError('Không thể tải thông tin trạm sạc');
    } finally {
      setIsLoading(false);
    }
  }, [station]);

  useEffect(() => {
    if (isOpen && station) {
      loadStationDetail();
    }
  }, [isOpen, station, loadStationDetail]);

  // Auto refresh realtime data every 10 seconds
  useEffect(() => {
    if (!isOpen || !autoRefresh || !station) return;

    const refreshInterval = setInterval(() => {
      RealtimeService.getRealtimeStation(station.id).then(newRealtimeData => {
        if (newRealtimeData) {
          setRealtimeData(newRealtimeData);
        }
      }).catch(error => {
        console.error('Auto refresh error:', error);
      });
    }, 10000); // 10 seconds

    return () => clearInterval(refreshInterval);
  }, [isOpen, autoRefresh, station]);

  const calculateStationAnalytics = (station, sessions, payments, realtime) => {
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Sessions trong 7 và 30 ngày
    const sessions7Days = sessions.filter(s => new Date(s.createdAt) >= last7Days);
    const sessions30Days = sessions.filter(s => new Date(s.createdAt) >= last30Days);

    // Payments trong 7 và 30 ngày
    const payments7Days = payments.filter(p => new Date(p.createdAt) >= last7Days);
    const payments30Days = payments.filter(p => new Date(p.createdAt) >= last30Days);

    // Tính toán metrics
    const totalRevenue30Days = payments30Days.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalRevenue7Days = payments7Days.reduce((sum, p) => sum + (p.amount || 0), 0);
    const avgRevenuePerDay = totalRevenue30Days / 30;
    
    const totalSessions30Days = sessions30Days.length;
    const totalSessions7Days = sessions7Days.length;
    const avgSessionsPerDay = totalSessions30Days / 30;

    // Thời gian sạc trung bình
    const completedSessions = sessions30Days.filter(s => s.status === 'completed' && s.duration);
    const avgDuration = completedSessions.length > 0 
      ? completedSessions.reduce((sum, s) => sum + s.duration, 0) / completedSessions.length 
      : 0;

    // Utilization rate
    const totalConnectors = realtime?.connectors ? Object.keys(realtime.connectors).length : 1;
    const hoursInMonth = 30 * 24;
    const totalPossibleHours = totalConnectors * hoursInMonth;
    const usedHours = completedSessions.reduce((sum, s) => sum + (s.duration || 0) / 60, 0);
    const utilizationRate = totalPossibleHours > 0 ? (usedHours / totalPossibleHours) * 100 : 0;

    return {
      revenue: {
        total30Days: totalRevenue30Days,
        total7Days: totalRevenue7Days,
        avgPerDay: avgRevenuePerDay,
        growth7Days: totalRevenue7Days > 0 ? ((totalRevenue7Days / 7) / avgRevenuePerDay - 1) * 100 : 0
      },
      sessions: {
        total30Days: totalSessions30Days,
        total7Days: totalSessions7Days,
        avgPerDay: avgSessionsPerDay,
        avgDuration: avgDuration,
        growth7Days: totalSessions7Days > 0 ? ((totalSessions7Days / 7) / avgSessionsPerDay - 1) * 100 : 0
      },
      utilization: {
        rate: utilizationRate,
        totalConnectors,
        usedHours,
        totalPossibleHours
      }
    };
  };

  if (!isOpen) return null;

  return (
    <div className="station-detail-modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">
            <Zap size={24} />
            Chi tiết trạm sạc: {station?.stationName || station?.name || station?.id}
          </h2>
          <div className="header-controls">
            <button 
              className={`refresh-toggle ${autoRefresh ? 'active' : ''}`}
              onClick={() => setAutoRefresh(!autoRefresh)}
              title={autoRefresh ? 'Tắt tự động refresh' : 'Bật tự động refresh'}
            >
              <Activity size={16} />
              {autoRefresh ? 'Live' : 'Manual'}
            </button>
            <button onClick={onClose} className="close-button">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="modal-body">
          {isLoading ? (
            <div className="loading-state">
              <Loader2 className="spinner" size={48} />
              <div>Đang tải thông tin trạm sạc...</div>
            </div>
          ) : error ? (
            <div className="error-state">
              <AlertCircle size={48} />
              <div className="error-message">
                <h3>Có lỗi xảy ra</h3>
                <p>{error}</p>
                <button onClick={loadStationDetail} className="btn btn-primary">
                  Thử lại
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Tab Navigation */}
              <div className="modal-tabs">
                <button 
                  className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('overview')}
                >
                  <Activity size={16} />
                  Tổng quan
                </button>
                <button 
                  className={`tab-button ${activeTab === 'connectors' ? 'active' : ''}`}
                  onClick={() => setActiveTab('connectors')}
                >
                  <Zap size={16} />
                  Connectors
                </button>
                <button 
                  className={`tab-button ${activeTab === 'revenue' ? 'active' : ''}`}
                  onClick={() => setActiveTab('revenue')}
                >
                  <DollarSign size={16} />
                  Doanh thu
                </button>
                <button 
                  className={`tab-button ${activeTab === 'sessions' ? 'active' : ''}`}
                  onClick={() => setActiveTab('sessions')}
                >
                  <Users size={16} />
                  Phiên sạc
                </button>
              </div>

              {/* Tab Content */}
              <div className="tab-content">
                {activeTab === 'overview' && (
                  <div className="overview-tab">
                    <StationBasicInfo 
                      station={stationData} 
                    />
                    <StationStatistics 
                      analytics={analytics}
                      realtimeData={realtimeData}
                    />
                  </div>
                )}

                {activeTab === 'connectors' && (
                  <StationConnectors 
                    realtimeData={realtimeData}
                    stationId={station.id}
                  />
                )}

                {activeTab === 'revenue' && (
                  <StationRevenue 
                    payments={payments}
                  />
                )}

                {activeTab === 'sessions' && (
                  <StationSessions 
                    sessions={sessions}
                    analytics={analytics}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StationDetailModal;