import React, { useState, useEffect } from 'react';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import './ChargingSessionsList.css'; 

const ChargingSessionsList = ({ ownerId }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
    const [viewMode, setViewMode] = React.useState('list');
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10; // 'list', 'grid', 'table'
  const [selectedStation, setSelectedStation] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('startTime');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchSessions = async () => {
      if (!ownerId) return;

      try {
        setLoading(true);
        
        const sessionsRef = collection(db, 'chargingSessions');
        const q = query(
          sessionsRef,
          where('ownerId', '==', ownerId),
          limit(200)
        );
        
        const querySnapshot = await getDocs(q);
        const sessionsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setSessions(sessionsData);
      } catch (err) {
        console.error('Error fetching charging sessions:', err);
        setError('Không thể tải dữ liệu phiên sạc');
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [ownerId]);

  // Get unique stations and statuses for filters
  const stations = React.useMemo(() => {
    const stationSet = new Set(sessions.map(s => s.stationId).filter(Boolean));
    return Array.from(stationSet);
  }, [sessions]);

  const statuses = React.useMemo(() => {
    const statusSet = new Set(sessions.map(s => s.status).filter(Boolean));
    return Array.from(statusSet);
  }, [sessions]);

  // Filter and sort sessions
  const filteredAndSortedSessions = React.useMemo(() => {
    let filtered = sessions.filter(session => {
      const matchesStation = selectedStation === 'all' || session.stationId === selectedStation;
      const matchesStatus = statusFilter === 'all' || session.status === statusFilter;
      const matchesSearch = !searchTerm || 
        session.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.stationId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.id?.toString().includes(searchTerm);
      
      return matchesStation && matchesStatus && matchesSearch;
    });

    // Sort sessions
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'startTime' || sortBy === 'stopTime') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [sessions, selectedStation, statusFilter, searchTerm, sortBy, sortOrder]);

  // Statistics
  const stats = React.useMemo(() => {
    const totalSessions = filteredAndSortedSessions.length;
    const completedSessions = filteredAndSortedSessions.filter(s => 
      s.status === 'Completed' || s.status === 'completed'
    ).length;
    const totalEnergy = filteredAndSortedSessions.reduce((sum, s) => 
      sum + (s.energyConsumed || 0), 0
    );
    const totalRevenue = filteredAndSortedSessions.reduce((sum, s) => 
      sum + (s.estimatedCost || 0), 0
    );

    return { totalSessions, completedSessions, totalEnergy, totalRevenue };
  }, [filteredAndSortedSessions]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedSessions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentSessions = filteredAndSortedSessions.slice(startIndex, startIndex + itemsPerPage);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedStation, statusFilter, searchTerm, sortBy, sortOrder]);

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatEnergy = (wh) => {
    if (!wh) return '0 kWh';
    return `${(wh / 1000).toFixed(2)} kWh`;
  };

  const formatSessionId = (id) => {
    if (!id) return 'N/A';
    const idStr = String(id);
    return idStr.length > 8 ? idStr.slice(-8) : idStr;
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0₫';
    return `${amount.toLocaleString('vi-VN')}₫`;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'finished':
        return 'status-success';
      case 'charging':
      case 'active':
        return 'status-charging';
      case 'failed':
      case 'error':
      case 'faulted':
        return 'status-error';
      case 'stopped':
      case 'suspended':
      case 'suspendedEV':
      case 'suspendedEVSE':
        return 'status-warning';
      default:
        return 'status-default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'finished':
        return '✅';
      case 'charging':
      case 'active':
        return '🔋';
      case 'failed':
      case 'error':
      case 'faulted':
        return '❌';
      case 'stopped':
      case 'suspended':
      case 'suspendedEV':
      case 'suspendedEVSE':
        return '⏸️';
      case 'preparing':
        return '🔄';
      default:
        return '⚪';
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Completed': { bg: 'bg-green-100', text: 'text-green-800', label: 'Hoàn thành' },
      'completed': { bg: 'bg-green-100', text: 'text-green-800', label: 'Hoàn thành' },
      'Charging': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Đang sạc' },
      'Preparing': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Chuẩn bị' },
      'SuspendedEV': { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Tạm dừng' },
      'SuspendedEVSE': { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Trạm dừng' },
      'Finishing': { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Kết thúc' },
      'Faulted': { bg: 'bg-red-100', text: 'text-red-800', label: 'Lỗi' },
      'Unavailable': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Không sẵn sàng' }
    };
    
    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="loading" style={{ width: '40px', height: '40px' }}></div>
        <p style={{ marginTop: '1rem', color: '#6b7280' }}>Đang tải dữ liệu phiên sạc...</p>
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
          onClick={() => window.location.reload()}
          className="btn btn-primary"
          style={{ marginTop: '1rem' }}
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
          ⚡ Lịch sử phiên sạc
        </h2>
        <p style={{ color: '#6b7280' }}>
          Quản lý và theo dõi tất cả phiên sạc của bạn
        </p>
        
        {/* Statistics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>{stats.totalSessions}</div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Tổng phiên</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>{stats.completedSessions}</div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Hoàn thành</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>{formatEnergy(stats.totalEnergy)}</div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Tổng năng lượng</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2563eb' }}>{formatCurrency(stats.totalRevenue)}</div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Tổng doanh thu</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-body">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
            {/* Search */}
            <div style={{ position: 'relative', minWidth: '300px', flex: '1' }}>
              <input
                type="text"
                placeholder="Tìm kiếm theo User ID, Station ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
              <div style={{ 
                position: 'absolute', 
                left: '0.75rem', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: '#6b7280'
              }}>
                🔍
              </div>
            </div>

            {/* Filters */}
            <select
              value={selectedStation}
              onChange={(e) => setSelectedStation(e.target.value)}
            >
              <option value="all">🏢 Tất cả trạm</option>
              {stations.map(stationId => (
                <option key={stationId} value={stationId}>{stationId}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">📊 Tất cả trạng thái</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>

            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
            >
              <option value="startTime-desc">🕐 Mới nhất</option>
              <option value="startTime-asc">🕐 Cũ nhất</option>
              <option value="energyConsumed-desc">⚡ Năng lượng cao → thấp</option>
              <option value="energyConsumed-asc">⚡ Năng lượng thấp → cao</option>
              <option value="estimatedCost-desc">💰 Chi phí cao → thấp</option>
              <option value="estimatedCost-asc">💰 Chi phí thấp → cao</option>
            </select>

            {/* View Mode Toggle */}
            <div style={{ display: 'flex', border: '1px solid #d1d5db', borderRadius: '6px', overflow: 'hidden' }}>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  padding: '0.5rem 0.75rem',
                  backgroundColor: viewMode === 'list' ? '#3b82f6' : 'white',
                  color: viewMode === 'list' ? 'white' : '#374151',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                📋
              </button>
              <button
                onClick={() => setViewMode('grid')}
                style={{
                  padding: '0.5rem 0.75rem',
                  backgroundColor: viewMode === 'grid' ? '#3b82f6' : 'white',
                  color: viewMode === 'grid' ? 'white' : '#374151',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                �
              </button>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="btn btn-outline"
            >
              🔄 Làm mới
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {filteredAndSortedSessions.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔌</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
            Không tìm thấy phiên sạc nào
          </h3>
          <p style={{ color: '#6b7280' }}>
            {sessions.length === 0 
              ? 'Chưa có phiên sạc nào. Các phiên sạc sẽ xuất hiện ở đây khi có người dùng sạc xe.'
              : 'Thử thay đổi bộ lọc để xem thêm kết quả.'
            }
          </p>
        </div>
      ) : (
        <>
          {viewMode === 'list' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {currentSessions.map((session) => (
                <div key={session.id} className="card">
                  <div className="card-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span className={`status-badge ${getStatusColor(session.status)}`}>
                          {getStatusIcon(session.status)} {session.status}
                        </span>
                        <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>
                          Phiên #{formatSessionId(session.id)}
                        </div>
                      </div>
                      <div style={{ fontSize: '1.125rem', fontWeight: '700', color: '#2563eb' }}>
                        {formatCurrency(session.estimatedCost)}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                      <div>
                        <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>👤 Người dùng</span>
                        <div style={{ fontWeight: '500' }}>{session.userId}</div>
                      </div>
                      <div>
                        <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>🏢 Trạm</span>
                        <div style={{ fontWeight: '500' }}>{session.stationId}</div>
                      </div>
                      <div>
                        <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>🔌 Cổng sạc</span>
                        <div style={{ fontWeight: '500' }}>{session.connectorId}</div>
                      </div>
                      <div>
                        <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>⚡ Năng lượng</span>
                        <div style={{ fontWeight: '700', color: '#059669' }}>{formatEnergy(session.energyConsumed)}</div>
                      </div>
                    </div>

                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#6b7280' }}>
                        <div>
                          <span style={{ fontWeight: '500' }}>🕐 Bắt đầu:</span> {formatDateTime(session.startTime)}
                        </div>
                        {session.endTime && (
                          <div>
                            <span style={{ fontWeight: '500' }}>🏁 Kết thúc:</span> {formatDateTime(session.endTime)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {viewMode === 'grid' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {currentSessions.map((session) => (
                <div key={session.id} className="card">
                  <div className="card-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <span className={`status-badge ${getStatusColor(session.status)}`}>
                        {getStatusIcon(session.status)} {session.status}
                      </span>
                      <div style={{ fontSize: '1.125rem', fontWeight: '700', color: '#2563eb' }}>
                        {formatCurrency(session.estimatedCost)}
                      </div>
                    </div>

                    <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                      <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>
                        Phiên #{formatSessionId(session.id)}
                      </div>
                      <div style={{ 
                        display: 'inline-flex',
                        backgroundColor: '#ecfdf5',
                        color: '#065f46',
                        padding: '0.75rem 1rem',
                        borderRadius: '50%',
                        minWidth: '80px',
                        minHeight: '80px',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <div style={{ fontWeight: '700', fontSize: '1.25rem' }}>{formatEnergy(session.energyConsumed)}</div>
                        <div style={{ fontSize: '0.75rem' }}>Năng lượng</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>👤 Người dùng</span>
                        <span style={{ fontWeight: '500' }}>{session.userId}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>🏢 Trạm</span>
                        <span style={{ fontWeight: '500' }}>{session.stationId}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>🔌 Cổng sạc</span>
                        <span style={{ fontWeight: '500' }}>{session.connectorId}</span>
                      </div>
                    </div>

                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb', textAlign: 'center', fontSize: '0.875rem', color: '#6b7280' }}>
                      <div>🕐 {formatDateTime(session.startTime)}</div>
                      {session.endTime && (
                        <div>🏁 {formatDateTime(session.endTime)}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          gap: '0.5rem',
          marginTop: '2rem'
        }}>
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: currentPage === 1 ? '#f3f4f6' : '#3b82f6',
              color: currentPage === 1 ? '#9ca3af' : 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            ← Trước
          </button>
          
          <span style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', color: '#6b7280' }}>
            Trang {currentPage} / {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: currentPage === totalPages ? '#f3f4f6' : '#3b82f6',
              color: currentPage === totalPages ? '#9ca3af' : 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            Sau →
          </button>
        </div>
      )}
    </div>
  );
};

export default ChargingSessionsList;