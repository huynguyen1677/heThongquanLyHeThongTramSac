import React from 'react';
import './ErrorModal.css';

const ErrorModal = ({ 
  isOpen, 
  onClose, 
  title = "Lỗi", 
  message, 
  type = "error", // error, warning, info, insufficient-balance
  onRetry = null,
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'insufficient-balance':
        return '💰';
      case 'blocked':
        return '🚫';
      case 'invalid':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '❌';
    }
  };

  const getButtons = () => {
    if (type === 'insufficient-balance') {
      return (
        <div className="modal-buttons">
          <button className="btn btn-secondary" onClick={onClose}>
            Đóng
          </button>
        </div>
      );
    }

    if (onRetry) {
      return (
        <div className="modal-buttons">
          <button className="btn btn-primary" onClick={onRetry}>
            🔄 Thử lại
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Đóng
          </button>
        </div>
      );
    }

    return (
      <div className="modal-buttons">
        <button className="btn btn-primary" onClick={onClose}>
          Đóng
        </button>
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-icon">{getIcon()}</span>
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <p className="modal-message">{message}</p>
        </div>
        
        <div className="modal-footer">
          {getButtons()}
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;
