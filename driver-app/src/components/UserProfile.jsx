import React, { useState, useEffect, useRef } from 'react';
import { User, LogOut, Settings, MapPin, Clock, ChevronDown } from 'lucide-react';

const UserProfile = ({ user, onSignOut, onLocationUpdate }) => {
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Try to get user's location on mount
    getCurrentLocation();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Trình duyệt không hỗ trợ định vị');
      return;
    }

    setLoadingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = [
          position.coords.latitude,
          position.coords.longitude
        ];
        setLocation(userLocation);
        setLoadingLocation(false);

        if (onLocationUpdate) {
          onLocationUpdate(userLocation);
        }
      },
      (error) => {
        let errorMessage;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Người dùng từ chối chia sẻ vị trí';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Không thể xác định vị trí';
            break;
          case error.TIMEOUT:
            errorMessage = 'Hết thời gian chờ định vị';
            break;
          default:
            errorMessage = 'Lỗi không xác định khi định vị';
            break;
        }
        setLocationError(errorMessage);
        setLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000 // 1 minute
      }
    );
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <style>
        {`
        .user-profile-container {
          position: relative;
        }

        .user-profile-trigger {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .user-profile-trigger:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 0.875rem;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
        }

        .user-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .user-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: white;
          line-height: 1.2;
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .user-status {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.8);
          line-height: 1;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .status-online {
          background: #10b981;
        }

        .status-offline {
          background: #ef4444;
        }

        .dropdown-icon {
          width: 16px;
          height: 16px;
          transition: transform 0.3s ease;
          color: rgba(255, 255, 255, 0.8);
        }

        .dropdown-open .dropdown-icon {
          transform: rotate(180deg);
        }

        .user-profile-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 320px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          border: 1px solid rgba(0, 0, 0, 0.1);
          z-index: 9999;
          opacity: 0;
          visibility: hidden;
          transform: translateY(-10px);
          transition: all 0.3s ease;
        }

        .dropdown-open .user-profile-dropdown {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .dropdown-header {
          padding: 1.5rem;
          border-bottom: 1px solid #f1f5f9;
        }

        .dropdown-user-info {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .dropdown-avatar {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 1.125rem;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .dropdown-user-details h3 {
          font-size: 1rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 0.25rem 0;
        }

        .dropdown-user-details p {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0;
        }

        .location-status {
          padding: 0.75rem;
          background: #f8fafc;
          border-radius: 8px;
        }

        .location-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
        }

        .location-success {
          color: #059669;
        }

        .location-error {
          color: #dc2626;
        }

        .location-pending {
          color: #6b7280;
        }

        .location-coords {
          color: #6b7280;
          font-size: 0.75rem;
          margin-left: 1.5rem;
        }

        .retry-button {
          color: #3b82f6;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 0.875rem;
          text-decoration: underline;
          margin-left: 0.5rem;
        }

        .retry-button:hover {
          color: #1d4ed8;
        }

        .dropdown-content {
          padding: 1rem;
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #6b7280;
          padding: 0.5rem;
          background: #f8fafc;
          border-radius: 8px;
        }

        .dropdown-actions {
          display: flex;
          gap: 0.5rem;
          padding-top: 1rem;
          border-top: 1px solid #f1f5f9;
        }

        .action-button {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem;
          border: none;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .location-button {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .location-button:hover {
          background: #bfdbfe;
        }

        .location-button:disabled {
          background: #f3f4f6;
          color: #9ca3af;
          cursor: not-allowed;
        }

        .signout-button {
          background: #fef2f2;
          color: #dc2626;
        }

        .signout-button:hover {
          background: #fecaca;
        }

        .loading-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .user-profile-trigger {
            padding: 0.5rem;
            gap: 0.5rem;
          }

          .user-info {
            display: none;
          }

          .user-profile-dropdown {
            width: 280px;
            right: -1rem;
          }
        }

        @media (max-width: 480px) {
          .user-profile-dropdown {
            width: calc(100vw - 2rem);
            right: -1rem;
            left: -1rem;
          }
        }
        `}
      </style>

      <div
        className={`user-profile-container${isDropdownOpen ? ' dropdown-open' : ''}`}
        ref={dropdownRef}
      >
        <button
          className="user-profile-trigger"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <div className="user-avatar">
            {user.displayName ? user.displayName[0].toUpperCase() : <User size={16} />}
          </div>
          <div className="user-info">
            <div className="user-name">
              {user.displayName || user.email?.split('@')[0]}
            </div>
            <div className="user-status">
              <div className={`status-dot ${location ? 'status-online' : 'status-offline'}`}></div>
              {location ? 'Đã định vị' : 'Chưa định vị'}
            </div>
          </div>
          <ChevronDown className="dropdown-icon" />
        </button>

        <div className="user-profile-dropdown">
          <div className="dropdown-header">
            <div className="dropdown-user-info">
              <div className="dropdown-avatar">
                {user.displayName ? user.displayName[0].toUpperCase() : <User size={20} />}
              </div>
              <div className="dropdown-user-details">
                <h3>{user.displayName || user.email?.split('@')[0]}</h3>
                <p>{user.email}</p>
              </div>
            </div>

            <div className="location-status">
              {location ? (
                <div className="location-item location-success">
                  <MapPin size={16} />
                  <span>Vị trí đã được cập nhật</span>
                </div>
              ) : locationError ? (
                <div className="location-item location-error">
                  <MapPin size={16} />
                  <span>{locationError}</span>
                  <button onClick={getCurrentLocation} className="retry-button">
                    Thử lại
                  </button>
                </div>
              ) : (
                <div className="location-item location-pending">
                  <MapPin size={16} />
                  <span>Chưa xác định vị trí</span>
                  <button onClick={getCurrentLocation} className="retry-button">
                    Lấy vị trí
                  </button>
                </div>
              )}
              {location && (
                <div className="location-coords">
                  Tọa độ: {location[0].toFixed(4)}, {location[1].toFixed(4)}
                </div>
              )}
            </div>
          </div>

          <div className="dropdown-content">
            <div className="info-grid">
              <div className="info-item">
                <Clock size={16} />
                <span>Đăng nhập: {new Date(user.metadata?.lastSignInTime).toLocaleDateString('vi-VN')}</span>
              </div>
              <div className="info-item">
                <User size={16} />
                <span>Tài khoản: {user.emailVerified ? 'Đã xác thực' : 'Chưa xác thực'}</span>
              </div>
            </div>

            <div className="dropdown-actions">
              <button
                onClick={getCurrentLocation}
                disabled={loadingLocation}
                className="action-button location-button"
              >
                {loadingLocation ? (
                  <div className="loading-spinner"></div>
                ) : (
                  <MapPin size={16} />
                )}
                Cập nhật vị trí
              </button>
              <button
                onClick={onSignOut}
                className="action-button signout-button"
              >
                <LogOut size={16} />
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserProfile;