import { useState } from 'react';
import './SimulatorActions.css';

const SimulatorActions = ({ 
  onRunPreset, 
  onExportLogs, 
  isConnected,
  logs,
  connectors,
  onSetCumulativeMeter // Thêm prop mới
}) => {
  const [isRunningPreset, setIsRunningPreset] = useState(false);
  const [autoMeterEnabled, setAutoMeterEnabled] = useState(true);

  const handleRunPreset = async () => {
    if (!isConnected) {
      alert('Vui lòng kết nối trước khi chạy preset!');
      return;
    }

    setIsRunningPreset(true);
    try {
      await onRunPreset();
    } catch (error) {
      alert(`Lỗi khi chạy preset: ${error.message}`);
    } finally {
      setIsRunningPreset(false);
    }
  };

  const handleExportLogs = () => {
    if (!logs || logs.length === 0) {
      alert('Không có logs để xuất!');
      return;
    }

    try {
      onExportLogs();
    } catch (error) {
      alert(`Lỗi khi xuất logs: ${error.message}`);
    }
  };

  const getLogSummary = () => {
    if (!logs || logs.length === 0) {
      return { total: 0, calls: 0, results: 0, errors: 0 };
    }

    const summary = logs.reduce((acc, log) => {
      acc.total++;
      if (log.type === 'call') acc.calls++;
      else if (log.type === 'callresult') acc.results++;
      else if (log.type === 'callerror') acc.errors++;
      return acc;
    }, { total: 0, calls: 0, results: 0, errors: 0 });

    return summary;
  };

  const logSummary = getLogSummary();

  return (
    <div className="simulator-actions">
      <h2>Simulator Actions</h2>
      
      <div className="actions-grid">
        {/* Auto Meter Control */}
        <div className="action-section">
          <h3>Cấu hình</h3>
          <div className="setting-item">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={autoMeterEnabled}
                onChange={(e) => setAutoMeterEnabled(e.target.checked)}
              />
              <span className="slider"></span>
            </label>
            <span>Auto Meter Values</span>
          </div>
          <p className="setting-description">
            Tự động gửi MeterValues khi đang sạc (5s/lần)
          </p>
        </div>

        {/* Preset Actions */}
        <div className="action-section">
          <h3>Hành động nhanh</h3>
          <button
            className="btn btn-primary btn-large"
            onClick={handleRunPreset}
            disabled={!isConnected || isRunningPreset}
          >
            {isRunningPreset ? (
              <>Đang chạy preset...</>
            ) : (
              <>Chạy Preset Demo</>
            )}
          </button>
          <p className="action-description">
            Boot → Available → Pre-check OK → Start → 4×Meter → Stop → Available
          </p>
        </div>

        {/* Log Management */}
        <div className="action-section">
          <h3>Quản lý Logs</h3>
          <div className="log-stats">
            <div className="stat-item">
              <span className="stat-number">{logSummary.total}</span>
              <span className="stat-label">Tổng messages</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{logSummary.calls}</span>
              <span className="stat-label">CALL</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{logSummary.results}</span>
              <span className="stat-label">RESULT</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{logSummary.errors}</span>
              <span className="stat-label">ERROR</span>
            </div>
          </div>
          <button
            className="btn btn-secondary"
            onClick={handleExportLogs}
            disabled={!logs || logs.length === 0}
          >
            Xuất Logs (.json)
          </button>
        </div>

        {/* Meter Management */}
        <div className="action-section">
          <h3>Quản lý Cumulative Meter</h3>
          <div className="meter-controls">
            <p>Simulate máy mới vs máy đang hoạt động:</p>
            <div className="meter-buttons">
              <button
                className="btn btn-secondary"
                onClick={() => onSetCumulativeMeter('reset')}
                disabled={!isConnected}
                title="Reset tất cả connector về 0 Wh (máy mới)"
              >
                Máy mới (0 Wh)
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => onSetCumulativeMeter('existing')}
                disabled={!isConnected}
                title="Set cumulative meter lớn (máy đang hoạt động)"
              >
                Máy hoạt động (25k Wh)
              </button>
            </div>
            {connectors && connectors.length > 0 && (
              <div className="current-meters">
                <small>Cumulative meter hiện tại:</small>
                {connectors.map(conn => (
                  <div key={conn.id} className="meter-display">
                    <span>Connector {conn.id}: {(conn.cumulativeMeter || 0).toLocaleString()} Wh</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Connection Info */}
        <div className="action-section">
          <h3>Thông tin kết nối</h3>
          <div className="connection-stats">
            <div className="stat-row">
              <span>Trạng thái:</span>
              <span className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
                {isConnected ? '🟢 Kết nối' : '🔴 Ngắt kết nối'}
              </span>
            </div>
            <div className="stat-row">
              <span>WebSocket URL:</span>
              <span className="url">{import.meta.env.VITE_OCPP_WS || 'Chưa cấu hình'}</span>
            </div>
            <div className="stat-row">
              <span>Auto Meter:</span>
              <span className={`status ${autoMeterEnabled ? 'enabled' : 'disabled'}`}>
                {autoMeterEnabled ? '✅ Bật' : '❌ Tắt'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulatorActions;
