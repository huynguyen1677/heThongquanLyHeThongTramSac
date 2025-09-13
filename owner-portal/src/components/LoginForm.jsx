import { useState } from 'react';
import { Mail, Key, LogIn } from 'lucide-react';
import AuthService from '../services/auth';
import ToastNotification from './ToastNotification';

const LoginForm = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorType, setErrorType] = useState('default'); // 'default', 'access-denied', 'account-locked'

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); // Reset error
    
    if (!email.trim()) {
      setError('Vui lòng nhập Email!');
      setErrorType('default');
      return;
    }

    if (!password.trim()) {
      setError('Vui lòng nhập mật khẩu!');
      setErrorType('default');
      return;
    }

    setIsLoading(true);
    try {
      const userData = await AuthService.signIn(email, password);
      await onLogin(userData);
    } catch (error) {
      let errorMessage = error.message || 'Đăng nhập thất bại';
      
      // Phân loại lỗi để hiển thị UI phù hợp
      if (errorMessage.includes('không có quyền truy cập')) {
        setErrorType('access-denied');
        setError(errorMessage);
      } else if (errorMessage.includes('tạm khóa')) {
        setErrorType('account-locked');
        setError(errorMessage);
      } else {
        setErrorType('default');
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .loading-dots {
          animation: pulse 1.5s ease-in-out infinite;
        }
        .error-message {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .card {
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          backdrop-filter: blur(16px);
          background: rgba(255, 255, 255, 0.95);
        }
        .form-input:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
      `}</style>
      
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '1rem'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <div className="card-header text-center">
          <h1 className="card-title" style={{ color: '#3b82f6', marginBottom: '0.5rem' }}>
            🏢 Owner Portal
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            Quản lý hệ thống trạm sạc của bạn
          </p>
        </div>
        
        <div className="card-body">
          {/* Error Message Display */}
          {error && (
            <ToastNotification
              message={error}
              type={errorType}
              onClose={() => setError(null)}
            >
              {errorType === 'access-denied' && (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.5)',
                  padding: '0.75rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                  lineHeight: '1.4'
                }}>
                  <strong>💡 Hướng dẫn:</strong>
                  <ul style={{ marginTop: '0.5rem', paddingLeft: '1rem', margin: '0.5rem 0 0 0' }}>
                    <li><strong>Admin/Super Admin</strong> → Sử dụng Super Admin Portal</li>
                    <li><strong>Người dùng cuối</strong> → Sử dụng User App</li>
                    <li><strong>Chưa có tài khoản</strong> → Liên hệ admin</li>
                  </ul>
                </div>
              )}
            </ToastNotification>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">
                <Mail size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                Email *
              </label>
              <input
                type="email"
                id="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email của bạn"
                disabled={isLoading}
                style={{
                  transition: 'all 0.2s ease',
                  opacity: isLoading ? 0.6 : 1
                }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                <Key size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                Mật khẩu *
              </label>
              <input
                type="password"
                id="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                disabled={isLoading}
                style={{
                  transition: 'all 0.2s ease',
                  opacity: isLoading ? 0.6 : 1
                }}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary w-full"
              disabled={isLoading}
              style={{
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {isLoading ? (
                <>
                  <div className="loading-dots" style={{
                    display: 'inline-block',
                    width: '16px',
                    height: '16px',
                    marginRight: '0.5rem'
                  }}>⏳</div>
                  <span>Đang đăng nhập...</span>
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  Đăng nhập
                </>
              )}
            </button>
          </form>

          <div style={{ 
            marginTop: '1.5rem', 
            padding: '1rem', 
            backgroundColor: '#fef3c7', 
            borderRadius: '0.5rem',
            fontSize: '0.75rem',
            color: '#92400e',
            border: '1px solid #fbbf24'
          }}>
            <strong>⚠️ Chỉ dành cho Chủ Trạm:</strong>
            <p style={{ marginTop: '0.5rem', fontSize: '0.7rem' }}>
              Hệ thống này chỉ dành cho chủ trạm sạc. Nếu bạn là:
            </p>
            <ul style={{ marginTop: '0.5rem', paddingLeft: '1rem' }}>
              <li><strong>Admin/Super Admin:</strong> Vui lòng sử dụng Super Admin Portal</li>
              <li><strong>Người dùng cuối:</strong> Vui lòng sử dụng User App</li>
              <li><strong>Chưa có tài khoản:</strong> Liên hệ admin để được cấp tài khoản chủ trạm</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default LoginForm;
