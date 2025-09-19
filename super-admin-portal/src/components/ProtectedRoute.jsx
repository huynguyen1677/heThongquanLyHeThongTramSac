import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader, Shield, AlertTriangle } from 'lucide-react';
import './ProtectedRoute.css';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, userProfile, loading } = useAuth();
  const location = useLocation();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="protected-route-loading">
        <div className="loading-container">
          <Loader className="spinner" size={48} />
          <h3>Đang xác thực...</h3>
          <p>Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check specific role if required
  if (requiredRole) {
    if (requiredRole === 'super-admin' && userProfile?.role !== 'super-admin') {
      return (
        <div className="protected-route-error">
          <div className="error-container">
            <Shield size={64} className="error-icon" />
            <h2>Truy Cập Bị Từ Chối</h2>
            <p>Bạn không có quyền truy cập vào trang này.</p>
            <p>Chỉ Super Admin mới có thể truy cập.</p>
            <button 
              onClick={() => window.history.back()}
              className="back-button"
            >
              Quay Lại
            </button>
          </div>
        </div>
      );
    }

    if (requiredRole === 'admin' && !['admin', 'super-admin'].includes(userProfile?.role)) {
      return (
        <div className="protected-route-error">
          <div className="error-container">
            <AlertTriangle size={64} className="error-icon" />
            <h2>Truy Cập Bị Từ Chối</h2>
            <p>Bạn không có quyền truy cập vào trang này.</p>
            <p>Chỉ Admin hoặc Super Admin mới có thể truy cập.</p>
            <button 
              onClick={() => window.history.back()}
              className="back-button"
            >
              Quay Lại
            </button>
          </div>
        </div>
      );
    }
  }

  // Default check - must be admin or super-admin
  if (!['admin', 'super-admin'].includes(userProfile?.role)) {
    return (
      <div className="protected-route-error">
        <div className="error-container">
          <Shield size={64} className="error-icon" />
          <h2>Truy Cập Bị Từ Chối</h2>
          <p>Hệ thống chỉ dành cho quản trị viên.</p>
          <p>Vui lòng liên hệ admin để được cấp quyền truy cập.</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="login-button"
          >
            Đăng Nhập Lại
          </button>
        </div>
      </div>
    );
  }

  // All checks passed - render children
  return children;
};

export default ProtectedRoute;