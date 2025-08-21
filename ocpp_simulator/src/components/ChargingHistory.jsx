import React, { useState, useEffect } from 'react';
import './ChargingHistory.css';

const ChargingHistory = ({ connectorId, onSessionSelect }) => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);

  const loadSessionsFromStorage = React.useCallback(() => {
    try {
      const storageKey = `charging_sessions_${connectorId}`;
      const savedSessions = localStorage.getItem(storageKey);
      if (savedSessions) {
        const parsedSessions = JSON.parse(savedSessions);
        // Sort by end time, newest first
        parsedSessions.sort((a, b) => new Date(b.endTime) - new Date(a.endTime));
        setSessions(parsedSessions);
      }
    } catch (error) {
      console.error('Error loading sessions from storage:', error);
    }
  }, [connectorId]);

  useEffect(() => {
    // Load sessions from localStorage
    loadSessionsFromStorage();
  }, [loadSessionsFromStorage]);

  const saveSessionToStorage = (sessionData) => {
    try {
      const storageKey = `charging_sessions_${connectorId}`;
      const existingSessions = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      // Add new session
      existingSessions.unshift(sessionData);
      
      // Keep only last 50 sessions
      if (existingSessions.length > 50) {
        existingSessions.splice(50);
      }
      
      localStorage.setItem(storageKey, JSON.stringify(existingSessions));
      setSessions(existingSessions);
    } catch (error) {
      console.error('Error saving session to storage:', error);
    }
  };

  // Expose method to parent component
  React.useImperativeHandle(onSessionSelect, () => ({
    addSession: saveSessionToStorage,
    clearSessions: () => {
      const storageKey = `charging_sessions_${connectorId}`;
      localStorage.removeItem(storageKey);
      setSessions([]);
    }
  }));

  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      return new Date(timestamp).toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const formatDuration = (duration) => {
    if (!duration || duration <= 0) return '0s';
    
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = Math.floor(duration % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatEnergy = (wh) => {
    if (!wh || wh <= 0) return '0 Wh';
    if (wh >= 1000) {
      return `${(wh / 1000).toFixed(2)} kWh`;
    }
    return `${wh.toFixed(0)} Wh`;
  };

  const formatCost = (cost) => {
    if (!cost || cost <= 0) return '0 ₫';
    return `${cost.toLocaleString('vi-VN')} ₫`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'stopped': return '#f59e0b';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const handleSessionClick = (session) => {
    setSelectedSession(selectedSession?.id === session.id ? null : session);
  };

  const clearAllSessions = () => {
    if (window.confirm('Bạn có chắc muốn xóa tất cả lịch sử phiên sạc?')) {
      const storageKey = `charging_sessions_${connectorId}`;
      localStorage.removeItem(storageKey);
      setSessions([]);
      setSelectedSession(null);
    }
  };

  return (
    <div className="charging-history">
      <div className="history-header">
        <h3>Lịch sử phiên sạc - Cổng {connectorId}</h3>
        <div className="history-actions">
          <span className="session-count">{sessions.length} phiên</span>
          {sessions.length > 0 && (
            <button 
              className="clear-button"
              onClick={clearAllSessions}
              title="Xóa tất cả lịch sử"
            >
              🗑️ Xóa tất cả
            </button>
          )}
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="no-sessions">
          <p>Chưa có phiên sạc nào</p>
          <small>Các phiên sạc sẽ xuất hiện ở đây sau khi hoàn thành</small>
        </div>
      ) : (
        <div className="sessions-list">
          {sessions.map((session, index) => (
            <div key={session.id || index} className="session-item">
              <div 
                className="session-summary"
                onClick={() => handleSessionClick(session)}
              >
                <div className="session-main-info">
                  <div className="session-time">
                    <strong>{formatDateTime(session.endTime)}</strong>
                  </div>
                  <div className="session-stats">
                    <span className="stat-item">
                      ⏱️ {formatDuration(session.duration)}
                    </span>
                    <span className="stat-item">
                      ⚡ {formatEnergy(session.energyConsumed)}
                    </span>
                    <span className="stat-item">
                      💰 {formatCost(session.estimatedCost)}
                    </span>
                  </div>
                </div>
                <div className="session-status">
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(session.status) }}
                  >
                    {session.status === 'completed' ? 'Hoàn thành' : 
                     session.status === 'stopped' ? 'Đã dừng' : 
                     session.status === 'error' ? 'Lỗi' : session.status}
                  </span>
                  <span className="expand-icon">
                    {selectedSession?.id === session.id ? '▼' : '▶'}
                  </span>
                </div>
              </div>

              {selectedSession?.id === session.id && (
                <div className="session-details">
                  <div className="details-grid">
                    <div className="detail-item">
                      <label>Bắt đầu:</label>
                      <span>{formatDateTime(session.startTime)}</span>
                    </div>
                    <div className="detail-item">
                      <label>Kết thúc:</label>
                      <span>{formatDateTime(session.endTime)}</span>
                    </div>
                    <div className="detail-item">
                      <label>Transaction ID:</label>
                      <span>{session.transactionId || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Lý do dừng:</label>
                      <span>{session.reason || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Điện năng bắt đầu:</label>
                      <span>{formatEnergy(session.meterStart || 0)}</span>
                    </div>
                    <div className="detail-item">
                      <label>Điện năng kết thúc:</label>
                      <span>{formatEnergy(session.meterStop || 0)}</span>
                    </div>
                    <div className="detail-item">
                      <label>Công suất trung bình:</label>
                      <span>
                        {session.duration > 0 
                          ? `${((session.energyConsumed / session.duration) * 3.6).toFixed(2)} kW`
                          : '0 kW'
                        }
                      </span>
                    </div>
                    <div className="detail-item">
                      <label>Giá điện:</label>
                      <span>
                        {session.energyConsumed > 0 && session.estimatedCost > 0
                          ? `${(session.estimatedCost / (session.energyConsumed / 1000)).toFixed(0)} ₫/kWh`
                          : 'N/A'
                        }
                      </span>
                    </div>
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

export default ChargingHistory;
