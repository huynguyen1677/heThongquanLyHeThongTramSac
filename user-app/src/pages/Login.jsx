import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/auth-page.css';

function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const result = await login(formData.email, formData.password);
        if (result.success) {
          navigate('/');
        } else {
          setError(result.error);
        }
      } else {
        if (formData.password !== formData.confirmPassword) {
          setError('Mật khẩu xác nhận không khớp');
          setLoading(false);
          return;
        }
        const result = await register(formData.email, formData.password, formData.name, formData.phone);
        if (result.success) {
          setFormData({
            email: '',
            password: '',
            name: '',
            phone: '',
            confirmPassword: ''
          });
          setError('');
          setIsLogin(true);
        } else {
          setError(result.error);
        }
      }
    } catch (error) {
      setError(error.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-wave"></div>
        <div className="auth-wave auth-wave-2"></div>
      </div>
      
      <div className="auth-content">
        {/* Logo và Back Button */}
        <div className="auth-header">
          <Link to="/" className="back-link">
            <i className="fas fa-arrow-left"></i>
            <span>Quay lại trang chủ</span>
          </Link>
          
          <div className="auth-logo">
            <div className="logo-icon">
              <i className="fas fa-charging-station"></i>
            </div>
            <span className="logo-text">EV Charging</span>
          </div>
        </div>

        {/* Auth Card */}
        <div className="auth-card">
          <div className="auth-card-header">
            <h1 className="auth-title">
              {isLogin ? 'Chào mừng trở lại!' : 'Tạo tài khoản mới'}
            </h1>
            <p className="auth-subtitle">
              {isLogin 
                ? 'Đăng nhập để tiếp tục sử dụng dịch vụ sạc xe điện'
                : 'Đăng ký để trải nghiệm dịch vụ sạc xe điện tiện lợi'
              }
            </p>
          </div>

          <div className="auth-card-body">
            {error && (
              <div className="error-alert">
                <i className="fas fa-exclamation-triangle"></i>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              {!isLogin && (
                <>
                  <div className="form-group">
                    <label className="form-label">
                      <i className="fas fa-user"></i>
                      Họ và tên
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Nhập họ tên của bạn"
                      required={!isLogin}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <i className="fas fa-phone"></i>
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="0901234567"
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-envelope"></i>
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="name@example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-lock"></i>
                  Mật khẩu
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Nhập mật khẩu"
                    required
                    minLength="6"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div className="form-group">
                  <label className="form-label">
                    <i className="fas fa-lock"></i>
                    Xác nhận mật khẩu
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Nhập lại mật khẩu"
                      required={!isLogin}
                      minLength="6"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-auth-primary"
              >
                {loading ? (
                  <>
                    <div className="spinner"></div>
                    {isLogin ? 'Đang đăng nhập...' : 'Đang đăng ký...'}
                  </>
                ) : (
                  <>
                    <i className={`fas ${isLogin ? 'fa-sign-in-alt' : 'fa-user-plus'}`}></i>
                    {isLogin ? 'Đăng nhập' : 'Đăng ký'}
                  </>
                )}
              </button>

              {isLogin && (
                <div className="forgot-password">
                  <Link to="/forgot-password" className="forgot-link">
                    Quên mật khẩu?
                  </Link>
                </div>
              )}
            </form>
          </div>

          <div className="auth-card-footer">
            <div className="auth-switch">
              <span className="switch-text">
                {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setFormData({
                    email: '',
                    password: '',
                    name: '',
                    phone: '',
                    confirmPassword: ''
                  });
                }}
                className="switch-button"
              >
                {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
              </button>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="auth-features">
          <div className="feature-item">
            <div className="feature-icon">
              <i className="fas fa-bolt"></i>
            </div>
            <span>Sạc nhanh</span>
          </div>
          <div className="feature-item">
            <div className="feature-icon">
              <i className="fas fa-map-marker-alt"></i>
            </div>
            <span>Tìm trạm dễ dàng</span>
          </div>
          <div className="feature-item">
            <div className="feature-icon">
              <i className="fas fa-wallet"></i>
            </div>
            <span>Thanh toán tiện lợi</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;