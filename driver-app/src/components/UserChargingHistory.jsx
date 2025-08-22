import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Zap, Calendar, DollarSign, Filter } from 'lucide-react';
import RealtimeService from '../services/realtimeService';

const UserChargingHistory = ({ userId }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, completed
  const [sortBy, setSortBy] = useState('startTime'); // startTime, duration, cost

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = RealtimeService.subscribeToUserSessions(userId, (userSessions) => {
      setSessions(userSessions.sort((a, b) => {
        const timeA = a.startTime?.toDate() || new Date(0);
        const timeB = b.startTime?.toDate() || new Date(0);
        return timeB - timeA; // Newest first
      }));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { text: 'Đang sạc', class: 'bg-blue-100 text-blue-800 border-blue-200' },
      charging: { text: 'Đang sạc', class: 'bg-blue-100 text-blue-800 border-blue-200' },
      completed: { text: 'Hoàn thành', class: 'bg-green-100 text-green-800 border-green-200' },
      stopped: { text: 'Đã dừng', class: 'bg-gray-100 text-gray-800 border-gray-200' },
      failed: { text: 'Thất bại', class: 'bg-red-100 text-red-800 border-red-200' }
    };

    const config = statusConfig[status] || statusConfig.stopped;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${config.class}`}>
        {config.text}
      </span>
    );
  };

  const formatDuration = (startTime, endTime) => {
    if (!startTime) return '-';
    
    const start = startTime.toDate();
    const end = endTime ? endTime.toDate() : new Date();
    const diffMs = end - start;
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return '-';
    
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const filteredSessions = sessions.filter(session => {
    if (filter === 'all') return true;
    if (filter === 'active') return session.status === 'active' || session.status === 'charging';
    if (filter === 'completed') return session.status === 'completed';
    return true;
  });

  const sortedSessions = [...filteredSessions].sort((a, b) => {
    switch (sortBy) {
      case 'duration':
        const durationA = a.endTime && a.startTime ? 
          a.endTime.toDate() - a.startTime.toDate() : 0;
        const durationB = b.endTime && b.startTime ? 
          b.endTime.toDate() - b.startTime.toDate() : 0;
        return durationB - durationA;
      case 'cost':
        return (b.cost || 0) - (a.cost || 0);
      default: // startTime
        const timeA = a.startTime?.toDate() || new Date(0);
        const timeB = b.startTime?.toDate() || new Date(0);
        return timeB - timeA;
    }
  });

  if (loading) {
    return (
      <div className="user-charging-history">
        <div className="flex items-center justify-center py-8">
          <div className="loading mr-2"></div>
          <span>Đang tải lịch sử sạc...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="user-charging-history">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Lịch sử sạc của tôi</h3>
        <div className="flex items-center gap-4">
          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả</option>
            <option value="active">Đang sạc</option>
            <option value="completed">Hoàn thành</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="startTime">Thời gian</option>
            <option value="duration">Thời lượng</option>
            <option value="cost">Chi phí</option>
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      {sessions.length > 0 && (
        <div className="stats-grid grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="stat-card p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <Zap className="text-blue-500 mr-3" size={24} />
              <div>
                <div className="text-sm text-blue-600">Tổng phiên sạc</div>
                <div className="text-xl font-semibold text-blue-900">{sessions.length}</div>
              </div>
            </div>
          </div>

          <div className="stat-card p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <Zap className="text-green-500 mr-3" size={24} />
              <div>
                <div className="text-sm text-green-600">Tổng năng lượng</div>
                <div className="text-xl font-semibold text-green-900">
                  {sessions.reduce((sum, s) => sum + (s.energyDelivered || 0), 0).toFixed(1)} kWh
                </div>
              </div>
            </div>
          </div>

          <div className="stat-card p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center">
              <DollarSign className="text-purple-500 mr-3" size={24} />
              <div>
                <div className="text-sm text-purple-600">Tổng chi phí</div>
                <div className="text-xl font-semibold text-purple-900">
                  {sessions.reduce((sum, s) => sum + (s.cost || 0), 0).toLocaleString('vi-VN')} VNĐ
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sessions List */}
      {sortedSessions.length === 0 ? (
        <div className="text-center py-8">
          <Zap size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">
            {filter === 'all' ? 'Chưa có phiên sạc nào' : 'Không có phiên sạc nào phù hợp với bộ lọc'}
          </p>
        </div>
      ) : (
        <div className="sessions-list space-y-4">
          {sortedSessions.map((session) => (
            <div
              key={session.sessionId}
              className="session-card p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <Zap className="text-blue-500 mr-3" size={20} />
                  <div>
                    <div className="font-medium text-gray-900">
                      {session.stationName || `Trạm ${session.stationId}`}
                    </div>
                    <div className="text-sm text-gray-600">
                      Đầu sạc {session.connectorId}
                    </div>
                  </div>
                </div>
                {getStatusBadge(session.status)}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center">
                  <Calendar size={14} className="text-gray-400 mr-2" />
                  <div>
                    <div className="text-gray-600">Bắt đầu</div>
                    <div className="font-medium">{formatDateTime(session.startTime)}</div>
                  </div>
                </div>

                <div className="flex items-center">
                  <Clock size={14} className="text-gray-400 mr-2" />
                  <div>
                    <div className="text-gray-600">Thời lượng</div>
                    <div className="font-medium">
                      {formatDuration(session.startTime, session.endTime)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <Zap size={14} className="text-gray-400 mr-2" />
                  <div>
                    <div className="text-gray-600">Năng lượng</div>
                    <div className="font-medium">
                      {session.energyDelivered ? `${session.energyDelivered.toFixed(2)} kWh` : '-'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <DollarSign size={14} className="text-gray-400 mr-2" />
                  <div>
                    <div className="text-gray-600">Chi phí</div>
                    <div className="font-medium">
                      {session.cost ? `${session.cost.toLocaleString('vi-VN')} VNĐ` : '-'}
                    </div>
                  </div>
                </div>
              </div>

              {session.stationAddress && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin size={14} className="mr-2" />
                    {session.stationAddress}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserChargingHistory;
