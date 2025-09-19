import React from 'react';
import './SessionSummaryModal.css';

const SessionSummaryModal = ({ 
  isOpen, 
  onClose, 
  sessionData, 
  stationInfo 
}) => {
  if (!isOpen || !sessionData) return null;

  const formatDuration = (seconds) => {
    if (!seconds) return '00:00:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp || timestamp === 0) return 'N/A';
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error, 'timestamp:', timestamp);
      return 'N/A';
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0 ₫';
    return `${amount.toLocaleString('vi-VN')} ₫`;
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: '#10b981',
      cancelled: '#ef4444',
      error: '#f59e0b'
    };
    return colors[status] || '#6b7280';
  };

  const getStatusText = (status) => {
    const texts = {
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy',
      error: 'Lỗi'
    };
    return texts[status] || status;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📊 Tóm tắt phiên sạc</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Session Status */}
          <div className="session-status">
            <div 
              className="status-badge large"
              style={{ backgroundColor: getStatusColor(sessionData.status) }}
            >
              {getStatusText(sessionData.status)}
            </div>
          </div>

          {/* Session Details */}
          <div className="session-details">
            <div className="detail-group">
              <h3>📋 Thông tin phiên sạc</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>ID Giao dịch:</label>
                  <span className="highlight">{sessionData.transactionId}</span>
                </div>
                <div className="detail-item">
                  <label>Cổng sạc:</label>
                  <span>Connector {sessionData.connectorId}</span>
                </div>
                <div className="detail-item">
                  <label>User ID:</label>
                  <span>{sessionData.userId || 'Unknown'}</span>
                </div>
              </div>
            </div>

            <div className="detail-group">
              <h3>⏰ Thời gian</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Bắt đầu:</label>
                  <span>{formatDateTime(sessionData.startTime)}</span>
                </div>
                <div className="detail-item">
                  <label>Kết thúc:</label>
                  <span>{formatDateTime(sessionData.stopTime)}</span>
                </div>
                <div className="detail-item">
                  <label>Thời gian sạc:</label>
                  <span className="highlight">{formatDuration(sessionData.duration)}</span>
                </div>
              </div>
            </div>

            <div className="detail-group">
              <h3>⚡ Năng lượng & Chi phí</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Năng lượng tiêu thụ:</label>
                  <span className="highlight energy">
                    {((sessionData.energyConsumed || 0) / 1000).toFixed(3)} kWh
                  </span>
                </div>
                <div className="detail-item">
                  <label>Đồng hồ bắt đầu:</label>
                  <span>{((sessionData.meterStart || 0) / 1000).toFixed(3)} kWh</span>
                </div>
                <div className="detail-item">
                  <label>Đồng hồ kết thúc:</label>
                  <span>{((sessionData.meterStop || 0) / 1000).toFixed(3)} kWh</span>
                </div>
                <div className="detail-item">
                  <label>Giá điện:</label>
                  <span>{(sessionData.pricePerKwh || 0).toLocaleString('vi-VN')} ₫/kWh</span>
                </div>
                <div className="detail-item total-cost">
                  <label>Tổng chi phí:</label>
                  <span className="highlight cost">
                    {formatCurrency(sessionData.estimatedCost)}
                  </span>
                </div>
              </div>
            </div>

            {stationInfo && (
              <div className="detail-group">
                <h3>🏢 Thông tin trạm</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Tên trạm:</label>
                    <span>{stationInfo.name || stationInfo.id}</span>
                  </div>
                  {stationInfo.address && (
                    <div className="detail-item">
                      <label>Địa chỉ:</label>
                      <span>{stationInfo.address}</span>
                    </div>
                  )}
                  {stationInfo.owner && (
                    <div className="detail-item">
                      <label>Chủ sở hữu:</label>
                      <span>{stationInfo.owner}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {sessionData.reason && (
              <div className="detail-group">
                <h3>ℹ️ Lý do kết thúc</h3>
                <div className="reason-text">
                  {sessionData.reason}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            Đóng
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => {
              // Export session data to JSON for debugging
              const dataStr = JSON.stringify(sessionData, null, 2);
              const dataBlob = new Blob([dataStr], {type: 'application/json'});
              const url = URL.createObjectURL(dataBlob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `session_${sessionData.transactionId}_${new Date().toISOString().slice(0,10)}.json`;
              link.click();
              URL.revokeObjectURL(url);
            }}
          >
            📥 Tải xuống
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionSummaryModal;
