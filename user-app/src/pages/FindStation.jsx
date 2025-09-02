import React, { useEffect, useState, useMemo } from "react";
import { useCharging } from "../contexts/ChargingContext";
import { filterStationsByKeyword, sortStationsByDistance } from "../utils/stationUtils";
import StationMap from "../components/StationMap";
import StationDetailPopup from "../components/StationDetailPopup";
import "../styles/find-station-page.css";

function FindStation() {
  const { stations, stationsLoading, stationsError } = useCharging();
  const [userPos, setUserPos] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [connectorFilter, setConnectorFilter] = useState("all");
  const [sortBy, setSortBy] = useState("distance");
  const [viewMode, setViewMode] = useState("map"); // map, list, grid
  const [selectedStation, setSelectedStation] = useState(null);

  // Lấy vị trí người dùng
  useEffect(() => {
    if (navigator.geolocation) {
      setLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserPos({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          setLocationLoading(false);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setUserPos(null);
          setLocationLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    } else {
      setLocationLoading(false);
    }
  }, []);

  // Lọc và sắp xếp stations
  const processedStations = useMemo(() => {
    let filtered = filterStationsByKeyword(stations, search);
    
    // Lọc theo trạng thái
    if (statusFilter !== "all") {
      filtered = filtered.filter(s => 
        statusFilter === "online" ? s.online : !s.online
      );
    }
    
    // Lọc theo connector
    if (connectorFilter !== "all") {
      filtered = filtered.filter(s => {
        const connectors = Array.isArray(s.connectors) 
          ? s.connectors 
          : Object.values(s.connectors || {});
        return connectors.some(c => c.type === connectorFilter);
      });
    }
    
    // Sắp xếp
    let sorted = [...filtered];
    switch (sortBy) {
      case "distance":
        sorted = sortStationsByDistance(filtered, userPos);
        break;
      case "name":
        sorted = filtered.sort((a, b) => 
          (a.name || a.stationName || '').localeCompare(b.name || b.stationName || '')
        );
        break;
      case "status":
        sorted = filtered.sort((a, b) => {
          if (a.online && !b.online) return -1;
          if (!a.online && b.online) return 1;
          return 0;
        });
        break;
      default:
        sorted = filtered;
    }
    
    return sorted;
  }, [stations, search, statusFilter, connectorFilter, sortBy, userPos]);

  // Lọc stations có tọa độ hợp lệ cho bản đồ
  const validStations = processedStations.filter(
    s => typeof s.latitude === "number" && typeof s.longitude === "number"
  );

  // Thống kê
  const stats = useMemo(() => {
    const total = processedStations.length;
    const online = processedStations.filter(s => s.online).length;
    const offline = total - online;
    const nearbyCount = processedStations.filter(s => 
      s.distance !== undefined && s.distance <= 5
    ).length;
    
    return { total, online, offline, nearby: nearbyCount };
  }, [processedStations]);

  // Lấy danh sách connector types
  const availableConnectors = useMemo(() => {
    const types = new Set();
    stations.forEach(station => {
      const connectors = Array.isArray(station.connectors) 
        ? station.connectors 
        : Object.values(station.connectors || {});
      connectors.forEach(c => {
        if (c.type) types.add(c.type);
      });
    });
    return Array.from(types);
  }, [stations]);

  const handleStationClick = (station) => {
    setSelectedStation(station);
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setConnectorFilter("all");
    setSortBy("distance");
  };

  return (
    <div className="find-station-container">
      {/* Header */}
      <div className="find-station-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="page-title">Tìm trạm sạc</h1>
            <p className="page-subtitle">
              {locationLoading 
                ? "Đang xác định vị trí của bạn..." 
                : userPos 
                  ? "Tìm trạm sạc gần nhất và phù hợp với nhu cầu của bạn"
                  : "Không thể xác định vị trí. Hiển thị tất cả trạm sạc."
              }
            </p>
          </div>
          <div className="header-actions">
            <div className="location-status">
              {locationLoading ? (
                <div className="location-loading">
                  <i className="fas fa-spinner fa-spin"></i>
                  <span>Đang định vị...</span>
                </div>
              ) : userPos ? (
                <div className="location-found">
                  <i className="fas fa-map-marker-alt"></i>
                  <span>Đã định vị</span>
                </div>
              ) : (
                <div className="location-failed">
                  <i className="fas fa-exclamation-triangle"></i>
                  <span>Không định vị được</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-primary">
          <div className="stat-content">
            <div className="stat-info">
              <p className="stat-label">Tổng trạm</p>
              <p className="stat-value">{stats.total}</p>
            </div>
            <div className="stat-icon icon-bg-primary">
              <i className="fas fa-charging-station"></i>
            </div>
          </div>
        </div>
        
        <div className="stat-card stat-success">
          <div className="stat-content">
            <div className="stat-info">
              <p className="stat-label">Đang hoạt động</p>
              <p className="stat-value">{stats.online}</p>
            </div>
            <div className="stat-icon icon-bg-success">
              <i className="fas fa-power-off"></i>
            </div>
          </div>
        </div>
        
        <div className="stat-card stat-error">
          <div className="stat-content">
            <div className="stat-info">
              <p className="stat-label">Ngoại tuyến</p>
              <p className="stat-value">{stats.offline}</p>
            </div>
            <div className="stat-icon icon-bg-error">
              <i className="fas fa-exclamation-circle"></i>
            </div>
          </div>
        </div>
        
        <div className="stat-card stat-warning">
          <div className="stat-content">
            <div className="stat-info">
              <p className="stat-label">Gần bạn (≤5km)</p>
              <p className="stat-value">{stats.nearby}</p>
            </div>
            <div className="stat-icon icon-bg-warning">
              <i className="fas fa-map-marker-alt"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="search-filters-section">
        <div className="search-filters-header">
          <h3 className="section-title">Tìm kiếm & Bộ lọc</h3>
          <div className="view-controls">
            <button
              className={`view-btn ${viewMode === 'map' ? 'active' : ''}`}
              onClick={() => setViewMode('map')}
              title="Xem bản đồ"
            >
              <i className="fas fa-map"></i>
            </button>
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="Xem danh sách"
            >
              <i className="fas fa-list"></i>
            </button>
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Xem lưới"
            >
              <i className="fas fa-th"></i>
            </button>
          </div>
        </div>

        <div className="search-filters-content">
          {/* Search Bar */}
          <div className="search-bar">
            <div className="search-input-wrapper">
              <i className="fas fa-search search-icon"></i>
              <input
                type="text"
                placeholder="Tìm theo tên trạm hoặc địa chỉ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="search-clear"
                  title="Xóa tìm kiếm"
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="filters-row">
            <div className="filter-group">
              <label className="filter-label">
                <i className="fas fa-power-off"></i>
                Trạng thái
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="online">Đang hoạt động</option>
                <option value="offline">Ngoại tuyến</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">
                <i className="fas fa-plug"></i>
                Loại cổng
              </label>
              <select
                value={connectorFilter}
                onChange={(e) => setConnectorFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">Tất cả loại</option>
                {availableConnectors.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">
                <i className="fas fa-sort"></i>
                Sắp xếp theo
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="distance">Khoảng cách</option>
                <option value="name">Tên trạm</option>
                <option value="status">Trạng thái</option>
              </select>
            </div>

            <div className="filter-group">
              <button
                onClick={resetFilters}
                className="btn btn-outline btn-reset"
              >
                <i className="fas fa-times"></i>
                Xóa bộ lọc
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading & Error States */}
      {stationsLoading && (
        <div className="loading-section">
          <div className="loading-spinner-large">
            <i className="fas fa-spinner fa-spin"></i>
          </div>
          <p className="loading-text">Đang tải danh sách trạm sạc...</p>
        </div>
      )}

      {stationsError && (
        <div className="error-section">
          <div className="error-icon">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <h3 className="error-title">Lỗi tải dữ liệu</h3>
          <p className="error-message">{stationsError}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            <i className="fas fa-sync-alt"></i>
            Thử lại
          </button>
        </div>
      )}

      {/* Results */}
      {!stationsLoading && !stationsError && (
        <>
          {/* Results Info */}
          <div className="results-info">
            <p className="results-text">
              Tìm thấy <span className="results-count">{processedStations.length}</span> trạm sạc
              {(search || statusFilter !== 'all' || connectorFilter !== 'all') && (
                <button onClick={resetFilters} className="reset-link">
                  <i className="fas fa-times"></i> Xóa bộ lọc
                </button>
              )}
            </p>
          </div>

          {/* Content based on view mode */}
          {viewMode === 'map' && (
            <div className="map-view">
              <div className="map-section">
                <div className="map-header">
                  <h3 className="map-title">Bản đồ trạm sạc</h3>
                  <div className="map-info">
                    <span className="info-badge">
                      <span className="online-indicator"></span>
                      {stats.online} trạm đang hoạt động
                    </span>
                  </div>
                </div>
                <div className="map-container">
                  <StationMap 
                    stations={validStations} 
                    onStationClick={handleStationClick}
                    userPos={userPos}
                  />
                </div>
              </div>
              
              {/* Quick list below map */}
              <div className="nearby-stations-card">
                <div className="nearby-stations-header">
                  <h3 className="nearby-stations-title">
                    {userPos ? "Trạm sạc gần nhất" : "Trạm sạc"}
                  </h3>
                  <span className="stations-count">
                    {Math.min(5, processedStations.length)} / {processedStations.length} trạm
                  </span>
                </div>
                <div className="stations-quick-list">
                  {processedStations.slice(0, 5).map(station => (
                    <StationQuickItem 
                      key={station.id} 
                      station={station} 
                      onClick={() => handleStationClick(station)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {viewMode === 'list' && (
            <div className="list-view">
              {processedStations.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <i className="fas fa-search"></i>
                  </div>
                  <h3 className="empty-title">Không tìm thấy trạm sạc</h3>
                  <p className="empty-message">
                    Không có trạm sạc nào khớp với tiêu chí tìm kiếm của bạn.
                  </p>
                  <button onClick={resetFilters} className="btn btn-outline">
                    <i className="fas fa-filter"></i>
                    Xóa bộ lọc
                  </button>
                </div>
              ) : (
                <div className="stations-list">
                  {processedStations.map(station => (
                    <StationListItem 
                      key={station.id} 
                      station={station} 
                      onClick={() => handleStationClick(station)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {viewMode === 'grid' && (
            <div className="grid-view">
              {processedStations.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <i className="fas fa-search"></i>
                  </div>
                  <h3 className="empty-title">Không tìm thấy trạm sạc</h3>
                  <p className="empty-message">
                    Không có trạm sạc nào khớp với tiêu chí tìm kiếm của bạn.
                  </p>
                  <button onClick={resetFilters} className="btn btn-outline">
                    <i className="fas fa-filter"></i>
                    Xóa bộ lọc
                  </button>
                </div>
              ) : (
                <div className="stations-grid">
                  {processedStations.map(station => (
                    <StationGridItem 
                      key={station.id} 
                      station={station} 
                      onClick={() => handleStationClick(station)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Station Detail Popup */}
      {selectedStation && (
        <StationDetailPopup
          station={selectedStation}
          userPos={userPos}
          onClose={() => setSelectedStation(null)}
        />
      )}
    </div>
  );
}

// Component con: Station Quick Item (cho map view)
const StationQuickItem = ({ station, onClick }) => {
  return (
    <div className="station-quick-item" onClick={onClick}>
      <div className="station-quick-icon">
        <div className={`station-status-dot ${station.online ? 'status-online' : 'status-offline'}`}></div>
        <i className="fas fa-charging-station"></i>
      </div>
      <div className="station-quick-content">
        <h4 className="station-quick-name">{station.name || station.stationName}</h4>
        <p className="station-quick-address">{station.address}</p>
        <div className="station-quick-meta">
          <span className={`station-quick-status ${station.online ? 'online' : 'offline'}`}>
            {station.online ? 'Hoạt động' : 'Ngoại tuyến'}
          </span>
          {station.distance !== undefined && (
            <span className="station-quick-distance">{station.distance.toFixed(1)} km</span>
          )}
        </div>
      </div>
      <div className="station-quick-action">
        <i className="fas fa-chevron-right"></i>
      </div>
    </div>
  );
};

// Component con: Station List Item
const StationListItem = ({ station, onClick }) => {
  const connectors = Array.isArray(station.connectors) 
    ? station.connectors 
    : Object.values(station.connectors || {});
  
  return (
    <div className="station-list-item" onClick={onClick}>
      <div className="station-list-header">
        <div className="station-list-main">
          <div className="station-list-icon">
            <div className={`station-status-dot ${station.online ? 'status-online' : 'status-offline'}`}></div>
            <i className="fas fa-charging-station"></i>
          </div>
          <div className="station-list-info">
            <h3 className="station-list-name">{station.name || station.stationName}</h3>
            <p className="station-list-address">{station.address}</p>
          </div>
        </div>
        <div className="station-list-status">
          <span className={`status-badge ${station.online ? 'status-online' : 'status-offline'}`}>
            {station.online ? 'Hoạt động' : 'Ngoại tuyến'}
          </span>
          {station.distance !== undefined && (
            <span className="distance-badge">{station.distance.toFixed(1)} km</span>
          )}
        </div>
      </div>
      
      <div className="station-list-details">
        <div className="connector-info">
          <i className="fas fa-plug"></i>
          <span>{connectors.length} cổng sạc</span>
          {connectors.length > 0 && (
            <span className="connector-types">
              {connectors.map(c => c.type).filter((v, i, a) => a.indexOf(v) === i).join(', ')}
            </span>
          )}
        </div>
      </div>
      
      <div className="station-list-action">
        <i className="fas fa-chevron-right"></i>
      </div>
    </div>
  );
};

// Component con: Station Grid Item
const StationGridItem = ({ station, onClick }) => {
  const connectors = Array.isArray(station.connectors) 
    ? station.connectors 
    : Object.values(station.connectors || {});
  
  return (
    <div className="station-grid-item" onClick={onClick}>
      <div className="station-grid-header">
        <div className="station-grid-icon">
          <div className={`station-status-dot ${station.online ? 'status-online' : 'status-offline'}`}></div>
          <i className="fas fa-charging-station"></i>
        </div>
        <span className={`status-badge ${station.online ? 'status-online' : 'status-offline'}`}>
          {station.online ? 'Hoạt động' : 'Ngoại tuyến'}
        </span>
      </div>
      
      <div className="station-grid-content">
        <h3 className="station-grid-name">{station.name || station.stationName}</h3>
        <p className="station-grid-address">{station.address}</p>
        
        <div className="station-grid-meta">
          <div className="meta-item">
            <i className="fas fa-plug"></i>
            <span>{connectors.length} cổng</span>
          </div>
          {station.distance !== undefined && (
            <div className="meta-item">
              <i className="fas fa-map-marker-alt"></i>
              <span>{station.distance.toFixed(1)} km</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FindStation;