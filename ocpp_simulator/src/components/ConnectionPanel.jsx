import { useState } from 'react';
import './ConnectionPanel.css';

const ConnectionPanel = ({ 
  onConnect, 
  onDisconnect, 
  isConnected, 
  connectionStatus 
}) => {
  const [formData, setFormData] = useState({
    stationId: '',
    ownerId: '',
    connectorCount: 2,
    vendor: 'SIM',
    model: 'SIM-X',
    firmwareVersion: '1.0.0'
  });

  const [isConnecting, setIsConnecting] = useState(false);

  // Chỉ cho phép nhập các trường khác, không cho chỉnh số connector
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'connectorCount') return; // Không cho chỉnh
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleConnect = async () => {
    if (!formData.stationId.trim() || !formData.ownerId.trim()) {
      alert('Vui lòng nhập Station ID và Owner ID');
      return;
    }

    setIsConnecting(true);
    try {
      await onConnect(formData);
    } catch (error) {
      alert(`Kết nối thất bại: ${error.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await onDisconnect();
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  };

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return <span className="status-badge connected">🟢 Kết nối</span>;
      case 'disconnected':
        return <span className="status-badge disconnected">🔴 Ngắt kết nối</span>;
      case 'connecting':
        return <span className="status-badge connecting">🟡 Đang kết nối...</span>;
      default:
        return <span className="status-badge disconnected">⚪ Chưa kết nối</span>;
    }
  };

  return (
    <div className="connection-panel">
      <h2>OCPP Station Connection</h2>
      
      <div className="connection-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="stationId">Station ID *</label>
            <input
              type="text"
              id="stationId"
              name="stationId"
              value={formData.stationId}
              onChange={handleInputChange}
              disabled={isConnected}
              placeholder="VD: STATION_001"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="ownerId">Owner ID *</label>
            <input
              type="text"
              id="ownerId"
              name="ownerId"
              value={formData.ownerId}
              onChange={handleInputChange}
              disabled={isConnected}
              placeholder="VD: OWNER_001"
            />
          </div>
        </div>

        {/* Luôn cố định 2 connector, không cho chỉnh số lượng */}
        <div className="form-row">
          <div className="form-group">
            <label>Số Connector</label>
            <input
              type="number"
              value={2}
              disabled
              style={{ background: '#eee', color: '#888', fontWeight: 'bold' }}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="vendor">Vendor</label>
            <input
              type="text"
              id="vendor"
              name="vendor"
              value={formData.vendor}
              onChange={handleInputChange}
              disabled={isConnected}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="model">Model</label>
            <input
              type="text"
              id="model"
              name="model"
              value={formData.model}
              onChange={handleInputChange}
              disabled={isConnected}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="firmwareVersion">Firmware Version</label>
            <input
              type="text"
              id="firmwareVersion"
              name="firmwareVersion"
              value={formData.firmwareVersion}
              onChange={handleInputChange}
              disabled={isConnected}
            />
          </div>
        </div>

        <div className="connection-info">
          <div className="info-item">
            <strong>WebSocket URL:</strong> {import.meta.env.VITE_OCPP_WS || 'Chưa cấu hình'}
          </div>
          <div className="info-item">
            <strong>Trạng thái:</strong> {getStatusBadge()}
          </div>
        </div>

        <div className="connection-actions">
          {!isConnected ? (
            <button 
              className="btn btn-primary"
              onClick={handleConnect}
              disabled={isConnecting}
            >
              {isConnecting ? '🔄 Đang kết nối...' : '🔌 Kết nối'}
            </button>
          ) : (
            <button 
              className="btn btn-danger"
              onClick={handleDisconnect}
            >
            Ngắt kết nối
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectionPanel;
