import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Lock, Mail, Shield, AlertCircle, Loader } from 'lucide-react';
import './Login.css';

const Login = () => {
  const { login, isAuthenticated, loading: authLoading, error: authError } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({});

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/overview" replace />;
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when user starts typing
    if (error) setError('');
    if (authError) setError('');
  };

  const handleInputBlur = (field) => {
    setTouched(prev => ({
      ...prev,
      [field]: true
    }));
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.email) {
      errors.email = 'Vui lòng nhập email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email không hợp lệ';
    }

    if (!formData.password) {
      errors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 6) {
      errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setError(Object.values(validationErrors)[0]);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(formData.email, formData.password);
      // Redirect sẽ được xử lý bởi AuthContext và Navigate component
    } catch (error) {
      setError(error.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  const formErrors = validateForm();
  const displayError = error || authError;

  if (authLoading) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="login-card">
            <div className="loading-state">
              <Loader className="spinner" size={32} />
              <p>Đang xác thực...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-background">
        <div className="bg-overlay"></div>
        <div className="bg-pattern"></div>
      </div>
      
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-icon">
              <Shield size={48} />
            </div>
            <h1 className="login-title">Quản Trị Hệ Thống</h1>
            <p className="login-subtitle">
              Đăng nhập để truy cập vào hệ thống quản lý trạm sạc
            </p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {displayError && (
              <div className="error-message">
                <AlertCircle size={16} />
                <span>{displayError}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <div className="input-container">
                <Mail className="input-icon" size={18} />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={() => handleInputBlur('email')}
                  className={`form-input ${touched.email && formErrors.email ? 'error' : ''}`}
                  placeholder="Nhập email của bạn"
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
              {touched.email && formErrors.email && (
                <span className="field-error">{formErrors.email}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Mật khẩu
              </label>
              <div className="input-container">
                <Lock className="input-icon" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  onBlur={() => handleInputBlur('password')}
                  className={`form-input ${touched.password && formErrors.password ? 'error' : ''}`}
                  placeholder="Nhập mật khẩu"
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {touched.password && formErrors.password && (
                <span className="field-error">{formErrors.password}</span>
              )}
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={loading || Object.keys(formErrors).length > 0}
            >
              {loading ? (
                <>
                  <Loader className="spinner" size={16} />
                  <span>Đang đăng nhập...</span>
                </>
              ) : (
                <>
                  <Shield size={16} />
                  <span>Đăng nhập</span>
                </>
              )}
            </button>
          </form>

          <div className="login-footer">
            <p className="security-notice">
              <Lock size={14} />
              Hệ thống chỉ dành cho quản trị viên
            </p>
            
            {(displayError?.includes('Không tìm thấy thông tin người dùng') || 
              displayError?.includes('không có quyền truy cập')) && (
              <div className="setup-link">
                <p>Chưa có tài khoản admin?</p>
                <a href="/setup" className="setup-btn">
                  Tạo Admin User
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;