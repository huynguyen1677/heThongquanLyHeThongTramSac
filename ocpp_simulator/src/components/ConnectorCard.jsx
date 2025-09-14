import { useState, useEffect } from 'react';
import ErrorModal from './ErrorModal';
import './ConnectorCard.css';

const INITIAL_STATS = {
  transactionId: null,
  currentMeterValue: 0,
  energyKwh: 0,
  powerKw: 0,
  duration: '00:00:00',
  estimatedCost: 0,
  isRunning: false,
  fullChargeThresholdKwh: 37.23, // VF5 Plus mặc định
  pricePerKwh: 0,
  idTag: null
};

// Cấu hình xe VinFast
// Cấu hình xe VinFast
const VINFAST_CARS = {
  VF5: { name: 'VF5 Plus', batteryCapacity: 37.23, fastCharging: 30, normalCharging: 22 },
  VFe34: { name: 'VF e34', batteryCapacity: 42, fastCharging: 30, normalCharging: 22 },
  VF6: { name: 'VF6', batteryCapacity: 59.6, fastCharging: 30, normalCharging: 22 },
  VF7: { name: 'VF7 Plus', batteryCapacity: 75.3, fastCharging: 30, normalCharging: 22 },
  VF8: { name: 'VF8', batteryCapacity: 88.8, fastCharging: 30, normalCharging: 22 }
};

