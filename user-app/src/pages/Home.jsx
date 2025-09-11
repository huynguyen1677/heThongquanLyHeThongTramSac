import React, { useState, useEffect, useMemo } from "react";
import "../styles/home-dashboard.css";
import StationMap from "../components/StationMap";
import { useCharging } from "../contexts/ChargingContext";
import StationDetailPopup from "../components/StationDetailPopup";
import { useAuth } from "../contexts/AuthContext";
import { countMonthlyCharges, totalMonthlyEnergy, calculateCO2Saved } from "../utils/chargingStats";
import useChargingHistory from "../contexts/useChargingHistory";
import { listenUserCharging } from "../services/realtime"; // Import hàm mới
import ChargingCompleteModal from "../components/ChargingCompleteModal";
import { es } from "date-fns/locale";
import { sortStationsByDistance } from "../utils/stationUtils";
import { formatEnergy } from "../utils/formatUtils";

function Home() {
  const { stations, stationsLoading: loading, stationsError: error, confirmationRequest, respondConfirmation } = useCharging();
  const { user } = useAuth();
  const userId = user?.userId || user?.uid;
  const { chargingHistory, loading: historyLoading } = useChargingHistory(userId);
  const [userPos, setUserPos] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [currentCharging, setCurrentCharging] = useState(null);
  const [previousCharging, setPreviousCharging] = useState(null); // Theo dõi phiên sạc trước đó
  const [showChargingComplete, setShowChargingComplete] = useState(false); // Hiển thị modal kết thúc
  const [completedSession, setCompletedSession] = useState(null); // Thông tin phiên sạc đã hoàn thành

  // Lắng nghe trạng thái sạc realtime cho userId hiện tại
  useEffect(() => {
    if (!userId) return;
    
    let previousSessionData = null;
    
    const unsubscribe = listenUserCharging(userId, (data) => {
      console.log('Received data from Firebase:', data);
      console.log('Previous session data:', previousSessionData);
      
      if (data && data.status === "Charging" && data.txId) {
        // Đang sạc
        console.log('Currently charging');
        
        // Tính thời gian sạc từ txId (timestamp)
        const startTime = parseInt(data.txId);
        const elapsed = Math.floor((Date.now() - startTime) / 1000); // giây
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        const chargingData = {
          isCharging: true,
          status: data.status,
          station: `${data.stationId} - Connector ${data.connectorId}`,
          stationId: data.stationId,
          connectorId: data.connectorId,
          power: data.W_now ? `${(data.W_now / 1000).toFixed(1)} kW` : "0.0 kW",
          time: timeString,
          battery: data.fullChargeThresholdKwh ? 
            Math.min(Math.round((data.currentEnergyKwh / data.fullChargeThresholdKwh) * 100), 100) : 0,
          progress: data.fullChargeThresholdKwh ? 
            Math.min(Math.round((data.currentEnergyKwh / data.fullChargeThresholdKwh) * 100), 100) : 0,
          currentEnergyKwh: data.currentEnergyKwh || 0,
          fullChargeThresholdKwh: data.fullChargeThresholdKwh || 0,
          session_cost: data.session_cost || 0,
          costEstimate: data.costEstimate || 0,
          estimatedCost: data.estimatedCost || 0,
          userId: data.userId,
          txId: data.txId,
          lastUpdate: data.lastUpdate,
          chargeProgress: data.chargeProgress || 0
        };

        // Lưu dữ liệu phiên sạc hiện tại
        previousSessionData = { ...chargingData };
        setCurrentCharging(chargingData);
      } 
      else {
        // Phiên sạc đã kết thúc
        console.log('Charging session ended');
        
        // Nếu trước đó có phiên sạc, hiển thị modal hoàn thành
        if (previousSessionData && previousSessionData.isCharging) {
          console.log('Showing completion modal for previous session:', previousSessionData);
          
          setCompletedSession({
            ...previousSessionData,
            endTime: new Date().toLocaleTimeString('vi-VN'),
            endDate: new Date().toLocaleDateString('vi-VN')
          });
          setShowChargingComplete(true);
          
          // Reset previous session data
          previousSessionData = null;
        }
        
        // Ẩn phần trạng thái sạc hiện tại
        setCurrentCharging(null);
      }
    });
    
    return () => {
      unsubscribe && unsubscribe();
      // Cleanup khi component unmount
      previousSessionData = null;
    };
  }, [userId]); // Chỉ phụ thuộc vào userId

  // Cập nhật thời gian sạc mỗi giây
  useEffect(() => {
    if (!currentCharging || !currentCharging.isCharging || !currentCharging.txId) {
      // Nếu không còn đang sạc, không tạo interval
      return;
    }

    const interval = setInterval(() => {
      // Kiểm tra lại currentCharging trong callback
      setCurrentCharging(prev => {
        if (!prev || !prev.isCharging || prev.status !== "Charging") {
          // Nếu không còn đang sạc, không cập nhật nữa
          return prev;
        }
        
        const startTime = parseInt(prev.txId);
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        return {
          ...prev,
          time: timeString
        };
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [currentCharging?.txId, currentCharging?.isCharging, currentCharging?.status]); // Thêm dependencies

  // Tính toán dữ liệu thống kê từ lịch sử sạc thực tế
  const monthlyCharges = countMonthlyCharges(chargingHistory);
  const totalKWh = totalMonthlyEnergy(chargingHistory);
  const co2Saved = calculateCO2Saved(totalKWh);

  const userData = {
    name: user?.displayName || user?.name || "Người dùng",
    walletBalance: user?.walletBalance !== undefined
    ? Math.floor(user.walletBalance).toLocaleString('vi-VN') + "₫"
    : "0₫",
    monthlyCharges: monthlyCharges,
    totalKWh: formatEnergy(totalKWh),
    co2Saved: co2Saved.toFixed(1) + " kg"
  };

  // Tính 3 trạm sạc gần nhất
  const nearestStations = useMemo(() => {
    if (!userPos || !stations || stations.length === 0) return [];
    
    // Lọc stations có tọa độ hợp lệ và đang hoạt động
    const validStations = stations.filter(
      s => typeof s.latitude === "number" && 
          typeof s.longitude === "number" &&
          s.online // Chỉ lấy trạm đang hoạt động
    );

    // Sắp xếp theo khoảng cách và lấy 3 trạm đầu tiên
    const sortedByDistance = sortStationsByDistance(validStations, userPos);
    return sortedByDistance.slice(0, 3);
  }, [stations, userPos]);

  // Lọc ra các trạm có đủ latitude và longitude
  const validStations = stations.filter(
    s => typeof s.latitude === "number" && typeof s.longitude === "number"
  );

  const handleViewStation = (stationId) => {
    const station = stations.find(s => s.id === stationId);
    if (station) {
      setSelectedStation(station);
    }
  };

  // Thêm useEffect để debug state changes
  useEffect(() => {
    console.log('showChargingComplete changed to:', showChargingComplete);
    console.log('completedSession:', completedSession);
  }, [showChargingComplete, completedSession]);

  const handleCloseChargingComplete = () => {
    console.log('Closing charging complete modal');
    setShowChargingComplete(false);
    setCompletedSession(null);
  };

  // Thêm useEffect này vào Home component, sau các useEffect hiện có:
  useEffect(() => {
    // Lấy vị trí người dùng
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserPos({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        (error) => {
          console.error("Geolocation error:", error);
          setUserPos(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    }
  }, []); // Chạy 1 lần khi component mount

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
              <p className="stat-label">Đã sạc tháng này</p>
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

      {/* Current Charging Status - CHỈ hiển thị khi có dữ liệu thực tế */}
      {currentCharging && 
      currentCharging.isCharging && 
      currentCharging.status === "Charging" && 
      currentCharging.currentEnergyKwh !== undefined && 
      currentCharging.fullChargeThresholdKwh > 0 && (
        <div className="charging-status-card">
          <div className="charging-background">
            <div className="charging-wave"></div>
            <div className="charging-wave charging-wave-2"></div>
          </div>
          
          <div className="charging-header">
            <div className="charging-header-left">
              <div className="charging-title-group">
                <h3 className="charging-title">
                  <i className="fas fa-bolt charging-bolt"></i>
                  Đang sạc xe điện
                </h3>
                <div className="realtime-badge">
                  <div className="realtime-dot"></div>
                  <span>Thời gian thực</span>
                </div>
              </div>
              <p className="charging-station">{currentCharging.station}</p>
            </div>
            
            <div className="charging-icon-large">
              <div className="charging-pulse"></div>
              <i className="fas fa-charging-station"></i>
            </div>
          </div>

          <div className="charging-main-content">
            <div className="charging-stats-modern">
              <div className="stat-item stat-power">
                <div className="stat-icon-wrapper">
                  <i className="fas fa-flash"></i>
                </div>
                <div className="stat-content">
                  <span className="stat-label">Công suất</span>
                  <span className="stat-value">{currentCharging.power}</span>
                </div>
              </div>

              <div className="stat-item stat-time">
                <div className="stat-icon-wrapper">
                  <i className="fas fa-clock"></i>
                </div>
                <div className="stat-content">
                  <span className="stat-label">Thời gian</span>
                  <span className="stat-value">{currentCharging.time}</span>
                </div>
              </div>

              <div className="stat-item stat-progress">
                <div className="stat-icon-wrapper">
                  <i className="fas fa-battery-half"></i>
                </div>
                <div className="stat-content">
                  <span className="stat-label">Tiến độ</span>
                  <span className="stat-value">{currentCharging.progress}%</span>
                </div>
              </div>
            </div>

            <div className="energy-display">
              <div className="energy-circle">
                <svg className="progress-ring" width="120" height="120" viewBox="0 0 120 120">
                  <circle
                    className="progress-ring-background"
                    stroke="#e2e8f0"
                    strokeWidth="8"
                    fill="transparent"
                    r="52"
                    cx="60"
                    cy="60"
                  />
                  <circle
                    className="progress-ring-fill"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    fill="transparent"
                    r="52"
                    cx="60"
                    cy="60"
                    strokeDasharray={`${2 * Math.PI * 52}`}
                    strokeDashoffset={`${2 * Math.PI * 52 * (1 - currentCharging.progress / 100)}`}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="energy-text">
                  <span className="energy-percentage">{currentCharging.progress}%</span>
                  <span className="energy-label">Hoàn thành</span>
                </div>
              </div>
            </div>
          </div>

          <div className="charging-details-modern">
            <div className="detail-card">
              <div className="detail-icon">
                <i className="fas fa-bolt"></i>
              </div>
              <div className="detail-content">
                <span className="detail-label">Năng lượng đã sạc</span>
                <span className="detail-value">
                  {currentCharging.currentEnergyKwh.toFixed(2)} / {currentCharging.fullChargeThresholdKwh} kWh
                </span>
              </div>
            </div>

            <div className="detail-card">
              <div className="detail-icon">
                <i className="fas fa-money-bill-wave"></i>
              </div>
              <div className="detail-content">
                <span className="detail-label">Chi phí hiện tại</span>
                <span className="detail-value">{currentCharging.estimatedCost.toLocaleString('vi-VN')}₫</span>
              </div>
            </div>
          </div>

          <div className="charging-progress-modern">
            <div className="progress-header-modern">
              <span className="progress-title">Tiến độ sạc pin</span>
              <span className="progress-percentage">{currentCharging.progress}%</span>
            </div>
            <div className="progress-bar-modern">
              <div 
                className="progress-fill-modern" 
                style={{ 
                  width: `${currentCharging.progress}%`,
                }}
              >
                <div className="progress-glow"></div>
              </div>
            </div>
            <div className="progress-labels">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      )}

      {/* 3 Trạm sạc gần nhất */}
      {nearestStations.length > 0 && (
        <div className="nearest-stations-section">
          <div className="section-header">
            <h3 className="section-title">
              <i className="fas fa-map-marker-alt"></i>
              Trạm sạc gần nhất
            </h3>
            <button 
              className="view-all-btn"
              onClick={() => window.location.href = '/stations'}
            >
              Xem tất cả
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
          
          <div className="nearest-stations-grid">
            {nearestStations.map((station, index) => (
              <div 
                key={station.id || station.stationId} 
                className="nearest-station-card"
                onClick={() => setSelectedStation(station)}
              >
                <div className="station-rank">#{index + 1}</div>
                
                <div className="station-info">
                  <div className="station-header">
                    <div className="station-icon">
                      <div className={`status-dot ${station.online ? 'online' : 'offline'}`}></div>
                      <i className="fas fa-charging-station"></i>
                    </div>
                    <div className="station-details">
                      <h4 className="station-name">
                        {station.name || station.stationName || 'Trạm sạc'}
                      </h4>
                      <p className="station-distance">
                        <i className="fas fa-route"></i>
                        {station.distance ? `${station.distance.toFixed(1)} km` : 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  <p className="station-address">
                    <i className="fas fa-map-pin"></i>
                    {station.address || 'Địa chỉ không xác định'}
                  </p>
                  
                  <div className="station-meta">
                    <span className={`status-badge ${station.online ? 'online' : 'offline'}`}>
                      <i className={`fas ${station.online ? 'fa-power-off' : 'fa-exclamation-triangle'}`}></i>
                      {station.online ? 'Hoạt động' : 'Ngoại tuyến'}
                    </span>
                    
                    <span className="connectors-count">
                      <i className="fas fa-plug"></i>
                      {Array.isArray(station.connectors) 
                        ? station.connectors.length 
                        : Object.keys(station.connectors || {}).length
                      } cổng
                    </span>
                  </div>
                </div>
                
                <div className="station-action">
                  <button className="direction-btn">
                    <i className="fas fa-directions"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Thông báo nếu chưa có vị trí */}
          {!userPos && (
            <div className="location-prompt">
              <div className="location-prompt-icon">
                <i className="fas fa-map-marker-alt"></i>
              </div>
              <div className="location-prompt-content">
                <h4>Cho phép truy cập vị trí</h4>
                <p>Để hiển thị trạm sạc gần nhất, vui lòng cho phép ứng dụng truy cập vị trí của bạn.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Map Section */}
      <div className="map-section">
        <div className="map-header">
          <h3 className="map-title">Bản đồ trạm sạc</h3>
        </div>
        <div className="map-container">
          <StationMap 
          stations={validStations}
          onStationClick={setSelectedStation}
          userPos={userPos}
           />
        </div>
      </div>

      {/* Station Detail Popup */}
      {selectedStation && (
        <StationDetailPopup
          station={selectedStation}
          userPos={userPos}
          onClose={() => setSelectedStation(null)}
        />
      )}

      {/* Charging Complete Modal */}
      <ChargingCompleteModal
        session={completedSession}
        open={showChargingComplete}
        onClose={handleCloseChargingComplete}
      />
    </div>
  );
}

export default Home;