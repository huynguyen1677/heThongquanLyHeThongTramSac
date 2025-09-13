import React from 'react';

// CSS Styles cho animation
const cssStyles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const ToastNotification = ({ 
  message, 
  type = 'error', 
  onClose, 
  showCloseButton = true,
  children 
}) => {
  const getTypeStyles = () => {
    switch (type) {
      case 'error':
        return {
          backgroundColor: '#fef2f2',
          borderColor: '#fecaca',
          color: '#dc2626',
          icon: '❌',
          title: 'LỖI'
        };
      case 'warning':
        return {
          backgroundColor: '#fefbf2',
          borderColor: '#fed7aa',
          color: '#ea580c',
          icon: '⚠️',
          title: 'CẢNH BÁO'
        };
      case 'success':
        return {
          backgroundColor: '#f0fdf4',
          borderColor: '#bbf7d0',
          color: '#16a34a',
          icon: '✅',
          title: 'THÀNH CÔNG'
        };
      case 'info':
        return {
          backgroundColor: '#eff6ff',
          borderColor: '#bfdbfe',
          color: '#2563eb',
          icon: 'ℹ️',
          title: 'THÔNG TIN'
        };
      case 'access-denied':
        return {
          backgroundColor: '#fef2f2',
          borderColor: '#fecaca',
          color: '#dc2626',
          icon: '🚫',
          title: 'TRUY CẬP BỊ TỪ CHỐI'
        };
      case 'account-locked':
        return {
          backgroundColor: '#fefbf2',
          borderColor: '#fed7aa',
          color: '#ea580c',
          icon: '🔒',
          title: 'TÀI KHOẢN BỊ KHÓA'
        };
      default:
        return {
          backgroundColor: '#f9fafb',
          borderColor: '#d1d5db',
          color: '#374151',
          icon: '📢',
          title: 'THÔNG BÁO'
        };
    }
  };

  const typeStyles = getTypeStyles();

  return (
    <>
      <style>{cssStyles}</style>
      <div
        style={{
          marginBottom: '1.5rem',
          padding: '1rem',
          borderRadius: '0.5rem',
          border: '1px solid',
          animation: 'fadeIn 0.3s ease-in',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          backgroundColor: typeStyles.backgroundColor,
          borderColor: typeStyles.borderColor,
          color: typeStyles.color
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <div style={{ 
            fontSize: '1.25rem', 
            flexShrink: 0, 
            marginTop: '0.125rem' 
          }}>
            {typeStyles.icon}
          </div>
          
          <div style={{ flex: 1 }}>
            <h4 style={{ 
              margin: '0 0 0.5rem 0', 
              fontSize: '0.875rem', 
              fontWeight: '600' 
            }}>
              {typeStyles.title}
            </h4>
            
            <p style={{ 
              margin: '0 0 0.75rem 0', 
              fontSize: '0.8rem', 
              lineHeight: '1.4' 
            }}>
              {message}
            </p>
            
            {children && (
              <div style={{ marginBottom: '0.75rem' }}>
                {children}
              </div>
            )}
            
            {showCloseButton && onClose && (
              <button
                type="button"
                onClick={onClose}
                style={{
                  fontSize: '0.75rem',
                  color: 'inherit',
                  background: 'none',
                  border: 'none',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: 0,
                  opacity: 0.7,
                  transition: 'opacity 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.opacity = 1}
                onMouseLeave={(e) => e.target.style.opacity = 0.7}
              >
                ✕ Đóng thông báo
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ToastNotification;