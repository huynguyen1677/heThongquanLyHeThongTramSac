import React from "react";
import { useNavigate } from "react-router-dom";
import useStations from "../contexts/useStations";
import "../styles/colors.css";
import "../styles/station-list.css";

function StationList({ stations: propStations, title, showTitle = true, layout = "grid" }) {
  const navigate = useNavigate();
  const { stations: contextStations, loading, error } = useStations();

  const stations = propStations || contextStations;

  const getStatusColor = (station) => {
    if (!station.online) return 'offline';
    switch (station.status?.toLowerCase()) {
      case 'available': return 'available';
      case 'charging': return 'charging';
      case 'occupied': return 'occupied';
      case 'maintenance': return 'maintenance';
      case 'faulted': return 'faulted';
      default: return 'unknown';
    }
  };

  const getConnectorStatus = (status) => {
    switch (status?.toLowerCase()) {
      case 'available': return 'available';
      case 'occupied': return 'occupied';
      case 'charging': return 'charging';
      case 'faulted': return 'faulted';
      case 'maintenance': return 'maintenance';
      default: return 'unknown';
    }
  };

  const getPowerLevel = (power) => {
    const powerNum = parseFloat(power);
    if (powerNum >= 150) return 'ultra';
    if (powerNum >= 50) return 'high';
    if (powerNum >= 22) return 'medium';
    return 'low';
  };

  const handleStationClick = (station) => {
    navigate(`/stations/${station.id}`);
  };

  if (loading && !propStations) {
    return (
      <div className="station-list-loading">
        <div className="loading-spinner"></div>
        <p className="loading-text">Đang tải danh sách trạm sạc...</p>
      </div>
    );
  }

  if (error && !propStations) {
    return (
      <div className="station-list-error">
        <div className="error-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h3 className="error-title">Không thể tải dữ liệu</h3>
        <p className="error-message">{error}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23,4 23,10 17,10"/>
            <polyline points="1,20 1,14 7,14"/>
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
          </svg>
          Thử lại
        </button>
      </div>
    );
  }

  if (!stations || stations.length === 0) {
    return (
      <div className="station-list-empty">
        <div className="empty-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        </div>
        <h3 className="empty-title">Không tìm thấy trạm sạc nào</h3>
        <p className="empty-message">Hiện tại không có trạm sạc nào trong khu vực này.</p>
      </div>
    );
  }

  return (
    <div className="station-list-wrapper">
      {showTitle && (
        <div className="station-list-header">
          <h2 className="station-list-title">{title || "Danh sách trạm sạc"}</h2>
          <div className="station-count">
            <span className="count-number">{stations.length}</span>
            <span className="count-text">trạm sạc</span>
          </div>
        </div>
      )}
      
      <div className={`station-list station-list-${layout}`}>
        {stations.map(station => {
          const statusClass = getStatusColor(station);
          const connectors = Array.isArray(station.connectors)
            ? station.connectors
            : Object.entries(station.connectors || {}).map(([id, val]) => ({ id, ...val }));

          return (
            <div 
              key={station.id} 
              className="station-card"
              onClick={() => handleStationClick(station)}
            >
              <div className="station-card-header">
                <div className="station-status-wrapper">
                  <div className={`station-status-indicator status-${statusClass}`} />
                  <span className={`station-status-text status-${statusClass}`}>
                    {station.online ? (station.status || 'Available') : 'Offline'}
                  </span>
                </div>
                <div className="station-card-actions">
                  <button className="station-favorite-btn" title="Thêm vào yêu thích">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="12,2 15.09,8.26 22,9 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9 8.91,8.26"/>
                    </svg>
                  </button>
                </div>
              </div>

              <div className="station-card-content">
                <h3 className="station-card-name">
                  {station.stationName || station.name || `Trạm ${station.id}`}
                </h3>
                
                <div className="station-card-address">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span>{station.address || "Chưa cập nhật địa chỉ"}</span>
                </div>

                <div className="station-card-info">
                  <div className="info-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                    <span>
                      {connectors.length} cổng sạc
                    </span>
                  </div>
                  
                  <div className="info-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                    </svg>
                    <span>{station.vendor || "N/A"}</span>
                  </div>
                </div>

                {connectors.length > 0 && (
                  <div className="station-connectors">
                    <div className="connectors-header">
                      <span>Cổng sạc</span>
                    </div>
                    <div className="connectors-list">
                      {connectors.slice(0, 3).map((connector, idx) => {
                        const connectorStatus = getConnectorStatus(connector.status);
                        const powerLevel = getPowerLevel(connector.power);
                        
                        return (
                          <div key={connector.id || idx} className="connector-item">
                            <div className="connector-info">
                              <div className="connector-type">
                                {connector.type || `Type ${idx + 1}`}
                              </div>
                              <div className={`connector-status status-${connectorStatus}`}>
                                {connector.status || 'Unknown'}
                              </div>
                            </div>
                            {connector.power && (
                              <div className={`connector-power power-${powerLevel}`}>
                                {connector.power}kW
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {connectors.length > 3 && (
                        <div className="connector-more">
                          +{connectors.length - 3} khác
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="station-card-footer">
                <div className="station-meta">
                  <span className="station-id">ID: {station.id}</span>
                  {station.model && (
                    <span className="station-model">{station.model}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StationList;