import React, { useState } from 'react';
import authService from '../services/authService';
import FirebaseConnectionTest from '../components/FirebaseConnectionTest';
import { Mail, Lock, Eye, EyeOff, Zap, Chrome, Play } from 'lucide-react';
import './LoginPage.css';

const LoginPage = ({ onAuthSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailPasswordSignIn = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Vui lòng điền đầy đủ thông tin.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await authService.signInWithEmail(email, password);
      if (result.success) {
        if (onAuthSuccess) {
          onAuthSuccess(result.user);
        }
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await authService.signInWithGoogle();
      if (result.success) {
        if (onAuthSuccess) {
          onAuthSuccess(result.user);
        }
      } else if (result.error) {
        setError(result.error);
      }
      // If result.error is null, user cancelled - don't show error
    } catch (err) {
      setError('Đã xảy ra lỗi khi đăng nhập với Google');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await authService.loginAsDemo();
      if (result.success) {
        if (onAuthSuccess) {
          onAuthSuccess(result.user);
        }
      } else {
        setError(result.error || 'Không thể đăng nhập với tài khoản demo');
      }
    } catch (err) {
      setError('Đã xảy ra lỗi khi đăng nhập demo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form-container">
      <div className="auth-form">
        <div className="auth-header">
          <div className="auth-icon">
            <Zap size={32} className="icon-white" />
          </div>
          <h2 className="auth-title">Đăng nhập</h2>
          <p className="auth-subtitle">Chào mừng bạn trở lại với EV Charging</p>
        </div>

        {error && (
          <div className="error-message">
            <p className="error-text">{error}</p>
          </div>
        )}

        <form onSubmit={handleEmailPasswordSignIn} className="auth-form-fields">
          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="Nhập email của bạn"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Mật khẩu</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="Nhập mật khẩu"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? (
              <>
                <div className="loading-spinner"></div>
                Đang đăng nhập...
              </>
            ) : (
              'Đăng nhập'
            )}
          </button>
        </form>

        <div className="divider">
          <div className="divider-line"></div>
          <span className="divider-text">Hoặc</span>
          <div className="divider-line"></div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="btn-google"
        >
          <Chrome size={20} className="google-icon" />
          <span className="google-text">Đăng nhập với Google</span>
        </button>

        <div className="auth-links">
          <button 
            type="button"
            onClick={() => setError('Tính năng quên mật khẩu sẽ được cập nhật sớm.')}
            className="auth-link-button"
          >
            Quên mật khẩu?
          </button>
        </div>

        <div className="auth-footer">
          <p className="auth-footer-text">
            Chưa có tài khoản?
            <button 
              type="button"
              onClick={() => setError('Tính năng đăng ký sẽ được cập nhật sớm.')}
              className="auth-link-primary-button"
            >
              Đăng ký ngay
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;