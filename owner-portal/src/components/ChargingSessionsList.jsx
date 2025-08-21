import React, { useState, useEffect } from 'react';
import CSMSApiService from '../services/csmsApi';

const ChargingSessionsList = ({ ownerId }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSessions = async () => {
      if (!ownerId) return;

      try {
        setLoading(true);
        
        // Use CSMS API to fetch charging sessions for this owner
        const sessionsData = await CSMSApiService.getChargingSessionsByOwner(ownerId);
        
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
    const badges = {
      active: { color: 'blue', text: 'Đang sạc' },
      completed: { color: 'green', text: 'Hoàn thành' },
      cancelled: { color: 'red', text: 'Đã hủy' },
      error: { color: 'red', text: 'Lỗi' }
    };
    
    const badge = badges[status] || { color: 'gray', text: status };
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium bg-${badge.color}-100 text-${badge.color}-800`}>
        {badge.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Đang tải dữ liệu phiên sạc...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Lịch sử phiên sạc</h2>
        <div className="text-sm text-gray-500">
          Tổng cộng: {sessions.length} phiên
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Chưa có phiên sạc nào</p>
          <p className="text-gray-400 text-sm mt-2">Các phiên sạc sẽ xuất hiện ở đây khi có người dùng sạc xe</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {sessions.map((session) => (
              <li key={session.id} className="px-6 py-4">
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
                            {session.stationName || session.stationId}
                          </p>
                          <p className="text-sm text-gray-500">
                            User: {session.userId} • Cổng {session.connectorId}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(session.status)}
                      </div>
                    </div>
                    
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Bắt đầu</p>
                        <p className="font-medium">{formatDateTime(session.startTime)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Kết thúc</p>
                        <p className="font-medium">{formatDateTime(session.stopTime)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Thời gian</p>
                        <p className="font-medium">{formatDuration(session.duration)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Năng lượng</p>
                        <p className="font-medium">{formatEnergy(session.energyConsumed)}</p>
                      </div>
                    </div>

                    {session.estimatedCost && (
                      <div className="mt-2">
                        <span className="text-sm text-gray-500">Chi phí ước tính: </span>
                        <span className="text-sm font-semibold text-green-600">
                          {formatCurrency(session.estimatedCost)}
                        </span>
                      </div>
                    )}

                    {session.stationInfo?.address && (
                      <div className="mt-2">
                        <span className="text-sm text-gray-500">Địa chỉ: </span>
                        <span className="text-sm text-gray-700">{session.stationInfo.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ChargingSessionsList;
