import React from "react";
import "../styles/charging-complete-modal.css";

function ChargingCompleteModal({ session, open, onClose }) {
  if (!open || !session) return null;

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <div className="charging-confirmation-dialog-overlay" onClick={onClose}>
      <div className="charging-complete-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header với animation */}
        <div className="modal-header">
          <div className="success-icon-container">
            <div className="success-icon">
              <div className="check-mark">
                <div className="check-line check-line-1"></div>
                <div className="check-line check-line-2"></div>
              </div>
            </div>
            <div className="success-ripple"></div>
          </div>
          <h2>Sạc xe hoàn tất!</h2>
          <p className="modal-subtitle">Cảm ơn bạn đã sử dụng dịch vụ EV Station</p>
        </div>

        {/* Session info */}
        <div className="session-info">
          <div className="station-badge">
            <i className="fas fa-charging-station"></i>
            <span>{session.station || 'CP_BinhDinh'}</span>
          </div>
          <div className="connector-info">
            <span>Cổng {session.connectorId || 1}</span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="modal-content">
          <div className="stats-grid">
            <div className="stat-card energy">
              <div className="stat-icon">
                <i className="fas fa-bolt"></i>
              </div>
              <div className="stat-content">
                <span className="stat-value">{session.currentEnergyKwh|| '0.0'}</span>
                <span className="stat-unit">kWh</span>
                <span className="stat-label">Năng lượng</span>
              </div>
            </div>

            <div className="stat-card time">
              <div className="stat-icon">
                <i className="fas fa-clock"></i>
              </div>
              <div className="stat-content">
                <span className="stat-value">{session.duration ? formatDuration(session.duration) : session.time || '0h 0m'}</span>
                <span className="stat-label">Thời gian</span>
              </div>
            </div>

            <div className="stat-card progress1">
              <div className="stat-icon">
                <i className="fas fa-battery-three-quarters"></i>
              </div>
              <div className="stat-content">
                <span className="stat-value">{session.progress || 100}</span>
                <span className="stat-unit">%</span>
                <span className="stat-label">Hoàn thành</span>
              </div>
            </div>
          </div>

          {/* Cost highlight */}
          <div className="cost-summary">
            <div className="cost-icon">
              <i className="fas fa-money-bill-wave"></i>
            </div>
            <div className="cost-content">
              <span className="cost-label">Tổng chi phí</span>
              <span className="cost-value">{formatCurrency(session.estimatedCost || 0)}</span>
            </div>
            <div className="cost-status">
              <i className="fas fa-check-circle"></i>
              <span>Đã thanh toán</span>
            </div>
          </div>

          {/* Session details */}
          <div className="session-details">
            <h3>Chi tiết phiên sạc</h3>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Bắt đầu</span>
                <span className="detail-value">{session.startTime || '--:--'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Kết thúc</span>
                <span className="detail-value">{session.endTime || '--:--'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Công suất trung bình</span>
                <span className="detail-value">{session.avgPower || '7.2'} kW</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">ID phiên</span>
                <span className="detail-value">#{session.transactionId || '97947723'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="modal-actions">
          <button className="btn-secondary1" onClick={() => window.print()}>
            <i className="fas fa-download"></i>
            Tải hóa đơn
          </button>
          <button className="btn-primary" onClick={onClose}>
            <i className="fas fa-check"></i>
            Hoàn tất
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChargingCompleteModal;