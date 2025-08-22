import React, { useState, useEffect } from 'react';
import { Zap, Clock, AlertTriangle, CheckCircle, XCircle, Play, Square, MapPin } from 'lucide-react';
import CSMSService from '../services/csmsService';
import RealtimeService from '../services/realtimeService';

const ChargingControl = ({ station, userId, onSessionUpdate }) => {
  const [selectedConnector, setSelectedConnector] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connectorStates, setConnectorStates] = useState({});

  useEffect(() => {
    if (!station) return;

    // Subscribe to real-time station updates
    const unsubscribe = RealtimeService.subscribeToStation(station.stationId, (updatedStation) => {
      if (updatedStation && updatedStation.connectors) {
        setConnectorStates(updatedStation.connectors);
      }
    });

    // Subscribe to charging sessions for this user
    const sessionUnsubscribe = RealtimeService.subscribeToUserSessions(userId, (sessions) => {
      // Find active session at this station
      const activeSession = sessions.find(session => 
        session.stationId === station.stationId && 
        (session.status === 'active' || session.status === 'charging')
      );
      setCurrentSession(activeSession);
    });

    return () => {
      unsubscribe();
      sessionUnsubscribe();
    };
  }, [station, userId]);

  const getConnectorStatus = (connectorId) => {
    const connector = connectorStates[connectorId] || station.connectors?.[connectorId];
    return connector?.status || 'Unknown';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Available':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'Charging':
        return <Zap className="text-blue-500" size={20} />;
      case 'Preparing':
      case 'Occupied':
        return <Clock className="text-yellow-500" size={20} />;
      case 'Faulted':
        return <AlertTriangle className="text-red-500" size={20} />;
      case 'Unavailable':
        return <XCircle className="text-gray-500" size={20} />;
      default:
        return <AlertTriangle className="text-gray-400" size={20} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Charging':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Preparing':
      case 'Occupied':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Faulted':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Unavailable':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const handleStartCharging = async () => {
    if (!selectedConnector || !userId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await CSMSService.startCharging({
        stationId: station.stationId,
        connectorId: selectedConnector,
        userId: userId,
        userType: 'driver'
      });

      if (result.success) {
        // Session will be updated via real-time subscription
        if (onSessionUpdate) {
          onSessionUpdate(result.sessionId);
        }
      } else {
        setError(result.message || 'Không thể bắt đầu sạc');
      }
    } catch (err) {
      setError('Lỗi kết nối. Vui lòng thử lại.');
      console.error('Start charging error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStopCharging = async () => {
    if (!currentSession) return;

    setLoading(true);
    setError(null);

    try {
      const result = await CSMSService.stopCharging({
        stationId: station.stationId,
        connectorId: currentSession.connectorId,
        sessionId: currentSession.sessionId,
        userId: userId
      });

      if (result.success) {
        setCurrentSession(null);
        setSelectedConnector(null);
        if (onSessionUpdate) {
          onSessionUpdate(null);
        }
      } else {
        setError(result.message || 'Không thể dừng sạc');
      }
    } catch (err) {
      setError('Lỗi kết nối. Vui lòng thử lại.');
      console.error('Stop charging error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!station) {
    return (
      <div className="charging-control-container">
        <div className="text-center text-gray-500 py-8">
          <MapPin size={48} className="mx-auto mb-4 text-gray-300" />
          <p>Vui lòng chọn một trạm sạc trên bản đồ</p>
        </div>
      </div>
    );
  }

  const connectors = station.connectors || {};
  const connectorList = Object.keys(connectors);

  if (connectorList.length === 0) {
    return (
      <div className="charging-control-container">
        <div className="text-center text-gray-500 py-8">
          <AlertTriangle size={48} className="mx-auto mb-4 text-gray-300" />
          <p>Trạm sạc này không có đầu sạc khả dụng</p>
        </div>
      </div>
    );
  }

  return (
    <div className="charging-control-container">
      {/* Station Info */}
      <div className="station-info mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {station.name || `Trạm ${station.stationId}`}
        </h3>
        {station.address && (
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <MapPin size={16} className="mr-2" />
            {station.address}
          </div>
        )}
      </div>

      {/* Current Session Status */}
      {currentSession && (
        <div className="current-session mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-blue-900">Phiên sạc hiện tại</h4>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              Đang sạc
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Đầu sạc:</span>
              <span className="ml-2 font-medium">{currentSession.connectorId}</span>
            </div>
            <div>
              <span className="text-gray-600">Bắt đầu:</span>
              <span className="ml-2 font-medium">
                {new Date(currentSession.startTime?.toDate()).toLocaleTimeString('vi-VN')}
              </span>
            </div>
            {currentSession.energyDelivered && (
              <>
                <div>
                  <span className="text-gray-600">Năng lượng:</span>
                  <span className="ml-2 font-medium">{currentSession.energyDelivered.toFixed(2)} kWh</span>
                </div>
                <div>
                  <span className="text-gray-600">Chi phí:</span>
                  <span className="ml-2 font-medium">
                    {(currentSession.cost || 0).toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="error-message mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle size={16} className="text-red-500 mr-2" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Connector Selection */}
      {!currentSession && (
        <div className="connector-selection mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Chọn đầu sạc</h4>
          <div className="grid gap-3">
            {connectorList.map(connectorId => {
              const status = getConnectorStatus(connectorId);
              const isAvailable = status === 'Available';
              const isSelected = selectedConnector === connectorId;
              
              return (
                <div
                  key={connectorId}
                  className={`connector-card p-3 border rounded-lg cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : isAvailable 
                        ? 'border-gray-200 hover:border-gray-300' 
                        : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                  }`}
                  onClick={() => isAvailable && setSelectedConnector(connectorId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="mr-3">
                        {getStatusIcon(status)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          Đầu sạc {connectorId}
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${getStatusColor(status)}`}>
                          {status}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle size={20} className="text-blue-500" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="action-buttons">
        {currentSession ? (
          <button
            onClick={handleStopCharging}
            disabled={loading}
            className="w-full flex items-center justify-center px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
          >
            {loading ? (
              <div className="loading mr-2"></div>
            ) : (
              <Square size={20} className="mr-2" />
            )}
            {loading ? 'Đang dừng...' : 'Dừng sạc'}
          </button>
        ) : (
          <button
            onClick={handleStartCharging}
            disabled={loading || !selectedConnector}
            className="w-full flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
          >
            {loading ? (
              <div className="loading mr-2"></div>
            ) : (
              <Play size={20} className="mr-2" />
            )}
            {loading ? 'Đang bắt đầu...' : 'Bắt đầu sạc'}
          </button>
        )}
      </div>

      {/* Info Note */}
      <div className="info-note mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-sm text-gray-600">
          💡 <strong>Lưu ý:</strong> Chỉ có thể bắt đầu sạc khi đầu sạc ở trạng thái "Available". 
          Phiên sạc sẽ được theo dõi theo thời gian thực.
        </p>
      </div>
    </div>
  );
};

export default ChargingControl;
