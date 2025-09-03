import React, { useState, useEffect } from "react";
import "../styles/home-dashboard.css";
import StationMap from "../components/StationMap";
import { useCharging } from "../contexts/ChargingContext";
import StationDetailPopup from "../components/StationDetailPopup";
import { useAuth } from "../contexts/AuthContext";
import { countMonthlyCharges, totalMonthlyEnergy, calculateCO2Saved } from "../utils/chargingStats";
import useChargingHistory from "../contexts/useChargingHistory";
import { listenUserCharging } from "../services/realtime"; // Import hàm mới
import ChargingCompleteModal from "../components/ChargingCompleteModal";

function Home() {
  const { stations, stationsLoading: loading, stationsError: error, confirmationRequest, respondConfirmation } = useCharging();
  const { user } = useAuth();
  const userId = user?.userId || user?.uid;
  const { chargingHistory, loading: historyLoading } = useChargingHistory(userId);

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
    if (!currentCharging || !currentCharging.isCharging || !currentCharging.txId) return;

    const interval = setInterval(() => {
      const startTime = parseInt(currentCharging.txId);
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      
      setCurrentCharging(prev => {
        if (!prev || !prev.isCharging) return prev;
        return {
          ...prev,
          time: timeString
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentCharging?.txId]); // Chỉ phụ thuộc vào txId

  // Tính toán dữ liệu thống kê từ lịch sử sạc thực tế
  const monthlyCharges = countMonthlyCharges(chargingHistory);
  const totalKWh = totalMonthlyEnergy(chargingHistory);
  const co2Saved = calculateCO2Saved(totalKWh);

  const userData = {
    name: user?.displayName || user?.name || "Người dùng",
    walletBalance: user?.walletBalance?.toLocaleString('vi-VN') + "₫" || "0₫",
    monthlyCharges: monthlyCharges,
    totalKWh: totalKWh.toFixed(1) + " kWh",
    co2Saved: co2Saved.toFixed(1) + " kg"
  };

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

      {/* Current Charging Status - CHỈ hiển thị khi có dữ liệu thực tế */}
      {currentCharging && 
       currentCharging.isCharging && 
       currentCharging.status === "Charging" && 
       currentCharging.currentEnergyKwh !== undefined && 
       currentCharging.fullChargeThresholdKwh > 0 && (
        <div className="charging-card">
          <div className="charging-content">
            <div className="charging-info">
              <h3 className="charging-title">
                Trạng thái sạc hiện tại
                <span className="realtime-indicator">
                  <i className="fas fa-circle" style={{color: '#4CAF50', fontSize: '8px'}}></i>
                  REALTIME
                </span>
              </h3>
              <p className="charging-station">Trạm sạc: {currentCharging.station}</p>
              <div className="charging-stats">
                <div className="charging-stat">
                  <p className="charging-stat-label">Công suất</p>
                  <p className="charging-stat-value">{currentCharging.power}</p>
                </div>
                <div className="charging-stat">
                  <p className="charging-stat-label">Thời gian sạc</p>
                  <p className="charging-stat-value">{currentCharging.time}</p>
                </div>
                <div className="charging-stat">
                  <p className="charging-stat-label">Tiến độ</p>
                  <p className="charging-stat-value">{currentCharging.progress}%</p>
                </div>
              </div>
              
              {/* Thông tin chi tiết */}
              <div className="charging-details">
                <div className="detail-row">
                  <span className="detail-label">Đã sạc:</span>
                  <span className="detail-value">
                    {currentCharging.currentEnergyKwh.toFixed(2)} / {currentCharging.fullChargeThresholdKwh} kWh
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Chi phí thực tế:</span>
                  <span className="detail-value">{currentCharging.session_cost.toLocaleString('vi-VN')}₫</span>
                </div>
              </div>
            </div>
            
            <div className="charging-icon-only">
              <i className="fas fa-charging-station"></i>
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
                style={{ 
                  width: `${currentCharging.progress}%`,
                  backgroundColor: '#4CAF50',
                  transition: 'width 0.3s ease'
                }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Map Section */}
      <div className="map-section">
        <div className="map-header">
          <h3 className="map-title">Bản đồ trạm sạc</h3>
        </div>
        <div className="map-container">
          <StationMap stations={validStations} onStationClick={setSelectedStation} />
        </div>
      </div>

      {/* Station Detail Popup */}
      {selectedStation && (
        <StationDetailPopup
          station={selectedStation}
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