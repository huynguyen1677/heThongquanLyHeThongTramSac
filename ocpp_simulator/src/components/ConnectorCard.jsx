import { useState, useEffect } from 'react';
import './ConnectorCard.css';

const INITIAL_STATS = {
  transactionId: null,
  currentMeterValue: 0,
  energyKwh: 0,
  powerKw: 0,
  duration: '00:00:00',
  estimatedCost: 0,
  isRunning: false
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

  // Update stats from meter timer
  useEffect(() => {
    let interval = null;

    // Chỉ chạy interval khi đang ở trạng thái 'Charging'
    if (status === 'Charging' && meterTimer?.isActive()) {
      // Cập nhật trạng thái mỗi giây
      interval = setInterval(() => {
        setStats(meterTimer.getChargingStats());
      }, 1000);
    } else {
      // Nếu không sạc, reset lại các thông số
      setStats(INITIAL_STATS);
    }

    // Hàm dọn dẹp: sẽ được gọi khi component unmount hoặc khi các dependency thay đổi
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [status, meterTimer]); // Thêm `status` vào dependency array

  const handlePreCheckChange = (field, value) => {
    setPreCheck(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleConfirmCode = () => {
    if (preCheck.confirmationCode === '1234') {
      setPreCheck(prev => ({ ...prev, confirmed: true }));
    } else {
      alert('Mã xác nhận không đúng! Sử dụng: 1234');
    }
  };

  const isReadyToStart = () => {
    return preCheck.parked && preCheck.plugged && preCheck.confirmed &&
      status === 'Available' && isConnected;
  };

  const canStop = () => {
    return status === 'Charging' && transactionId && isConnected;
  };

  const handleLocalStart = async () => {
    if (!isReadyToStart()) {
      alert('Vui lòng hoàn thành tất cả các kiểm tra an toàn trước khi bắt đầu sạc!');
      return;
    }

    try {
      await onLocalStart(connectorId, powerKw);
    } catch (error) {
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

  const handlePowerChange = (newPower) => {
    setPowerKw(newPower);
    if (meterTimer && meterTimer.isActive()) {
      meterTimer.setPower(newPower);
    }
  };

  const handleStatusAction = async (newStatus) => {
    try {
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
      'Finishing': { color: 'orange', emoji: '🟠', text: 'Kết thúc' },
      'Unavailable': { color: 'gray', emoji: '⚫', text: 'Không khả dụng' },
      'Faulted': { color: 'red', emoji: '🔴', text: 'Lỗi' }
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

      {/* Pre-check Section */}
      <div className="pre-check-section">
        <h4>✅ Kiểm tra an toàn</h4>
        <div className="pre-check-items">
          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={preCheck.parked}
              onChange={(e) => handlePreCheckChange('parked', e.target.checked)}
              disabled={status !== 'Available'}
            />
            🚗 Xe đã đỗ đúng vị trí
          </label>

          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={preCheck.plugged}
              onChange={(e) => handlePreCheckChange('plugged', e.target.checked)}
              disabled={status !== 'Available'}
            />
            🔌 Đã cắm dây sạc
          </label>

          <div className="confirmation-code">
            <input
              type="text"
              placeholder="Mã xác nhận (1234)"
              value={preCheck.confirmationCode}
              onChange={(e) => handlePreCheckChange('confirmationCode', e.target.value)}
              disabled={status !== 'Available' || preCheck.confirmed}
              maxLength={4}
            />
            <button
              onClick={handleConfirmCode}
              disabled={status !== 'Available' || preCheck.confirmed || preCheck.confirmationCode.length !== 4}
              className="btn btn-small"
            >
              {preCheck.confirmed ? '✅ Đã xác nhận' : 'Xác nhận'}
            </button>
          </div>
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
          <span>3.210,9 ₫/kWh</span>
        </div>
        <div className="action-buttons">
          <button
            className="btn btn-success"
            onClick={handleLocalStart}
            disabled={!isReadyToStart()}
          >
            🚀 Bắt đầu sạc (Local)
          </button>

          <button
            className="btn btn-danger"
            onClick={handleLocalStop}
            disabled={!canStop()}
          >
            ⏹️ Dừng sạc (Local)
          </button>
        </div>
      </div>

      {/* Charging Info */}
      {(status === 'Charging' || transactionId) && (
        <div className="charging-info">
          <h4>📊 Thông tin sạc</h4>
          <div className="info-grid">
            <div className="info-item">
              <label>ID Giao dịch:</label>
              <span>{stats.transactionId || transactionId || 'N/A'}</span>
            </div>
            <div className="info-item">
              <label>Đã sạc:</label>
              <span>{stats.energyKwh.toFixed(3)} kWh</span>
            </div>
            <div className="info-item">
              <label>Công suất hiện tại:</label>
              <span>{stats.powerKw} kW</span>
            </div>
            <div className="info-item">
              <label>Thời gian sạc:</label>
              <span>{stats.duration}</span>
            </div>
            <div className="info-item">
              <label>Tổng Kwh của trạm:</label>
              <span>{(stats.currentMeterValue / 1000).toFixed(3)} kWh</span>
            </div>
            <div className="info-item">
              <label>Giá ước tính:</label>
              <span>{stats.estimatedCost.toLocaleString()} ₫</span>
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
