import { useState, useEffect } from 'react';
import './ConnectorCard.css';


const INITIAL_STATS = {
  transactionId: null,
  currentMeterValue: 0,
  energyKwh: 0,
  powerKw: 0,
  duration: '00:00:00',
  estimatedCost: 0,
  isRunning: false,
  fullChargeThresholdKwh: 2, // Lấy từ MeterTimer
};

const ConnectorCard = ({
  connectorId,
  status,
  transactionId,
  meterTimer,
  onLocalStart,
  onLocalStop,
  onStatusChange,
  isConnected
}) => {
  const [preCheck, setPreCheck] = useState({
    parked: false,
    plugged: false,
    confirmationCode: '',
    confirmed: false
  });

  const [powerKw, setPowerKw] = useState(11);
  const [stats, setStats] = useState(INITIAL_STATS);

  // Cập nhật giá điện từ API khi component mount
  useEffect(() => {
    const updatePriceFromApi = async () => {
      if (meterTimer) {
        try {
          const apiUrl = 'http://localhost:3000/api/settings/price-per-kwh';
          await meterTimer.updatePricePerKwhFromApi(apiUrl);
          // Cập nhật stats ngay sau khi cập nhật giá điện
          setStats(meterTimer.getChargingStats());
        } catch (error) {
          console.error('Lỗi khi cập nhật giá điện:', error);
        }
      }
    };

    updatePriceFromApi();
  }, [meterTimer]);

  // Update stats from meter timer
  useEffect(() => {
    let interval = null;

    // Cập nhật stats ban đầu
    if (meterTimer) {
      setStats(meterTimer.getChargingStats());
    }

    // Chỉ chạy interval khi đang ở trạng thái 'Charging' (không chạy khi suspend)
    if (status === 'Charging' && meterTimer?.isActive()) {
      // Cập nhật trạng thái mỗi giây
      interval = setInterval(() => {
        setStats(meterTimer.getChargingStats());
      }, 1000);
    } else if (meterTimer && (status === 'Available' || status === 'SuspendedEV' || status === 'SuspendedEVSE')) {
      // Nếu không sạc nhưng có meterTimer, vẫn hiển thị thông tin cơ bản (giá điện)
      // Hoặc khi suspend thì vẫn hiển thị thông tin nhưng không tăng
      setStats(meterTimer.getChargingStats());
    } else {
      // Nếu không có meterTimer, reset lại các thông số
      setStats(INITIAL_STATS);
    }

    // Hàm dọn dẹp: sẽ được gọi khi component unmount hoặc khi các dependency thay đổi
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [status, meterTimer]); // Thêm `status` vào dependency array

  const handlePreCheckChange = async (field, value) => {
    const newPreCheck = { ...preCheck, [field]: value };
    setPreCheck(newPreCheck);
    
    // Kiểm tra xem tất cả safety check đã hoàn thành chưa (trừ confirmed vì nó cần mã xác nhận)
    if (field !== 'confirmationCode' && field !== 'confirmed' && 
        newPreCheck.parked && newPreCheck.plugged && newPreCheck.confirmed && 
        status === 'Available') {
      try {
        console.log(`🔒 All safety checks completed for connector ${connectorId}:`, newPreCheck);
        
        // Ngay lập tức chuyển sang Preparing và gửi qua CSMS
        await onStatusChange(connectorId, 'Preparing', newPreCheck);
        
        console.log(`✅ Connector ${connectorId} moved to Preparing status`);
      } catch (error) {
        console.error(`❌ Error updating status to Preparing:`, error);
        alert(`Lỗi khi cập nhật trạng thái: ${error.message}`);
      }
    }
  };

  const canStop = () => {
    return status === 'Charging' && transactionId && isConnected;
  };

  const canSuspend = () => {
    return status === 'Charging' && transactionId && isConnected;
  };

  const canResume = () => {
    return (status === 'SuspendedEV' || status === 'SuspendedEVSE') && transactionId && isConnected;
  };

  const canDisconnectCable = () => {
    return (status === 'Charging' || status === 'SuspendedEV' || status === 'SuspendedEVSE') && 
           transactionId && isConnected;
  };

  const handleLocalStart = async () => {
    // Kiểm tra ID Tag đã nhập chưa
    if (!preCheck.confirmationCode || preCheck.confirmationCode.length !== 6) {
      alert('Vui lòng nhập User ID (6 số) trước khi bắt đầu sạc!');
      return;
    }

    try {
      console.log(`🚀 Starting charging for connector ${connectorId} with User ID: ${preCheck.confirmationCode}`);
      
      // Gửi StartTransaction trực tiếp với ID Tag
      await onLocalStart(connectorId, powerKw, preCheck.confirmationCode);
      
      console.log(`✅ Charging request sent for connector ${connectorId}`);
    } catch (error) {
      console.error(`❌ Error starting charge for connector ${connectorId}:`, error);
      alert(`Lỗi khi bắt đầu sạc: ${error.message}`);
    }
  };

  const handleLocalStop = async () => {
    if (!canStop()) {
      return;
    }

    try {
      await onLocalStop(connectorId);
    } catch (error) {
      alert(`Lỗi khi dừng sạc: ${error.message}`);
    }
  };

  const handleSuspendEV = async () => {
    if (!canSuspend()) {
      return;
    }

    try {
      console.log(`� [DEBUG] handleSuspendEV called for connector ${connectorId}, onStatusChange:`, typeof onStatusChange);
      console.log(`�🚗 Suspending charging due to EV request for connector ${connectorId}`);
      await onStatusChange(connectorId, 'SuspendedEV');
    } catch (error) {
      alert(`Lỗi khi tạm dừng sạc (EV): ${error.message}`);
    }
  };

  const handleSuspendEVSE = async () => {
    if (!canSuspend()) {
      return;
    }

    try {
      console.log(`🔍 [DEBUG] handleSuspendEVSE called for connector ${connectorId}, onStatusChange:`, typeof onStatusChange);
      console.log(`⚡ Suspending charging due to EVSE limit for connector ${connectorId}`);
      await onStatusChange(connectorId, 'SuspendedEVSE');
    } catch (error) {
      alert(`Lỗi khi tạm dừng sạc (EVSE): ${error.message}`);
    }
  };

  const handleResumeCharging = async () => {
    if (!canResume()) {
      return;
    }

    try {
      console.log(`🔄 Resuming charging for connector ${connectorId}`);
      await onStatusChange(connectorId, 'Charging');
    } catch (error) {
      alert(`Lỗi khi tiếp tục sạc: ${error.message}`);
    }
  };

  const handleCableDisconnect = async () => {
    if (!canDisconnectCable()) {
      return;
    }

    try {
      console.log(`🔌 Cable disconnected for connector ${connectorId}, finishing transaction`);
      // Chuyển sang Finishing trước khi về Available
      await onStatusChange(connectorId, 'Finishing');
      
      // Delay ngắn để mô phỏng quá trình finishing
      setTimeout(async () => {
        try {
          // Dừng transaction và chuyển về Available
          await onLocalStop(connectorId);
          console.log(`✅ Transaction finished for connector ${connectorId}`);
        } catch (error) {
          console.error(`❌ Error finishing transaction:`, error);
        }
      }, 2000);
    } catch (error) {
      alert(`Lỗi khi rút cáp: ${error.message}`);
    }
  };

  const handlePowerChange = (newPower) => {
    setPowerKw(newPower);
    if (meterTimer && meterTimer.isActive()) {
      meterTimer.setPower(newPower);
    }
  };

  const handleStatusAction = async (newStatus) => {
    try {
      // Nếu chuyển sang Available từ trạng thái khác, reset safety check
      if (newStatus === 'Available') {
        setPreCheck({
          parked: false,
          plugged: false,
          confirmationCode: '',
          confirmed: false
        });
      }
      
      await onStatusChange(connectorId, newStatus);
    } catch (error) {
      alert(`Lỗi khi thay đổi trạng thái: ${error.message}`);
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
      'FullyCharged': { color: 'teal', emoji: '✅', text: 'Sạc đầy' } // Thêm trạng thái sạc đầy
    };

    const config = statusConfig[status] || statusConfig['Available'];
    return (
      <span className={`status-badge ${config.color}`}>
        {config.emoji} {config.text}
      </span>
    );
  };

  return (
    <div className="connector-card">
      <div className="connector-header">
        <h3>🔌 Connector {connectorId}</h3>
        {getStatusBadge()}
      </div>

      {/* Thêm thông báo nổi bật khi sạc đầy */}
      {status === 'FullyCharged' && (
        <div className="full-charged-notice">
          <span role="img" aria-label="full">🔋</span>
          <b>Xe đã sạc đầy!</b>
        </div>
      )}

      {/* Simple ID Tag Input */}
      <div className="id-tag-section">
        <h4>🏷️ Nhập ID Tag (User ID)</h4>
        <div className="id-tag-input">
          <input
            type="text"
            placeholder="Nhập User ID (6 số)"
            value={preCheck.confirmationCode}
            onChange={(e) => handlePreCheckChange('confirmationCode', e.target.value.replace(/\D/g, '').slice(0, 6))}
            disabled={status !== 'Available'}
            maxLength={6}
          />
        </div>
      </div>

      {/* Control Section */}
      <div className="control-section">
        <div className="power-control">
          <label>⚡ Công suất (kW):</label>
          <input
            type="number"
            value={powerKw}
            onChange={(e) => handlePowerChange(parseFloat(e.target.value) || 0)}
            min="3.5"
            max="15"
            step="0.5"
            disabled={!isConnected}
          />
          <button
            className="btn btn-small"
            onClick={() => handlePowerChange(3.5)}
            disabled={!isConnected}
            style={{ marginLeft: 8 }}
          >
            Sạc chậm
          </button>
          <button
            className="btn btn-small"
            onClick={() => handlePowerChange(11)}
            disabled={!isConnected}
            style={{ marginLeft: 4 }}
          >
            Sạc nhanh
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
            onClick={async () => {
              if (meterTimer) {
                try {
                  const apiUrl = 'http://localhost:3000/api/settings/price-per-kwh';
                  await meterTimer.updatePricePerKwhFromApi(apiUrl);
                  setStats(meterTimer.getChargingStats());
                } catch (error) {
                  console.error('Lỗi khi cập nhật giá điện:', error);
                }
              }
            }}
            disabled={!isConnected}
            style={{ marginLeft: 8 }}
          >
            🔄 Cập nhật giá
          </button>
        </div>
        <div className="action-buttons">
          <button
            className="btn btn-success"
            onClick={handleLocalStart}
            disabled={status !== 'Available' || !preCheck.confirmationCode || preCheck.confirmationCode.length !== 6}
          >
            🚀 Bắt đầu sạc
          </button>

          <button
            className="btn btn-danger"
            onClick={handleLocalStop}
            disabled={!canStop()}
          >
            ⏹️ Dừng sạc (Local)
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
                🚗 Xe tạm dừng
              </button>

              <button
                className="btn btn-warning"
                onClick={handleSuspendEVSE}
                disabled={!canSuspend()}
                style={{ marginLeft: 8, marginTop: 8 }}
              >
                ⚡ Trạm tạm dừng
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
              🔄 Tiếp tục sạc
            </button>
          )}

          {/* Cable Disconnect */}
          {(status === 'Charging' || status === 'SuspendedEV' || status === 'SuspendedEVSE') && (
            <button
              className="btn btn-secondary"
              onClick={handleCableDisconnect}
              disabled={!canDisconnectCable()}
              style={{ marginTop: 8, backgroundColor: '#6c757d' }}
            >
              🔌 Rút cáp sạc
            </button>
          )}
        </div>
      </div>

      {/* Charging Info - Luôn hiển thị nếu có transactionId */}
      {transactionId && (
        <div className="charging-info">
          <h4>📊 Quá trình sạc</h4>
          {/* Progress bar với số kWh đã sạc và phần trăm */}
          <div className="charging-progress-bar">
            <div
              className="charging-progress"
              style={{
                width: `${Math.min(stats.energyKwh / (stats.fullChargeThresholdKwh || 2) * 100, 100)}%`,
                background: status === 'FullyCharged' ? '#38b2ac' : '#2563eb'
              }}
            ></div>
          </div>
          <div className="charging-progress-label">
            Đã sạc: <b>{stats.energyKwh.toFixed(2)} kWh</b> / <b>{stats.fullChargeThresholdKwh || 2} kWh</b>
            ({Math.min(stats.energyKwh / (stats.fullChargeThresholdKwh || 2) * 100, 100).toFixed(1)}%)
          </div>
          <div className="charging-time-label">
            Thời gian sạc: <b>{stats.duration}</b>
          </div>
          <div className="charging-details-grid">
            <div>
              <span className="charging-detail-label">Công suất hiện tại:</span>
              <span className="charging-detail-value">{stats.powerKw} kW</span>
            </div>
            <div>
              <span className="charging-detail-label">Giá ước tính:</span>
              <span className="charging-detail-value">{stats.estimatedCost} ₫</span>
            </div>
            <div>
              <span className="charging-detail-label">User đang sạc:</span>
              <span className="charging-detail-value">{stats.idTag || preCheck.confirmationCode || 'N/A'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Status Actions */}
      <div className="status-actions">
        <h4>🔧 Điều khiển trạng thái</h4>
        <div className="status-buttons">
          <button
            className="btn btn-warning btn-small"
            onClick={() => handleStatusAction('Faulted')}
            disabled={!isConnected || status === 'Faulted'}
          >
            ⚠️ Báo lỗi
          </button>

          <button
            className="btn btn-secondary btn-small"
            onClick={() => handleStatusAction('Available')}
            disabled={!isConnected || status === 'Available' || status === 'Charging'}
          >
            ✅ Khôi phục
          </button>

          <button
            className="btn btn-gray btn-small"
            onClick={() => handleStatusAction('Unavailable')}
            disabled={!isConnected || status === 'Unavailable' || status === 'Charging'}
          >
            🚫 Không khả dụng
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConnectorCard;
