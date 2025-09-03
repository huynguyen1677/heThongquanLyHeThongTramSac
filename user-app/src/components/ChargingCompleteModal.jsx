import React from "react";
import "../styles/charging-complete-modal.css";

function ChargingCompleteModal({ session, open, onClose }) {
  if (!open || !session) return null;

  return (
    <div className="charging-confirmation-dialog-overlay">
      <div className="charging-complete-modal">
        <div className="modal-header">
          <div className="success-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <h2>Hoàn thành sạc xe!</h2>
          <p className="modal-subtitle">Phiên sạc của bạn đã kết thúc thành công</p>
        </div>
        <div className="modal-content">
          <div className="session-summary">
            <div className="summary-item">
              <span className="summary-label">Trạm sạc:</span>
              <span className="summary-value">{session.station}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Thời gian sạc:</span>
              <span className="summary-value">{session.time}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Năng lượng đã sạc:</span>
              <span className="summary-value">{session.currentEnergyKwh?.toFixed(2)} kWh</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Tiến độ hoàn thành:</span>
              <span className="summary-value">{session.progress}%</span>
            </div>
            <div className="summary-item highlight">
              <span className="summary-label">Tổng chi phí:</span>
              <span className="summary-value">{session.session_cost?.toLocaleString('vi-VN')}₫</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Kết thúc lúc:</span>
              <span className="summary-value">{session.endTime} - {session.endDate}</span>
            </div>
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-primary" onClick={onClose}>
            <i className="fas fa-check"></i>
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChargingCompleteModal;