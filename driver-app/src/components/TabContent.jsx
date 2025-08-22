import React from 'react';
import { Zap, MapPin, Clock, AlertCircle, Loader } from 'lucide-react';
import ChargingControl from './ChargingControl';
import UserChargingHistory from './UserChargingHistory';

const TabContent = ({
  activeTab,
  selectedStation,
  onSelectStation,
  userId,
  onSessionUpdate,
  isLoading,
  error,
}) => {
  // Hướng dẫn sử dụng với styling đẹp
  const StationGuide = () => (
    <>
      <style>
        {`
        .tabcontent-guide {
          background: linear-gradient(135deg, #dbeafe 0%, #e0f2fe 100%);
          border: 1px solid #bfdbfe;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          position: relative;
          overflow: hidden;
        }

        .tabcontent-guide::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #3b82f6 0%, #10b981 100%);
        }

        .tabcontent-guide-title {
          font-size: 1rem;
          font-weight: 600;
          color: #1e40af;
          margin: 0 0 1rem 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .tabcontent-guide ul {
          margin: 0;
          padding-left: 1.5rem;
          color: #1e40af;
        }

        .tabcontent-guide li {
          margin-bottom: 0.75rem;
          line-height: 1.5;
          position: relative;
        }

        .tabcontent-guide li::marker {
          color: #3b82f6;
        }

        .tabcontent-guide li:last-child {
          margin-bottom: 0;
        }
        `}
      </style>
      <div className="tabcontent-guide">
        <p className="tabcontent-guide-title">
          💡 Hướng dẫn sử dụng
        </p>
        <ul>
          <li>Chọn trạm trên bản đồ để xem chi tiết và thông tin sạc.</li>
          <li>Nhấn "Điều khiển sạc" để bắt đầu hoặc dừng phiên sạc.</li>
          <li>Xem lịch sử sạc chi tiết ở tab "Lịch sử" để theo dõi.</li>
        </ul>
      </div>
    </>
  );

  // Card trạm đã chọn với design hiện đại
  const SelectedStationCard = ({ station, onControlClick }) => (
    <>
      <style>
        {`
        .tabcontent-station-card {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border: 1px solid #0ea5e9;
          border-radius: 16px;
          padding: 2rem;
          text-align: center;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .tabcontent-station-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #0ea5e9 0%, #10b981 100%);
        }

        .tabcontent-station-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(14, 165, 233, 0.15);
        }

        .tabcontent-station-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .tabcontent-station-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
        }

        .tabcontent-station-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #0c4a6e;
          margin: 0;
        }

        .tabcontent-station-name {
          font-size: 1rem;
          color: #0369a1;
          margin: 0 0 1.5rem 0;
          font-weight: 500;
        }

        .tabcontent-station-info {
          display: flex;
          justify-content: center;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }

        .tabcontent-station-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
        }

        .tabcontent-station-stat-icon {
          color: #0ea5e9;
        }

        .tabcontent-station-stat-label {
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 500;
        }

        .tabcontent-station-stat-value {
          font-size: 0.875rem;
          color: #0c4a6e;
          font-weight: 600;
        }

        .tabcontent-control-btn {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          border: none;
          padding: 0.875rem 2rem;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin: 0 auto;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .tabcontent-control-btn:hover {
          background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
        }

        .tabcontent-control-btn:active {
          transform: translateY(0);
        }
        `}
      </style>
      <div className="tabcontent-station-card">
        <div className="tabcontent-station-header">
          <div className="tabcontent-station-icon">
            <Zap size={24} />
          </div>
          <h4 className="tabcontent-station-title">Trạm đã chọn</h4>
        </div>
        
        <p className="tabcontent-station-name">
          {station.name || `Trạm sạc EV - ${station.stationId}`}
        </p>

        <div className="tabcontent-station-info">
          <div className="tabcontent-station-stat">
            <MapPin size={16} className="tabcontent-station-stat-icon" />
            <span className="tabcontent-station-stat-label">Vị trí</span>
            <span className="tabcontent-station-stat-value">
              {station.address || 'Đang cập nhật'}
            </span>
          </div>
          <div className="tabcontent-station-stat">
            <Zap size={16} className="tabcontent-station-stat-icon" />
            <span className="tabcontent-station-stat-label">Trạng thái</span>
            <span className="tabcontent-station-stat-value">
              {station.status === 'available' ? 'Sẵn sàng' : 'Đang sử dụng'}
            </span>
          </div>
        </div>

        <button onClick={onControlClick} className="tabcontent-control-btn">
          <Zap size={16} />
          Điều khiển sạc
        </button>
      </div>
    </>
  );

  // Loading component
  const LoadingState = () => (
    <>
      <style>
        {`
        .tabcontent-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 1.5rem;
          text-align: center;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e5e7eb;
          border-top: 3px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .loading-text {
          color: #6b7280;
          font-size: 0.875rem;
          font-weight: 500;
        }
        `}
      </style>
      <div className="tabcontent-loading">
        <div className="loading-spinner"></div>
        <p className="loading-text">Đang tải dữ liệu...</p>
      </div>
    </>
  );

  // Error component
  const ErrorState = ({ error }) => (
    <>
      <style>
        {`
        .tabcontent-error {
          background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
          border: 1px solid #fca5a5;
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
          color: #dc2626;
        }

        .error-icon {
          margin-bottom: 1rem;
          color: #ef4444;
        }

        .error-title {
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
        }

        .error-message {
          font-size: 0.875rem;
          margin: 0;
          opacity: 0.8;
        }
        `}
      </style>
      <div className="tabcontent-error">
        <AlertCircle size={32} className="error-icon" />
        <h4 className="error-title">Đã xảy ra lỗi</h4>
        <p className="error-message">{error}</p>
      </div>
    </>
  );

  // Empty state component
  const EmptyState = ({ message, icon }) => (
    <>
      <style>
        {`
        .tabcontent-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 1.5rem;
          text-align: center;
          color: #6b7280;
        }

        .empty-icon {
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .empty-message {
          font-size: 0.875rem;
          font-weight: 500;
          margin: 0;
        }
        `}
      </style>
      <div className="tabcontent-empty">
        {icon && React.cloneElement(icon, { size: 48, className: 'empty-icon' })}
        <p className="empty-message">{message}</p>
      </div>
    </>
  );

  // Main container styling
  const containerStyle = `
    .tabcontent-section {
      padding: 1.5rem;
      height: 100%;
      overflow-y: auto;
      background: #ffffff;
    }

    .tabcontent-section::-webkit-scrollbar {
      width: 6px;
    }

    .tabcontent-section::-webkit-scrollbar-track {
      background: #f1f5f9;
      border-radius: 3px;
    }

    .tabcontent-section::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 3px;
    }

    .tabcontent-section::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }
  `;

  // Early returns for loading and error states
  if (isLoading) {
    return (
      <>
        <style>{containerStyle}</style>
        <div className="tabcontent-section">
          <LoadingState />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <style>{containerStyle}</style>
        <div className="tabcontent-section">
          <ErrorState error={error} />
        </div>
      </>
    );
  }

  // Tab content rendering
  if (activeTab === 'map') {
    return (
      <>
        <style>{containerStyle}</style>
        <div className="tabcontent-section">
          <StationGuide />
          {selectedStation ? (
            <SelectedStationCard
              station={selectedStation}
              onControlClick={() => onSelectStation('control')}
            />
          ) : (
            <EmptyState
              message="Chưa chọn trạm nào trên bản đồ. Nhấn vào một trạm để xem chi tiết."
              icon={<MapPin />}
            />
          )}
        </div>
      </>
    );
  }

  if (activeTab === 'control') {
    return (
      <>
        <style>{containerStyle}</style>
        <div className="tabcontent-section">
          {selectedStation ? (
            <ChargingControl
              station={selectedStation}
              userId={userId}
              onSessionUpdate={onSessionUpdate}
            />
          ) : (
            <EmptyState
              message="Vui lòng chọn trạm trên bản đồ để điều khiển sạc."
              icon={<Zap />}
            />
          )}
        </div>
      </>
    );
  }

  if (activeTab === 'history') {
    return (
      <>
        <style>{containerStyle}</style>
        <div className="tabcontent-section">
          <UserChargingHistory userId={userId} />
        </div>
      </>
    );
  }

  return null;
};

export default TabContent;