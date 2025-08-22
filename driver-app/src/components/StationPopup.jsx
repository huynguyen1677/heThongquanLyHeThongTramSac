import React, { useState } from 'react';
import { 
  MapPin, 
  Zap, 
  Clock, 
  AlertCircle, 
  Battery,
  Navigation,
  Star,
  Wifi,
  WifiOff
} from 'lucide-react';

/**
 * Enhanced StationPopup component
 * Beautiful popup với detailed information và smooth animations
 */
const StationPopup = ({ station, onStationSelect }) => {
  const [isHovered, setIsHovered] = useState(false);

  const getStationStatus = (station) => {
    if (!station.connectors) return 'offline';

    const connectors = Object.values(station.connectors);
    if (connectors.length === 0) return 'offline';

    // Check status priority
    if (connectors.some(c => c.status === 'Charging')) return 'charging';
    if (connectors.some(c => c.status === 'Available')) return 'available';
    if (connectors.every(c => c.status === 'Occupied' || c.status === 'Preparing')) return 'occupied';
    if (connectors.some(c => c.status === 'Faulted')) return 'faulted';

    return 'offline';
  };

  const getStatusDisplay = (status) => {
    const statusMap = {
      available: { 
        text: 'Có sẵn', 
        color: '#10b981', 
        bgColor: 'rgba(16, 185, 129, 0.1)',
        icon: Zap,
        pulse: false
      },
      charging: { 
        text: 'Đang sạc', 
        color: '#3b82f6', 
        bgColor: 'rgba(59, 130, 246, 0.1)',
        icon: Battery,
        pulse: true
      },
      occupied: { 
        text: 'Đã đầy', 
        color: '#f59e0b', 
        bgColor: 'rgba(245, 158, 11, 0.1)',
        icon: Clock,
        pulse: false
      },
      faulted: { 
        text: 'Lỗi', 
        color: '#ef4444', 
        bgColor: 'rgba(239, 68, 68, 0.1)',
        icon: AlertCircle,
        pulse: false
      },
      offline: { 
        text: 'Offline', 
        color: '#6b7280', 
        bgColor: 'rgba(107, 114, 128, 0.1)',
        icon: WifiOff,
        pulse: false
      }
    };

    return statusMap[status] || statusMap.offline;
  };

  const getConnectorStats = () => {
    if (!station.connectors) return { available: 0, total: 0, charging: 0 };
    
    const connectors = Object.values(station.connectors);
    return {
      available: connectors.filter(c => c.status === 'Available').length,
      charging: connectors.filter(c => c.status === 'Charging').length,
      total: connectors.length
    };
  };

  const status = getStationStatus(station);
  const statusDisplay = getStatusDisplay(status);
  const StatusIcon = statusDisplay.icon;
  const connectorStats = getConnectorStats();

  const handleSelectStation = () => {
    if (onStationSelect) {
      onStationSelect(station);
    }
  };

  const getDistance = () => {
    // Mock distance calculation - in real app, calculate from user location
    return (Math.random() * 5 + 0.1).toFixed(1);
  };

  return (
    <>
      <style>
        {`
        .station-popup {
          min-width: 300px;
          max-width: 350px;
          font-family: inherit;
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          border: 1px solid rgba(0, 0, 0, 0.05);
        }
        
        .popup-header {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          padding: 1rem;
          border-bottom: 1px solid #e2e8f0;
          position: relative;
        }
        
        .popup-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, ${statusDisplay.color} 0%, ${statusDisplay.color}80 100%);
        }
        
        .station-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 0.5rem 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .station-address {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0;
        }
        
        .popup-content {
          padding: 1rem;
        }
        
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: ${statusDisplay.bgColor};
          color: ${statusDisplay.color};
          padding: 0.375rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          margin-bottom: 1rem;
          ${statusDisplay.pulse ? `
            animation: statusPulse 2s infinite;
          ` : ''}
        }
        
        @keyframes statusPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        .status-indicator {
          width: 8px;
          height: 8px;
          background: ${statusDisplay.color};
          border-radius: 50%;
          ${statusDisplay.pulse ? `
            animation: indicatorPulse 2s infinite;
          ` : ''}
        }
        
        @keyframes indicatorPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; }
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        
        .stat-card {
          text-align: center;
          padding: 0.75rem;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          transition: all 0.2s ease;
        }
        
        .stat-card:hover {
          background: #f1f5f9;
          transform: translateY(-1px);
        }
        
        .stat-number {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }
        
        .stat-label {
          font-size: 0.75rem;
          color: #6b7280;
          font-weight: 500;
        }
        
        .info-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid #f1f5f9;
          font-size: 0.875rem;
        }
        
        .info-row:last-child {
          border-bottom: none;
        }
        
        .info-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #6b7280;
        }
        
        .info-value {
          font-weight: 600;
          color: #374151;
        }
        
        .action-button {
          width: 100%;
          padding: 0.75rem 1rem;
          border: none;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 1rem;
          position: relative;
          overflow: hidden;
        }
        
        .action-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s ease;
        }
        
        .action-button:hover::before {
          left: 100%;
        }
        
        .button-available {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
        
        .button-available:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
        }
        
        .button-unavailable {
          background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
          color: white;
          cursor: not-allowed;
          opacity: 0.7;
        }
        
        .distance-badge {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #374151;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        
        .rating-stars {
          display: flex;
          gap: 0.125rem;
          margin-left: 0.5rem;
        }
        
        /* Mobile responsive */
        @media (max-width: 480px) {
          .station-popup {
            min-width: 280px;
            max-width: 300px;
          }
          
          .stats-grid {
            grid-template-columns: 1fr 1fr;
            gap: 0.5rem;
          }
          
          .popup-header,
          .popup-content {
            padding: 0.75rem;
          }
        }
        `}
      </style>
      
      <div className="station-popup">
        {/* Header */}
        <div className="popup-header">
          <h3 className="station-title">
            <Zap size={20} color="#3b82f6" />
            {station.name || `Trạm ${station.stationId}`}
            <div className="rating-stars">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  size={12} 
                  fill={i < 4 ? "#fbbf24" : "none"} 
                  color="#fbbf24" 
                />
              ))}
            </div>
          </h3>
          
          <p className="station-address">
            <MapPin size={14} />
            <span>
              {station.address || 
                `${station.location?.latitude?.toFixed(4)}, ${station.location?.longitude?.toFixed(4)}`}
            </span>
          </p>
          
          <div className="distance-badge">
            <Navigation size={12} />
            {getDistance()}km
          </div>
        </div>

        {/* Content */}
        <div className="popup-content">
          {/* Status Badge */}
          <div className="status-badge">
            <div className="status-indicator"></div>
            <StatusIcon size={14} />
            {statusDisplay.text}
          </div>

          {/* Statistics Grid */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number" style={{ color: '#10b981' }}>
                {connectorStats.available}
              </div>
              <div className="stat-label">Có sẵn</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-number" style={{ color: '#3b82f6' }}>
                {connectorStats.charging}
              </div>
              <div className="stat-label">Đang sạc</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-number" style={{ color: '#6b7280' }}>
                {connectorStats.total}
              </div>
              <div className="stat-label">Tổng cộng</div>
            </div>
          </div>

          {/* Additional Info */}
          <div style={{ marginBottom: '1rem' }}>
            {station.power && (
              <div className="info-row">
                <div className="info-label">
                  <Zap size={14} />
                  Công suất tối đa
                </div>
                <div className="info-value" style={{ color: '#10b981' }}>
                  {station.power}kW
                </div>
              </div>
            )}
            
            <div className="info-row">
              <div className="info-label">
                <Clock size={14} />
                Thời gian hoạt động
              </div>
              <div className="info-value">24/7</div>
            </div>
            
            <div className="info-row">
              <div className="info-label">
                <Wifi size={14} />
                Kết nối
              </div>
              <div className="info-value" style={{ color: '#10b981' }}>
                Tốt
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            className={`action-button ${status === 'available' ? 'button-available' : 'button-unavailable'}`}
            onClick={handleSelectStation}
            disabled={status !== 'available'}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {status === 'available' ? (
              <>
                <Navigation size={16} />
                Chọn trạm này
              </>
            ) : (
              <>
                <AlertCircle size={16} />
                Không khả dụng
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default StationPopup;