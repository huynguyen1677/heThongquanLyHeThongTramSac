import React, { useState, useEffect } from 'react';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import './ChargingSessionsList.css';

const ChargingSessionsList = ({ ownerId }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [groupByStation, setGroupByStation] = useState(true);
  const [selectedStation, setSelectedStation] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchSessions = async () => {
      if (!ownerId) return;

      try {
        setLoading(true);
        
        // Query Firestore directly for charging sessions by ownerId
        // Remove orderBy to avoid composite index requirement for now
        const sessionsRef = collection(db, 'chargingSessions');
        const q = query(
          sessionsRef,
          where('ownerId', '==', ownerId),
          limit(100)
        );
        
        const querySnapshot = await getDocs(q);
        const sessionsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Sort manually after fetching
        const sortedSessions = sessionsData.sort((a, b) => {
          const dateA = new Date(a.startTime);
          const dateB = new Date(b.startTime);
          return dateB - dateA; // Newest first
        });
        
        setSessions(sortedSessions);
      } catch (err) {
        console.error('Error fetching charging sessions from Firestore:', err);
        setError('Không thể tải dữ liệu phiên sạc từ Firestore');
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [ownerId]);

  // Group sessions by station
  const groupedSessions = React.useMemo(() => {
    if (!groupByStation) return { 'all': sessions };
    
    return sessions.reduce((groups, session) => {
      const stationKey = session.stationId || 'unknown';
      if (!groups[stationKey]) {
        groups[stationKey] = [];
      }
      groups[stationKey].push(session);
      return groups;
    }, {});
  }, [sessions, groupByStation]);

  // Get unique stations for filter
  const stations = React.useMemo(() => {
    const stationSet = new Set(sessions.map(s => s.stationId).filter(Boolean));
    return Array.from(stationSet);
  }, [sessions]);

  // Filter sessions based on selected station
  const filteredSessions = React.useMemo(() => {
    if (selectedStation === 'all') return sessions;
    return sessions.filter(s => s.stationId === selectedStation);
  }, [sessions, selectedStation]);

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString('vi-VN');
  };

  const formatEnergy = (wh) => {
    if (!wh) return '0 kWh';
    return `${(wh / 1000).toFixed(2)} kWh`;
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0 ₫';
    return `${amount.toLocaleString('vi-VN')} ₫`;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { className: 'status-completed', text: 'Hoàn thành' },
      cancelled: { className: 'status-cancelled', text: 'Đã hủy' },
      error: { className: 'status-error', text: 'Lỗi' },
      active: { className: 'status-active', text: 'Đang sạc' }
    };
    
    const config = statusConfig[status] || { className: 'status-active', text: status };
    
    return (
      <span className={`status-badge ${config.className}`}>
        {config.text}
      </span>
    );
  };

  const getStatusText = (status) => {
    const statusTexts = {
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy', 
      error: 'Lỗi',
      active: 'Đang sạc'
    };
    return statusTexts[status] || status;
  };

  const renderSessionItem = (session) => {
    return (
      <div key={session.id} className="session-item">
        <div className="session-main">
          <div className="session-info">
            <div className="session-title">
              <div className="connector-badge">
                Cổng {session.connectorId}
              </div>
              <div className="session-user">
                👤 {session.userId}
              </div>
            </div>
            
            <div className="session-datetime">
              🕐 {formatDateTime(session.startTime)}
              {session.stopTime && ` → ${formatDateTime(session.stopTime)}`}
            </div>

            <div className="session-stats">
              <div className="stat-item">
                <div className="stat-label">Thời gian</div>
                <div className="stat-value">{formatDuration(session.duration)}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Năng lượng</div>
                <div className="stat-value">{formatEnergy(session.energyConsumed)}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Meter Start</div>
                <div className="stat-value">{formatEnergy(session.meterStart || 0)}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Meter Stop</div>
                <div className="stat-value">{formatEnergy(session.meterStop || 0)}</div>
              </div>
            </div>

            {session.reason && (
              <div className="session-address">
                📝 Lý do: {session.reason}
              </div>
            )}

            {session.stationInfo?.address && (
              <div className="session-address">
                📍 {session.stationInfo.address}
              </div>
            )}
          </div>

          <div className="session-status">
            {getStatusBadge(session.status)}
            <div className="cost-highlight">
              💰 {formatCurrency(session.estimatedCost)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="charging-sessions-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải dữ liệu phiên sạc...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="charging-sessions-container">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <p>{error}</p>
          <button 
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with title and controls */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Lịch sử phiên sạc</h2>
            <p className="text-sm text-gray-500 mt-1">
              Tổng cộng: {sessions.length} phiên • {stations.length} trạm sạc
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Station Filter */}
            <select
              value={selectedStation}
              onChange={(e) => setSelectedStation(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả trạm</option>
              {stations.map(stationId => (
                <option key={stationId} value={stationId}>
                  {stationId}
                </option>
              ))}
            </select>
            
            {/* Group Toggle */}
            <button
              onClick={() => setGroupByStation(!groupByStation)}
              className={`px-4 py-2 rounded-md transition-colors ${
                groupByStation 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {groupByStation ? '📊 Theo trạm' : '📋 Danh sách'}
            </button>
            
            {/* Refresh Button */}
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              🔄 Làm mới
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {sessions.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">🔌</div>
          <p className="text-gray-500 text-lg">Chưa có phiên sạc nào</p>
          <p className="text-gray-400 text-sm mt-2">Các phiên sạc sẽ xuất hiện ở đây khi có người dùng sạc xe</p>
        </div>
      ) : groupByStation ? (
        /* Group by Station View */
        <div className="space-y-6">
          {Object.entries(groupedSessions).map(([stationId, stationSessions]) => (
            <div key={stationId} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 font-bold">🏢</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {stationSessions[0]?.stationInfo?.stationName || stationId}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {stationSessions[0]?.stationInfo?.address || 'Địa chỉ chưa cập nhật'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600">{stationSessions.length}</p>
                    <p className="text-xs text-gray-500">phiên sạc</p>
                  </div>
                </div>
                
                {/* Station Summary */}
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-gray-500">Tổng năng lượng</p>
                    <p className="font-semibold text-green-600">
                      {formatEnergy(stationSessions.reduce((sum, s) => sum + (s.energyConsumed || 0), 0))}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-gray-500">Tổng doanh thu</p>
                    <p className="font-semibold text-blue-600">
                      {formatCurrency(stationSessions.reduce((sum, s) => sum + (s.estimatedCost || 0), 0))}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-gray-500">Phiên gần nhất</p>
                    <p className="font-semibold">
                      {formatDateTime(stationSessions[0]?.startTime)}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-gray-500">Cổng sạc</p>
                    <p className="font-semibold">
                      {new Set(stationSessions.map(s => s.connectorId)).size} cổng
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Sessions List for this station */}
              <div className="divide-y divide-gray-200">
                {stationSessions.slice(0, 5).map((session) => (
                  <SessionItem key={session.id} session={session} />
                ))}
                {stationSessions.length > 5 && (
                  <div className="px-6 py-4 bg-gray-50 text-center">
                    <button 
                      className="text-blue-600 hover:text-blue-700 font-medium"
                      onClick={() => setSelectedStation(stationId)}
                    >
                      Xem thêm {stationSessions.length - 5} phiên sạc →
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="divide-y divide-gray-200">
            {filteredSessions.map((session) => (
              <SessionItem key={session.id} session={session} showStation={true} />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Session Item Component
  function SessionItem({ session, showStation = false }) {
    return (
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">
                      {session.connectorId}
                    </span>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {showStation && (session.stationInfo?.stationName || session.stationId)}
                    {!showStation && `Cổng ${session.connectorId}`}
                  </p>
                  <p className="text-sm text-gray-500">
                    User: {session.userId} • Bắt đầu: {formatDateTime(session.startTime)}
                    {showStation && ` • ${session.stationId}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusBadge(session.status)}
              </div>
            </div>
            
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Thời gian</p>
                <p className="font-medium">{formatDuration(session.duration)}</p>
              </div>
              <div>
                <p className="text-gray-500">Năng lượng</p>
                <p className="font-medium">{formatEnergy(session.energyConsumed)}</p>
              </div>
              <div>
                <p className="text-gray-500">Chi phí</p>
                <p className="font-medium text-green-600">{formatCurrency(session.estimatedCost)}</p>
              </div>
              <div>
                <p className="text-gray-500">Kết thúc</p>
                <p className="font-medium">{formatDateTime(session.stopTime)}</p>
              </div>
            </div>

            {session.reason && (
              <div className="mt-2">
                <span className="text-sm text-gray-500">Lý do dừng: </span>
                <span className="text-sm text-gray-700">{session.reason}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
};

export default ChargingSessionsList;
