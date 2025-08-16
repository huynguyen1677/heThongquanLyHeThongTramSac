import { useState } from 'react';
import './SimulatorActions.css';

const SimulatorActions = ({ 
  onRunPreset, 
  onExportLogs, 
  isConnected,
  logs 
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
      <h2>🎮 Simulator Actions</h2>
      
      <div className="actions-grid">
        {/* Auto Meter Control */}
        <div className="action-section">
          <h3>⚙️ Cấu hình</h3>
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
          <h3>🚀 Quick Actions</h3>
          <button
            className="btn btn-primary btn-large"
            onClick={handleRunPreset}
            disabled={!isConnected || isRunningPreset}
          >
            {isRunningPreset ? (
              <>🔄 Đang chạy preset...</>
            ) : (
              <>🎯 Chạy Preset Demo</>
            )}
          </button>
          <p className="action-description">
            Boot → Available → Pre-check OK → Start → 4×Meter → Stop → Available
          </p>
        </div>

        {/* Log Management */}
        <div className="action-section">
          <h3>📄 Quản lý Logs</h3>
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
            📥 Xuất Logs (.json)
          </button>
        </div>

        {/* Connection Info */}
        <div className="action-section">
          <h3>📊 Thông tin kết nối</h3>
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

      {/* Quick Tips */}
      <div className="tips-section">
        <h3>💡 Mẹo sử dụng</h3>
        <ul className="tips-list">
          <li>Sử dụng <strong>Preset Demo</strong> để test nhanh toàn bộ flow sạc</li>
          <li>Kiểm tra pre-check (đỗ xe, cắm dây, mã 1234) trước khi Start</li>
          <li>Power có thể điều chỉnh khi đang sạc để thấy thay đổi meter</li>
          <li>Xuất logs để phân tích chi tiết giao tiếp OCPP</li>
        </ul>
      </div>
    </div>
  );
};

export default SimulatorActions;
