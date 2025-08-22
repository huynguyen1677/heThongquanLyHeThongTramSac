import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Zap, MapPin, Loader, Wifi, WifiOff } from 'lucide-react';
import 'leaflet/dist/leaflet.css'; // Import Leaflet's CSS
import RealtimeService from '../services/realtimeService';
import StationPopup from './StationPopup';

// Fix Leaflet default icons
// This is a common workaround for issues with Webpack and Leaflet's default icon paths.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create beautiful station icons
const createStationIcon = (status, isSelected = false) => {
  const colors = {
    available: '#10b981', // Green
    occupied: '#f59e0b', // Amber
    charging: '#3b82f6', // Blue
    faulted: '#ef4444', // Red
    offline: '#6b7280' // Gray
  };
  
  const color = colors[status] || colors.offline;
  const size = isSelected ? 28 : 24;
  const pulseAnimation = status === 'charging' ? `
    animation: pulse 2s infinite;
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.1); opacity: 0.8; }
    }
  ` : '';
  
  return L.divIcon({
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        ${pulseAnimation}
        ${isSelected ? 'box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);' : ''}
      ">
        <div style="
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
        "></div>
        ${isSelected ? `
          <div style="
            position: absolute;
            top: -8px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-bottom: 8px solid ${color};
          "></div>
        ` : ''}
      </div>
    `,
    className: 'custom-station-icon',
    iconSize: [size, size],
    iconAnchor: [size/2, size/2]
  });
};

// Create user location icon
const createUserIcon = () => {
  return L.divIcon({
    html: `
      <div style="
        width: 16px;
        height: 16px;
        background: #3b82f6;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
        animation: userPulse 3s infinite;
      "></div>
      <style>
        @keyframes userPulse {
          0% { box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4), 0 0 0 0 rgba(59, 130, 246, 0.7); }
          70% { box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4), 0 0 0 10px rgba(59, 130, 246, 0); }
          100% { box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4), 0 0 0 0 rgba(59, 130, 246, 0); }
        }
      </style>
    `,
    className: 'user-location-icon',
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
};

const StationMap = ({ onStationSelect, userLocation, selectedStationId }) => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Default center (Ho Chi Minh City)
  const defaultCenter = [10.8231, 106.6297];
  const mapCenter = userLocation || defaultCenter;

  useEffect(() => {
    const unsubscribe = RealtimeService.subscribeToStations(
      (stationsData) => {
        const stationsWithLocation = stationsData.filter(station => 
          station.location && 
          station.location.latitude && 
          station.location.longitude
        );
        setStations(stationsWithLocation);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error('Error loading stations:', error);
        setError('Không thể tải dữ liệu trạm sạc');
        setLoading(false);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const getStationStatus = (station) => {
    if (!station.connectors) return 'offline';
    
    const connectors = Object.values(station.connectors);
    if (connectors.length === 0) return 'offline';
    
    if (connectors.some(c => c.status === 'Charging')) return 'charging';
    if (connectors.some(c => c.status === 'Available')) return 'available';
    if (connectors.every(c => c.status === 'Occupied' || c.status === 'Preparing')) return 'occupied';
    if (connectors.some(c => c.status === 'Faulted')) return 'faulted';
    
    return 'offline';
  };

  const handleStationClick = (station) => {
    if (onStationSelect) {
      onStationSelect(station);
    }
  };

  const getStatusStats = () => {
    const stats = {
      available: 0,
      charging: 0,
      occupied: 0,
      faulted: 0,
      offline: 0
    };
    
    stations.forEach(station => {
      const status = getStationStatus(station);
      stats[status]++;
    });
    
    return stats;
  };

  const stats = getStatusStats();

  if (loading) {
    return (
      <>
        <style>
          {`
          .map-loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            color: #0369a1;
          }
          
          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #bfdbfe;
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
            font-size: 0.875rem;
            font-weight: 500;
          }
          `}
        </style>
        <div className="map-loading-container">
          <div className="loading-spinner"></div>
          <span className="loading-text">Đang tải bản đồ và trạm sạc...</span>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <style>
          {`
          .map-error-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
            color: #dc2626;
            text-align: center;
            padding: 2rem;
          }
          
          .error-icon {
            margin-bottom: 1rem;
          }
          
          .error-title {
            font-size: 1.125rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
          }
          
          .error-message {
            font-size: 0.875rem;
            opacity: 0.8;
          }
          `}
        </style>
        <div className="map-error-container">
          <WifiOff size={48} className="error-icon" />
          <h3 className="error-title">Không thể tải bản đồ</h3>
          <p className="error-message">{error}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <style>
        {`
        .map-container {
          position: relative;
          height: 100%;
          width: 100%;
          background: #f8fafc;
        }
        
        .leaflet-container {
          height: 100%;
          width: 100%;
          border-radius: 0;
        }
        
        .map-legend {
          position: absolute;
          bottom: 20px;
          left: 20px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 1rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(226, 232, 240, 0.8);
          z-index: 1000;
          min-width: 200px;
        }
        
        .legend-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .legend-items {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.75rem;
          color: #6b7280;
        }
        
        .legend-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
          flex-shrink: 0;
        }
        
        .legend-count {
          margin-left: auto;
          font-weight: 600;
          color: #374151;
          background: #f3f4f6;
          padding: 0.125rem 0.375rem;
          border-radius: 4px;
          font-size: 0.625rem;
        }
        
        .map-stats {
          position: absolute;
          top: 20px;
          left: 20px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 1rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(226, 232, 240, 0.8);
          z-index: 1000;
        }
        
        .stats-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .stats-number {
          font-size: 1.5rem;
          font-weight: 700;
          color: #3b82f6;
        }
        
        .stats-label {
          font-size: 0.75rem;
          color: #6b7280;
        }
        
        /* Custom popup styles */
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          border: 1px solid rgba(0, 0, 0, 0.1);
        }
        
        .leaflet-popup-tip {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        /* Mobile responsive */
        @media (max-width: 768px) {
          .map-legend {
            bottom: 10px;
            left: 10px;
            right: 10px;
            padding: 0.75rem;
          }
          
          .legend-items {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.5rem;
          }
          
          .map-stats {
            top: 10px;
            left: 10px;
            padding: 0.75rem;
          }
        }
        `}
      </style>
      
      <div className="map-container">
        <MapContainer
          center={mapCenter}
          zoom={userLocation ? 15 : 12}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
          
          {/* User location marker */}
          {userLocation && (
            <Marker 
              position={userLocation}
              icon={createUserIcon()}
              zIndexOffset={1000}
            >
              <Popup>
                <div style={{ 
                  padding: '0.75rem',
                  textAlign: 'center',
                  minWidth: '150px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem'
                  }}>
                    <MapPin size={16} color="#3b82f6" />
                    <strong style={{ color: '#1f2937' }}>Vị trí của bạn</strong>
                  </div>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '0.75rem', 
                    color: '#6b7280' 
                  }}>
                    {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}
                  </p>
                </div>
              </Popup>
            </Marker>
          )}
          
          {/* Station markers */}
          {stations.map((station) => {
            const status = getStationStatus(station);
            const isSelected = selectedStationId === station.stationId;

            return (
              <Marker
                key={station.stationId}
                position={[station.location.latitude, station.location.longitude]}
                icon={createStationIcon(status, isSelected)}
                eventHandlers={{
                  click: () => handleStationClick(station)
                }}
                zIndexOffset={isSelected ? 1000 : 0}
              >
                <Popup>
                  <StationPopup 
                    station={station} 
                    onStationSelect={handleStationClick}
                  />
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
        
        {/* Map Statistics */}
        <div className="map-stats">
          <div className="stats-title">
            <Zap size={16} />
            Tổng trạm sạc
          </div>
          <div className="stats-number">{stations.length}</div>
          <div className="stats-label">trạm đang hoạt động</div>
        </div>
        
        {/* Map Legend */}
        <div className="map-legend">
          <div className="legend-title">
            <MapPin size={16} />
            Trạng thái trạm
          </div>
          <div className="legend-items">
            <div className="legend-item">
              <div className="legend-dot" style={{ background: '#10b981' }}></div>
              <span>Có sẵn</span>
              <span className="legend-count">{stats.available}</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot" style={{ background: '#3b82f6' }}></div>
              <span>Đang sạc</span>
              <span className="legend-count">{stats.charging}</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot" style={{ background: '#f59e0b' }}></div>
              <span>Đã đầy</span>
              <span className="legend-count">{stats.occupied}</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot" style={{ background: '#ef4444' }}></div>
              <span>Lỗi</span>
              <span className="legend-count">{stats.faulted}</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot" style={{ background: '#6b7280' }}></div>
              <span>Offline</span>
              <span className="legend-count">{stats.offline}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StationMap;