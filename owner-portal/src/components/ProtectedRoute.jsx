import React from 'react';
import { Navigate } from 'react-router-dom';
import AuthGuard from '../utils/authGuard';

const ProtectedRoute = ({ children, user, onAccessDenied }) => {
  // Nếu chưa đăng nhập, redirect về login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Kiểm tra quyền truy cập
  const { allowed, reason } = AuthGuard.checkOwnerAccess(user);
  
  if (!allowed) {
    // Hiển thị trang lỗi truy cập
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
        padding: '2rem'
      }}>
        <div style={{
          background: 'white',
          padding: '3rem',
          borderRadius: '1rem',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
          maxWidth: '500px',
          width: '100%'
        }}>
          <div style={{
            fontSize: '4rem',
            marginBottom: '1rem'
          }}>🚫</div>
          
          <h1 style={{
            color: '#dc2626',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            marginBottom: '1rem'
          }}>
            Truy Cập Bị Từ Chối
          </h1>
          
          <p style={{
            color: '#6b7280',
            marginBottom: '2rem',
            lineHeight: '1.6'
          }}>
            {reason}
          </p>

          {user.role && user.role !== 'owner' && (
            <div style={{
              background: '#f3f4f6',
              padding: '1rem',
              borderRadius: '0.5rem',
              marginBottom: '2rem',
              textAlign: 'left'
            }}>
              <h3 style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                marginBottom: '0.5rem',
                color: '#374151'
              }}>
                🔄 Portal phù hợp với bạn:
              </h3>
              {(() => {
                const redirectInfo = AuthGuard.getRedirectInfo(user.role);
                return (
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#6b7280'
                  }}>
                    <strong>{redirectInfo.name}</strong>
                    <br />
                    {redirectInfo.description}
                  </div>
                );
              })()}
            </div>
          )}

          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center'
          }}>
            <button
              onClick={() => window.history.back()}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              ← Quay Lại
            </button>
            
            <button
              onClick={() => window.location.href = '/login'}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              🔐 Đăng Nhập Lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Nếu có quyền truy cập, render children
  return children;
};

export default ProtectedRoute;