const ConnectorCard = ({
  connectorId,
  status,
  transactionId,
  meterService,
  onLocalStart,
  onLocalStop,
  onStatusChange,
  isConnected,
  performSafetyCheck,
  disabled = false
}) => {
  const [powerKw, setPowerKw] = useState(22); // Sạc thường mặc định
  const [stats, setStats] = useState(INITIAL_STATS);
  const [selectedCar, setSelectedCar] = useState('VF5'); // Xe mặc định

  // Error modal state
  const [errorModal, setErrorModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'error'
  });

  // Safety check state
  const [safetyCheck, setSafetyCheck] = useState({
    parked: false,
    plugged: false,
    confirmed: false,
    confirmationCode: ''
  });

  // Update stats from meter service
  useEffect(() => {
    let interval = null;

    // Kiểm tra meterService tồn tại và có method getChargingStats
    if (meterService && typeof meterService.getChargingStats === 'function') {
      try {
        const newStats = meterService.getChargingStats();
        if (newStats && typeof newStats === 'object') {
          setStats(prevStats => ({ ...INITIAL_STATS, ...prevStats, ...newStats }));
        }
      } catch (error) {
        console.warn(`⚠️ [ConnectorCard-${connectorId}] Error getting initial charging stats:`, error);
        setStats(INITIAL_STATS);
      }
    }

    // Set up interval for charging status
    if (status === 'Charging' && meterService?.isActive()) {
      interval = setInterval(() => {
        try {
          if (meterService && 
              typeof meterService.getChargingStats === 'function' && 
              meterService.isActive()) {
            const newStats = meterService.getChargingStats();
            if (newStats && typeof newStats === 'object') {
              setStats(prevStats => ({ ...prevStats, ...newStats }));
            }
          }
        } catch (error) {
          console.warn(`⚠️ [ConnectorCard-${connectorId}] Error updating charging stats:`, error);
          // Clear interval on error to prevent repeated errors
          if (interval) {
            clearInterval(interval);
            interval = null;
          }
        }
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [status, meterService, connectorId]);

  // Reset stats when no transaction
  useEffect(() => {
    if (!transactionId) {
      setStats(INITIAL_STATS);
    }
  }, [transactionId]);

  // Safety check completion effect
  useEffect(() => {
    if (
      safetyCheck.parked &&
      safetyCheck.plugged &&
      safetyCheck.confirmed &&
      status === 'Available' &&
      isConnected &&
      typeof performSafetyCheck === 'function'
    ) {
      try {
        performSafetyCheck(connectorId, safetyCheck);
      } catch (error) {
        console.error(`❌ [ConnectorCard-${connectorId}] Safety check error:`, error);
      }
    }
  }, [safetyCheck, status, performSafetyCheck, connectorId, isConnected]);

  // Helper functions for button states
  const canStop = () => {
    return status === 'Charging' && transactionId && isConnected && !disabled;
  };

  const canSuspend = () => {
    return status === 'Charging' && transactionId && isConnected && !disabled;
  };

  const canResume = () => {
    return (status === 'SuspendedEV' || status === 'SuspendedEVSE') && 
           transactionId && isConnected && !disabled;
  };

  const canDisconnectCable = () => {
    return (status === 'Charging' || status === 'SuspendedEV' || status === 'SuspendedEVSE') && 
           transactionId && isConnected && !disabled;
  };

  const canStartCharging = () => {
    return status === 'Preparing' && 
           safetyCheck.confirmationCode.length === 6 && 
           isConnected && !disabled;
  };

  // Event handlers
  const handleLocalStart = async () => {
    // Validation
    if (!canStartCharging()) {
      return;
    }

    if (!safetyCheck.confirmationCode || safetyCheck.confirmationCode.length !== 6) {
      setErrorModal({
        isOpen: true,
        title: 'Thông tin thiếu',
        message: 'Vui lòng nhập User ID (6 số) trước khi bắt đầu sạc!',
        type: 'warning'
      });
      return;
    }

    try {
      console.log(`🚀 [ConnectorCard-${connectorId}] Starting charging with User ID: ${safetyCheck.confirmationCode}`);
      
      await onLocalStart(connectorId, powerKw, safetyCheck.confirmationCode);
      
      console.log(`✅ [ConnectorCard-${connectorId}] Charging request sent successfully`);
    } catch (error) {
      console.error(`❌ [ConnectorCard-${connectorId}] Error starting charge:`, error);
      
      // Hiển thị modal lỗi chi tiết
      const errorMessage = error.message || 'Lỗi không xác định';
      
      if (errorMessage.includes('Số dư không đủ')) {
        // Modal đặc biệt cho lỗi số dư
        setErrorModal({
          isOpen: true,
          title: 'Số dư không đủ',
          message: errorMessage,
          type: 'insufficient-balance'
        });
      } else if (errorMessage.includes('Thẻ bị chặn')) {
        // Modal cho lỗi thẻ bị chặn
        setErrorModal({
          isOpen: true,
          title: 'Thẻ bị chặn',
          message: `${errorMessage}\n\nVui lòng liên hệ hỗ trợ để kiểm tra tài khoản.`,
          type: 'blocked'
        });
      } else if (errorMessage.includes('Thẻ không hợp lệ')) {
        // Modal cho lỗi thẻ không hợp lệ
        setErrorModal({
          isOpen: true,
          title: 'Thẻ không hợp lệ',
          message: `${errorMessage}\n\nVui lòng kiểm tra lại User ID.`,
          type: 'invalid'
        });
      } else {
        // Modal chung cho các lỗi khác
        setErrorModal({
          isOpen: true,
          title: 'Lỗi khi bắt đầu sạc',
          message: `${errorMessage}\n\nVui lòng thử lại hoặc liên hệ hỗ trợ.`,
          type: 'error'
        });
      }
    }
  };

  const handleLocalStop = async () => {
    if (!canStop()) {
      return;
    }

    try {
      console.log(`⏹️ [ConnectorCard-${connectorId}] Stopping charging`);
      
      // Clear stats immediately to prevent race conditions
      setStats({ ...INITIAL_STATS });
      
      await onLocalStop(connectorId);
      console.log(`✅ [ConnectorCard-${connectorId}] Charging stopped successfully`);
    } catch (error) {
      console.error(`❌ [ConnectorCard-${connectorId}] Error stopping charge:`, error);
      alert(`Lỗi khi dừng sạc: ${error.message}`);
    }
  };

  const handleSuspendEV = async () => {
    if (!canSuspend()) return;

    try {
      console.log(`🚗 [ConnectorCard-${connectorId}] Suspending charging due to EV request`);
      await onStatusChange(connectorId, 'SuspendedEV');
    } catch (error) {
      console.error(`❌ [ConnectorCard-${connectorId}] Error suspending (EV):`, error);
      alert(`Lỗi khi tạm dừng sạc (EV): ${error.message}`);
    }
  };

  const handleSuspendEVSE = async () => {
    if (!canSuspend()) return;

    try {
      console.log(`⚡ [ConnectorCard-${connectorId}] Suspending charging due to EVSE limit`);
      await onStatusChange(connectorId, 'SuspendedEVSE');
    } catch (error) {
      console.error(`❌ [ConnectorCard-${connectorId}] Error suspending (EVSE):`, error);
      alert(`Lỗi khi tạm dừng sạc (EVSE): ${error.message}`);
    }
  };

  const handleResumeCharging = async () => {
    if (!canResume()) return;

    try {
      console.log(`🔄 [ConnectorCard-${connectorId}] Resuming charging`);
      await onStatusChange(connectorId, 'Charging');
    } catch (error) {
      console.error(`❌ [ConnectorCard-${connectorId}] Error resuming:`, error);
      alert(`Lỗi khi tiếp tục sạc: ${error.message}`);
    }
  };

  const handleCableDisconnect = async () => {
    if (!canDisconnectCable()) return;

    try {
      console.log(`🔌 [ConnectorCard-${connectorId}] Cable disconnected, finishing transaction`);
      
      await onStatusChange(connectorId, 'Finishing');
      
      // Delay to simulate finishing process
      setTimeout(async () => {
        try {
          // Clear stats before stopping to prevent race conditions
          setStats({ ...INITIAL_STATS });
          await onLocalStop(connectorId);
          console.log(`✅ [ConnectorCard-${connectorId}] Transaction finished successfully`);
        } catch (error) {
          console.error(`❌ [ConnectorCard-${connectorId}] Error finishing transaction:`, error);
        }
      }, 2000);
    } catch (error) {
      console.error(`❌ [ConnectorCard-${connectorId}] Error disconnecting cable:`, error);
      alert(`Lỗi khi rút cáp: ${error.message}`);
    }
  };

  const handlePowerChange = (newPower) => {
    const validPower = Math.max(3.5, Math.min(30, newPower)); // Tăng max lên 30kW
    setPowerKw(validPower);
    
    if (meterService && typeof meterService.setPower === 'function' && meterService.isActive()) {
      try {
        meterService.setPower(validPower);
        console.log(`⚡ [ConnectorCard-${connectorId}] Power updated to ${validPower}kW`);
      } catch (error) {
        console.warn(`⚠️ [ConnectorCard-${connectorId}] Error setting power:`, error);
      }
    }
  };

  const handleCarSelection = (carType) => {
    const car = VINFAST_CARS[carType];
    if (car) {
      setSelectedCar(carType);
      
      // Cập nhật ngưỡng sạc đầy theo dung lượng pin xe
      setStats(prev => ({
        ...prev,
        fullChargeThresholdKwh: car.batteryCapacity
      }));
      
      // Cập nhật meter service nếu có
      if (meterService && typeof meterService.setFullChargeThreshold === 'function') {
        try {
          meterService.setFullChargeThreshold(car.batteryCapacity);
          console.log(`🚗 [ConnectorCard-${connectorId}] Selected ${car.name} - Battery: ${car.batteryCapacity}kWh`);
        } catch (error) {
          console.warn(`⚠️ [ConnectorCard-${connectorId}] Error setting charge threshold:`, error);
        }
      }
    }
  };

  const handleStatusAction = async (newStatus) => {
    if (!isConnected || disabled) return;

    try {
      // Reset safety check when returning to Available
      if (newStatus === 'Available') {
        setSafetyCheck({
          parked: false,
          plugged: false,
          confirmationCode: '',
          confirmed: false
        });
      }
      
      console.log(`🔧 [ConnectorCard-${connectorId}] Changing status to ${newStatus}`);
      await onStatusChange(connectorId, newStatus);
    } catch (error) {
      console.error(`❌ [ConnectorCard-${connectorId}] Error changing status:`, error);
      alert(`Lỗi khi thay đổi trạng thái: ${error.message}`);
    }
  };

  const updatePrice = async () => {
    if (!meterService || !isConnected || disabled) return;

    try {
      console.log(`💲 [ConnectorCard-${connectorId}] Updating price from API...`);
      const apiUrl = 'http://localhost:3000/api/settings/price-per-kwh';
      const newPrice = await meterService.updatePriceFromApi(apiUrl);
      
      if (newPrice) {
        const newStats = meterService.getChargingStats();
        if (newStats) {
          setStats(prevStats => ({ ...prevStats, ...newStats }));
        }
        console.log(`✅ [ConnectorCard-${connectorId}] Price updated to ${newPrice} VND/kWh`);
      } else {
        console.warn(`⚠️ [ConnectorCard-${connectorId}] Failed to update price from API`);
      }
    } catch (error) {
      console.error(`❌ [ConnectorCard-${connectorId}] Error updating price:`, error);
    }
  };

  const getStatusBadge = () => {
    const statusConfig = {
      'Available': { color: 'green', emoji: '🟢', text: 'Sẵn sàng' },
      'Preparing': { color: 'yellow', emoji: '🟡', text: 'Chuẩn bị' },
      'Charging': { color: 'blue', emoji: '🔵', text: 'Đang sạc' },
      'SuspendedEV': { color: 'purple', emoji: '🟣', text: 'Xe tạm dừng' },
      'SuspendedEVSE': { color: 'orange', emoji: '🟠', text: 'Trạm tạm dừng' },
      'Finishing': { color: 'orange', emoji: '🟠', text: 'Kết thúc' },
      'Unavailable': { color: 'gray', emoji: '⚫', text: 'Không khả dụng' },
      'Faulted': { color: 'red', emoji: '🔴', text: 'Lỗi' },
      'FullyCharged': { color: 'teal', emoji: '✅', text: 'Sạc đầy' },
      'Chưa kết nối': { color: 'gray', emoji: '⚪', text: 'Chưa kết nối' }
    };

    const config = statusConfig[status] || statusConfig['Available'];
    return (
      <span className={`status-badge ${config.color}`}>
        {config.emoji} {config.text}
      </span>
    );
  };

  return (
    <div className={`connector-card ${disabled ? 'disabled' : ''}`}>
      <div className="connector-header">
        <h3>Connector {connectorId}</h3>
        {getStatusBadge()}
      </div>

      {/* Safety Check Section - Only when Available and connected */}
      {status === 'Available' && isConnected && !disabled && (
        <div className="safety-check-section">
          <h4>Kiểm tra an toàn trước khi sạc</h4>
          <button 
            onClick={() => setSafetyCheck(s => ({ ...s, parked: !s.parked }))}
            className={safetyCheck.parked ? 'checked' : ''}
          >
            {safetyCheck.parked ? '✅' : '⬜'} Xe đã đỗ đúng vị trí
          </button>
          <button 
            onClick={() => setSafetyCheck(s => ({ ...s, plugged: !s.plugged }))}
            className={safetyCheck.plugged ? 'checked' : ''}
          >
            {safetyCheck.plugged ? '✅' : '⬜'} Cáp sạc đã được cắm
          </button>
          <button 
            onClick={() => setSafetyCheck(s => ({ ...s, confirmed: !s.confirmed }))}
            className={safetyCheck.confirmed ? 'checked' : ''}
          >
            {safetyCheck.confirmed ? '✅' : '⬜'} Người dùng xác nhận sẵn sàng
          </button>
          <div className="safety-status">
            {safetyCheck.parked && safetyCheck.plugged && safetyCheck.confirmed
              ? <span style={{color: 'green'}}>Đã hoàn thành kiểm tra an toàn!</span>
              : <span style={{color: 'orange'}}>Vui lòng hoàn thành tất cả kiểm tra an toàn</span>
            }
          </div>
        </div>
      )}

      {/* Full charge notice */}
      {status === 'FullyCharged' && (
        <div className="full-charged-notice">
          <span role="img" aria-label="full">🔋</span>
          <b>Xe {VINFAST_CARS[selectedCar].name} đã sạc đầy!</b>
        </div>
      )}

      {/* ID Tag Input Section */}
      {isConnected && !disabled && (
        <div className="id-tag-section">
          <h4>Nhập ID Tag (User ID)</h4>
          <div className="id-tag-input">
            <input
              type="text"
              placeholder="Nhập User ID (6 số)"
              value={safetyCheck.confirmationCode}
              onChange={e =>
                setSafetyCheck(s => ({
                  ...s,
                  confirmationCode: e.target.value.replace(/\D/g, '').slice(0, 6)
                }))
              }
              disabled={status !== 'Preparing'}
              maxLength={6}
            />
          </div>
        </div>
      )}

      {/* Control Section */}
      {isConnected && !disabled && (
        <div className="control-section">
          {/* Car Selection Section */}
          <div className="car-selection">
            <h4>🚗 Chọn loại xe VinFast</h4>
            <div className="car-buttons">
              {Object.entries(VINFAST_CARS).map(([key, car]) => (
                <button
                  key={key}
                  className={`btn btn-small ${selectedCar === key ? 'btn-success' : 'btn-secondary'}`}
                  onClick={() => handleCarSelection(key)}
                  disabled={status === 'Charging'}
                  style={{ margin: '2px' }}
                >
                  {car.name} ({car.batteryCapacity}kWh)
                </button>
              ))}
            </div>
            <p className="car-info">
              Xe được chọn: <strong>{VINFAST_CARS[selectedCar].name}</strong> - 
              Dung lượng pin: <strong>{VINFAST_CARS[selectedCar].batteryCapacity} kWh</strong>
            </p>
          </div>
          
          <div className="power-control">
            <label>Công suất sạc (kW):</label>
            <input
              type="number"
              value={powerKw}
              onChange={(e) => handlePowerChange(parseFloat(e.target.value) || 3.5)}
              min="3.5"
              max="30"
              step="0.5"
              disabled={status === 'Charging'}
            />
            <button
              className="btn btn-small"
              onClick={() => handlePowerChange(VINFAST_CARS[selectedCar].normalCharging)}
              disabled={status === 'Charging'}
              style={{ marginLeft: 8 }}
            >
              Sạc thường ({VINFAST_CARS[selectedCar].normalCharging}kW)
            </button>
            <button
              className="btn btn-small"
              onClick={() => handlePowerChange(VINFAST_CARS[selectedCar].fastCharging)}
              disabled={status === 'Charging'}
              style={{ marginLeft: 4 }}
            >
              Sạc nhanh ({VINFAST_CARS[selectedCar].fastCharging}kW)
            </button>
          </div>
          
          <div className="info-item">
            <label>Giá điện:</label>
            <span>
              {(stats.pricePerKwh !== undefined && stats.pricePerKwh !== null)
                ? stats.pricePerKwh.toLocaleString('vi-VN', { maximumFractionDigits: 1 })
                : 'N/A'} ₫/kWh
            </span>
            <button
              className="btn btn-small"
              onClick={updatePrice}
              disabled={!meterService}
              style={{ marginLeft: 8 }}
            >
              🔄 Cập nhật giá
            </button>
          </div>

          <div className="action-buttons">
            <button
              className={`btn ${canStartCharging() ? 'btn-success' : 'btn-disabled'}`}
              onClick={handleLocalStart}
              disabled={!canStartCharging()}
            >
            Bắt đầu sạc
            </button>

            <button
              className="btn btn-danger"
              onClick={handleLocalStop}
              disabled={!canStop()}
            >
            Dừng sạc 
            </button>

            {/* Suspend/Resume Controls */}
            {status === 'Charging' && (
              <>
                <button
                  className="btn btn-warning"
                  onClick={handleSuspendEV}
                  disabled={!canSuspend()}
                  style={{ marginTop: 8 }}
                >
                Xe tạm dừng
                </button>

                <button
                  className="btn btn-warning"
                  onClick={handleSuspendEVSE}
                  disabled={!canSuspend()}
                  style={{ marginLeft: 8, marginTop: 8 }}
                >
                Trạm tạm dừng
                </button>
              </>
            )}

            {(status === 'SuspendedEV' || status === 'SuspendedEVSE') && (
              <button
                className="btn btn-info"
                onClick={handleResumeCharging}
                disabled={!canResume()}
                style={{ marginTop: 8 }}
              >
                Tiếp tục sạc
              </button>
            )}

            {/* Cable Disconnect */}
            {canDisconnectCable() && (
              <button
                className="btn btn-secondary"
                onClick={handleCableDisconnect}
                style={{ marginTop: 8, backgroundColor: '#6c757d' }}
              >
              Rút cáp sạc
              </button>
            )}
          </div>
        </div>
      )}

      {/* Charging Info - Show when there's an active transaction */}
      {transactionId && (
        <div className="charging-info">
          <h4>Quá trình sạc</h4>
          
          {/* Progress bar */}
          <div className="charging-progress-bar">
            <div
              className="charging-progress"
              style={{
                width: `${Math.min((stats.energyKwh || 0) / (stats.fullChargeThresholdKwh || VINFAST_CARS[selectedCar].batteryCapacity) * 100, 100)}%`,
                background: status === 'FullyCharged' ? '#38b2ac' : '#2563eb'
              }}
            ></div>
          </div>
          
          <div className="charging-progress-label">
            Đã sạc: <b>{(stats.energyKwh || 0).toFixed(2)} kWh</b> / <b>{stats.fullChargeThresholdKwh || VINFAST_CARS[selectedCar].batteryCapacity} kWh</b>
            ({Math.min((stats.energyKwh || 0) / (stats.fullChargeThresholdKwh || VINFAST_CARS[selectedCar].batteryCapacity) * 100, 100).toFixed(1)}%)
          </div>
          
          <div className="charging-time-label">
            Thời gian sạc: <b>{(stats && stats.duration) ? stats.duration : '00:00:00'}</b>
          </div>
          
          <div className="car-info-charging">
            <span className="charging-detail-label">Xe đang sạc:</span>
            <span className="charging-detail-value">{VINFAST_CARS[selectedCar].name} - {VINFAST_CARS[selectedCar].batteryCapacity} kWh</span>
          </div>
          
          <div className="charging-details-grid">
            <div>
              <span className="charging-detail-label">Công suất hiện tại:</span>
              <span className="charging-detail-value">{(stats.powerKw || 0).toFixed(1)} kW</span>
            </div>
            <div>
              <span className="charging-detail-label">Giá ước tính:</span>
              <span className="charging-detail-value">{(stats.estimatedCost || 0).toLocaleString('vi-VN')} ₫</span>
            </div>
            <div>
              <span className="charging-detail-label">User đang sạc:</span>
              <span className="charging-detail-value">{stats.idTag || safetyCheck.confirmationCode || 'N/A'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Status Actions */}
      {isConnected && !disabled && (
        <div className="status-actions">
          <h4>🔧 Điều khiển trạng thái</h4>
          <div className="status-buttons">
            <button
              className="btn btn-warning btn-small"
              onClick={() => handleStatusAction('Faulted')}
              disabled={status === 'Faulted' || status === 'Charging'}
            >
              ⚠️ Báo lỗi
            </button>

            <button
              className="btn btn-secondary btn-small"
              onClick={() => handleStatusAction('Available')}
              disabled={status === 'Available' || status === 'Charging'}
            >
              ✅ Khôi phục
            </button>

            <button
              className="btn btn-gray btn-small"
              onClick={() => handleStatusAction('Unavailable')}
              disabled={status === 'Unavailable' || status === 'Charging'}
            >
              🚫 Không khả dụng
            </button>
          </div>
        </div>
      )}
      
      {/* Error Modal */}
      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal(prev => ({ ...prev, isOpen: false }))}
        title={errorModal.title}
        message={errorModal.message}
        type={errorModal.type}
        onTopUp={() => {
          // Hiển thị hướng dẫn nạp tiền
          alert('🏦 Vui lòng liên hệ quản trị viên để nạp thêm tiền vào tài khoản.\n\n📞 Hotline: 1900-XXXX\n📧 Email: support@example.com');
          setErrorModal(prev => ({ ...prev, isOpen: false }));
        }}
        onRetry={() => {
          setErrorModal(prev => ({ ...prev, isOpen: false }));
          // Có thể thêm logic retry ở đây
        }}
      />
    </div>
  );
};

export default ConnectorCard;
