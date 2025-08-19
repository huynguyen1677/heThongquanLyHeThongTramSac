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
    firmwareVersion: '1.0.0',
    // Location data
    latitude: '',
    longitude: '',
    address: '',
    stationName: ''
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

    // Validate location data
    if (!formData.latitude || !formData.longitude || !formData.address || !formData.stationName) {
      alert('Vui lòng nhập đầy đủ thông tin vị trí (Latitude, Longitude, Địa chỉ, Tên trạm)');
      return;
    }

    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    
    if (isNaN(lat) || isNaN(lng)) {
      alert('Latitude và Longitude phải là số hợp lệ');
      return;
    }

    if (lat < -90 || lat > 90) {
      alert('Latitude phải trong khoảng -90 đến 90');
      return;
    }

    if (lng < -180 || lng > 180) {
      alert('Longitude phải trong khoảng -180 đến 180');
      return;
    }

    setIsConnecting(true);
    try {
      await onConnect({
        ...formData,
        latitude: lat,
        longitude: lng
      });
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
      <h2>🔌 OCPP Station Connection</h2>
      
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

        {/* Location Information */}
        <div className="location-section">
          <h3 style={{margin: '20px 0 10px 0', color: '#2563eb', borderBottom: '2px solid #e5e7eb', paddingBottom: '5px'}}>
            📍 Thông tin vị trí trạm sạc
          </h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="stationName">Tên trạm sạc *</label>
              <input
                type="text"
                id="stationName"
                name="stationName"
                value={formData.stationName}
                onChange={handleInputChange}
                disabled={isConnected}
                placeholder="VD: Trạm sạc Vincom Center"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="address">Địa chỉ *</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                disabled={isConnected}
                placeholder="VD: 72 Lê Thánh Tôn, Quận 1, TP.HCM"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="latitude">Latitude (Vĩ độ) *</label>
              <input
                type="number"
                id="latitude"
                name="latitude"
                value={formData.latitude}
                onChange={handleInputChange}
                disabled={isConnected}
                placeholder="VD: 10.7769"
                step="any"
                min="-90"
                max="90"
              />
              <small style={{color: '#6b7280', fontSize: '11px'}}>
                Từ -90 đến 90 (Google Maps: click chuột phải → "What's here?")
              </small>
            </div>
            
            <div className="form-group">
              <label htmlFor="longitude">Longitude (Kinh độ) *</label>
              <input
                type="number"
                id="longitude"
                name="longitude"
                value={formData.longitude}
                onChange={handleInputChange}
                disabled={isConnected}
                placeholder="VD: 106.7009"
                step="any"
                min="-180"
                max="180"
              />
              <small style={{color: '#6b7280', fontSize: '11px'}}>
                Từ -180 đến 180
              </small>
            </div>
          </div>

          <div className="location-helper" style={{
            background: '#f3f4f6', 
            padding: '12px', 
            borderRadius: '8px', 
            marginTop: '10px',
            border: '1px solid #e5e7eb'
          }}>
            <strong style={{color: '#374151'}}>💡 Cách lấy tọa độ từ Google Maps:</strong>
            <ol style={{margin: '8px 0 0 20px', color: '#6b7280', fontSize: '12px'}}>
              <li>Mở <a href="https://maps.google.com" target="_blank" style={{color: '#2563eb'}}>Google Maps</a></li>
              <li>Tìm địa chỉ trạm sạc</li>
              <li>Click chuột phải vào vị trí → chọn "What's here?"</li>
              <li>Copy số đầu tiên (Latitude) và số thứ hai (Longitude)</li>
            </ol>
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
              🔌 Ngắt kết nối
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectionPanel;
