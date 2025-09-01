import React, { useEffect, useState } from 'react';
import '../styles/charging-dialog.css';

function ChargingConfirmationDialog({ confirmationRequest, onRespond }) {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    if (confirmationRequest) {
      // Delay to allow for smooth animation
      setTimeout(() => setIsVisible(true), 50);
    } else {
      setIsVisible(false);
    }
  }, [confirmationRequest]);
  
  if (!confirmationRequest) return null;

  const handleRespond = (response) => {
    setIsVisible(false);
    // Delay the actual response to allow for closing animation
    setTimeout(() => {
      onRespond(response);
    }, 200);
  };

  return (
    <div className={`charging-dialog-overlay ${isVisible ? 'visible' : ''}`}>
      <div className={`charging-dialog ${isVisible ? 'visible' : ''}`}>
        <div className="dialog-header">
          <div className="dialog-icon">
            ⚡
          </div>
          <h3 className="dialog-title">Yêu cầu xác nhận sạc</h3>
        </div>
        
        <div className="dialog-content">
          <div className="station-info">
            <div className="info-item">
              <span className="info-label">Trạm sạc:</span>
              <span className="info-value">{confirmationRequest.stationId}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Cổng sạc:</span>
              <span className="info-value">#{confirmationRequest.connectorId}</span>
            </div>
          </div>
          
          <p className="dialog-message">
            Trạm sạc muốn bắt đầu phiên sạc. Bạn có đồng ý tiếp tục không?
          </p>
          
          <div className="dialog-note">
            <span className="note-icon">💡</span>
            <span className="note-text">Vui lòng xác nhận trong vòng 30 giây</span>
          </div>
        </div>
        
        <div className="dialog-actions">
          <button
            onClick={() => handleRespond(false)}
            className="dialog-button button-secondary"
          >
            <span className="button-icon">✕</span>
            <span>Từ chối</span>
          </button>
          <button
            onClick={() => handleRespond(true)}
            className="dialog-button button-primary"
          >
            <span className="button-icon">✓</span>
            <span>Đồng ý</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChargingConfirmationDialog;