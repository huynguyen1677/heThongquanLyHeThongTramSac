import React, { useState } from "react";
import "../styles/home-dashboard.css";
import StationMap from "../components/StationMap";
import { useCharging } from "../contexts/ChargingContext";
import StationDetailPopup from "../components/StationDetailPopup";
import { useAuth } from "../contexts/AuthContext";
import { countMonthlyCharges, totalMonthlyEnergy, calculateCO2Saved } from "../utils/chargingStats";
import useChargingHistory from "../contexts/useChargingHistory";

function Home() {
  const { stations, stationsLoading: loading, stationsError: error, confirmationRequest, respondConfirmation } = useCharging();
  const { user } = useAuth();
  const userId = user?.userId || user?.uid; // tuỳ bạn lưu userId là gì
  const { chargingHistory, loading: historyLoading } = useChargingHistory(userId);

  const [selectedStation, setSelectedStation] = useState(null);
  const [currentCharging, setCurrentCharging] = useState({
    isCharging: true,
    station: "Vincom Landmark 81 - Cổng A2",
    power: "22 kW",
    time: "45:32",
    battery: 78,
    progress: 78
  });

  const monthlyCharges = countMonthlyCharges(chargingHistory);
  const totalKWh = totalMonthlyEnergy(chargingHistory);
  const co2Saved = calculateCO2Saved(totalKWh);

  const userData = {
    name: user?.name || "Người dùng",
    walletBalance: user?.walletBalance?.toLocaleString() + "₫" || "0₫",
    monthlyCharges: monthlyCharges,
    totalKWh: totalKWh, // hoặc giữ nguyên số thập phân nếu muốn
    co2Saved: `${co2Saved} kg`,
  };

  // Lọc ra các trạm có đủ latitude và longitude
  const validStations = stations.filter(
    s => typeof s.latitude === "number" && typeof s.longitude === "number"
  );

  // Thay thế recentActivities bằng nearbyStations
  const nearbyStations = validStations.slice(0, 5).map(station => ({
    id: station.id,
    name: station.stationName || station.name || `Trạm ${station.id}`,
    address: station.address || "Chưa cập nhật địa chỉ",
    distance: `${(Math.random() * 5 + 0.5).toFixed(1)} km`, // Mock distance
    status: station.status || (station.online ? 'Available' : 'Offline'),
    connectorCount: Array.isArray(station.connectors) 
      ? station.connectors.length 
      : Object.keys(station.connectors || {}).length,
    vendor: station.vendor || "Unknown",
    statusColor: station.online ? 'green' : 'red',
    icon: station.online ? 'fa-charging-station' : 'fa-exclamation-triangle'
  }));

  const handleStopCharging = () => {
    setCurrentCharging(prev => ({ ...prev, isCharging: false }));
    alert('Đã dừng sạc xe!');
  };

  const handleViewStation = (stationId) => {
    const station = stations.find(s => s.id === stationId);
    if (station) {
      setSelectedStation(station);
    }
  };

  // Simulate charging request after 3 seconds
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (!currentCharging.isCharging) {
        setShowChargingDialog(true);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [currentCharging.isCharging]);

  // Simulate real-time updates
  React.useEffect(() => {
    if (!currentCharging.isCharging) return;

    const interval = setInterval(() => {
      setCurrentCharging(prev => {
        const [minutes, seconds] = prev.time.split(':').map(Number);
        let newSeconds = seconds + 1;
        let newMinutes = minutes;
        
        if (newSeconds >= 60) {
          newSeconds = 0;
          newMinutes += 1;
        }
        
        return {
          ...prev,
          time: `${newMinutes}:${newSeconds.toString().padStart(2, '0')}`
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentCharging.isCharging]);

  return (
    <div className="dashboard-container">
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-info">
              <p className="stat-label">Số dư ví</p>
              <p className="stat-value">{userData.walletBalance}</p>
            </div>
            <div className="stat-icon icon-bg-green">
              <i className="fas fa-wallet"></i>
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-info">
              <p className="stat-label">Lần sạc tháng này</p>
              <p className="stat-value">{userData.monthlyCharges}</p>
            </div>
            <div className="stat-icon icon-bg-blue">
              <i className="fas fa-charging-station"></i>
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-info">
              <p className="stat-label">Tổng kWh đã sạc</p>
              <p className="stat-value">{userData.totalKWh}</p>
            </div>
            <div className="stat-icon icon-bg-orange">
              <i className="fas fa-bolt"></i>
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-info">
              <p className="stat-label">Tiết kiệm CO₂</p>
              <p className="stat-value">{userData.co2Saved}</p>
            </div>
            <div className="stat-icon icon-bg-teal">
              <i className="fas fa-leaf"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Current Charging Status */}
      {currentCharging.isCharging && (
        <div className="charging-card">
          <div className="charging-content">
            <div className="charging-info">
              <h3 className="charging-title">Trạng thái sạc hiện tại</h3>
              <p className="charging-station">Trạm sạc: {currentCharging.station}</p>
              
              <div className="charging-stats">
                <div className="charging-stat">
                  <p className="charging-stat-label">Công suất</p>
                  <p className="charging-stat-value">{currentCharging.power}</p>
                </div>
                <div className="charging-stat">
                  <p className="charging-stat-label">Thời gian</p>
                  <p className="charging-stat-value">{currentCharging.time}</p>
                </div>
                <div className="charging-stat">
                  <p className="charging-stat-label">Pin hiện tại</p>
                  <p className="charging-stat-value">{currentCharging.battery}%</p>
                </div>
              </div>
            </div>
            
            <div className="charging-controls">
              <div className="charging-icon">
                <i className="fas fa-charging-station"></i>
              </div>
              <button className="btn-stop-charging" onClick={handleStopCharging}>
                Dừng sạc
              </button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="charging-progress">
            <div className="progress-header">
              <span>Tiến độ sạc</span>
              <span>{currentCharging.progress}% / 100%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${currentCharging.progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Nearby Stations - thay thế Recent Activity */}
      <div className="nearby-stations-card">
        <div className="nearby-stations-header">
          <h3 className="nearby-stations-title">Trạm sạc gần đây</h3>
          <span className="stations-count">{nearbyStations.length} trạm</span>
        </div>
        
        <div className="nearby-stations-list">
          {nearbyStations.map(station => (
            <div key={station.id} className="station-item" onClick={() => handleViewStation(station.id)}>
              <div className="station-item-icon">
                <div className={`station-status-dot status-${station.statusColor}`}></div>
                <i className={`fas ${station.icon}`}></i>
              </div>
              <div className="station-item-content">
                <div className="station-item-header">
                  <h4 className="station-item-name">{station.name}</h4>
                  <span className="station-item-distance">{station.distance}</span>
                </div>
                <p className="station-item-address">{station.address}</p>
                <div className="station-item-meta">
                  <span className={`station-status status-${station.statusColor}`}>
                    {station.status}
                  </span>
                  <span className="station-connectors">
                    {station.connectorCount} cổng sạc
                  </span>
                  <span className="station-vendor">{station.vendor}</span>
                </div>
              </div>
              <div className="station-item-action">
                <i className="fas fa-chevron-right"></i>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Map Section - giữ nguyên */}
      <div className="map-section">
        <div className="map-header">
          <h3 className="map-title">Bản đồ trạm sạc</h3>
        </div>
        <div className="map-container">
          <StationMap stations={validStations} onStationClick={setSelectedStation} />
        </div>
      </div>

      {/* Station Detail Popup - giữ nguyên */}
      {selectedStation && (
        <StationDetailPopup
          station={selectedStation}
          onClose={() => setSelectedStation(null)}
        />
      )}
    </div>
  );
}

export default Home;