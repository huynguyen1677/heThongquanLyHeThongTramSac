import { useState, useEffect } from 'react';
import { Edit, X, MapPin, Zap, Cpu, Save } from 'lucide-react';
import FirestoreService from '../services/firestore';
import RealtimeService from '../services/realtime';

const StationDetail = ({ station, onClose, onStationUpdated }) => {
  const [formData, setFormData] = useState({
    stationName: station.stationName || '',
    address: station.address || '',
    latitude: station.latitude || '',
    longitude: station.longitude || '',
    vendor: station.vendor || '',
    model: station.model || '',
    firmwareVersion: station.firmwareVersion || ''
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [realtimeData, setRealtimeData] = useState(null);

  // Subscribe to realtime data
  useEffect(() => {
    const unsubscribe = RealtimeService.subscribeToStation(station.id, (data) => {
      setRealtimeData(data);
    });

    return unsubscribe;
  }, [station.id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!formData.stationName.trim()) {
      alert('Vui lòng nhập tên trạm sạc!');
      return;
    }

    if (!formData.address.trim()) {
      alert('Vui lòng nhập địa chỉ!');
      return;
    }

    // Validate coordinates if provided
    if (formData.latitude && formData.longitude) {
      const lat = parseFloat(formData.latitude);
      const lng = parseFloat(formData.longitude);
      
      if (isNaN(lat) || isNaN(lng)) {
        alert('Tọa độ phải là số hợp lệ!');
        return;
      }

      if (lat < -90 || lat > 90) {
        alert('Latitude phải trong khoảng -90 đến 90!');
        return;
      }

      if (lng < -180 || lng > 180) {
        alert('Longitude phải trong khoảng -180 đến 180!');
        return;
      }
    }

    setIsLoading(true);
    try {
      const updateData = {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null
      };

      await FirestoreService.updateStation(station.id, updateData);
      
      alert('Cập nhật trạm sạc thành công!');
      setIsEditing(false);
      onStationUpdated({ ...station, ...updateData });

    } catch (error) {
      console.error('Error updating station:', error);
      alert(`Lỗi khi cập nhật: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'Available': { class: 'status-available', text: '🟢 Sẵn sàng' },
      'Charging': { class: 'status-charging', text: '🔵 Đang sạc' },
      'Preparing': { class: 'status-preparing', text: '🟡 Chuẩn bị' },
      'SuspendedEV': { class: 'status-suspended', text: '🟣 Xe tạm dừng' },
      'SuspendedEVSE': { class: 'status-suspended', text: '🟠 Trạm tạm dừng' },
      'Finishing': { class: 'status-finishing', text: '🟠 Kết thúc' },
      'Faulted': { class: 'status-faulted', text: '🔴 Lỗi' },
      'Unavailable': { class: 'status-offline', text: '⚫ Không khả dụng' }
    };

    const statusInfo = statusMap[status] || { class: 'status-offline', text: '⚪ Không xác định' };
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.text}</span>;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Chưa có';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflow: 'auto' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="card-title">
            📊 Chi tiết trạm sạc: {station.id}
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                className="btn btn-primary"
              >
                <Edit size={16} />
                Chỉnh sửa
              </button>
            ) : (
              <button 
                onClick={handleSave}
                className="btn btn-success"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="loading"></div>
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Lưu
                  </>
                )}
              </button>
            )}
            <button 
              onClick={onClose} 
              className="btn btn-outline"
              style={{ padding: '0.5rem' }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="card-body">
          <div className="grid grid-2" style={{ gap: '2rem' }}>
            {/* Left Column - Station Info */}
            <div>
              {/* Basic Info */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ color: '#374151', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
                  <Zap size={18} style={{ marginRight: '0.5rem', color: '#3b82f6' }} />
                  Thông tin cơ bản
                </h3>
                
                <div className="form-group">
                  <label>Station ID</label>
                  <input
                    type="text"
                    value={station.id}
                    disabled
                    style={{ background: '#f3f4f6', color: '#6b7280' }}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="stationName">Tên trạm sạc</label>
                  <input
                    type="text"
                    id="stationName"
                    name="stationName"
                    value={formData.stationName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              {/* Location Info */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ color: '#374151', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
                  <MapPin size={18} style={{ marginRight: '0.5rem', color: '#10b981' }} />
                  Thông tin vị trí
                </h3>
                
                <div className="form-group">
                  <label htmlFor="address">Địa chỉ</label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    rows={3}
                  />
                </div>

                <div className="grid grid-2">
                  <div className="form-group">
                    <label htmlFor="latitude">Latitude</label>
                    <input
                      type="number"
                      id="latitude"
                      name="latitude"
                      value={formData.latitude}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      step="any"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="longitude">Longitude</label>
                    <input
                      type="number"
                      id="longitude"
                      name="longitude"
                      value={formData.longitude}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      step="any"
                    />
                  </div>
                </div>
              </div>

              {/* Hardware Info */}
              <div>
                <h3 style={{ color: '#374151', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
                  <Cpu size={18} style={{ marginRight: '0.5rem', color: '#f59e0b' }} />
                  Thông tin thiết bị
                </h3>
                
                <div className="grid grid-3">
                  <div className="form-group">
                    <label htmlFor="vendor">Vendor</label>
                    <input
                      type="text"
                      id="vendor"
                      name="vendor"
                      value={formData.vendor}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="model">Model</label>
                    <input
                      type="text"
                      id="model"
                      name="model"
                      value={formData.model}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="firmwareVersion">Firmware</label>
                    <input
                      type="text"
                      id="firmwareVersion"
                      name="firmwareVersion"
                      value={formData.firmwareVersion}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Realtime Status */}
            <div>
              <h3 style={{ color: '#374151', marginBottom: '1rem' }}>
                📡 Trạng thái thời gian thực
              </h3>

              {/* Station Status */}
              <div className="card" style={{ marginBottom: '1rem' }}>
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '500' }}>Trạng thái trạm:</span>
                    {realtimeData?.online ? 
                      <span className="status-badge status-available">🟢 Online</span> :
                      <span className="status-badge status-offline">🔴 Offline</span>
                    }
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
                    Heartbeat cuối: {formatDateTime(realtimeData?.lastHeartbeat)}
                  </div>
                </div>
              </div>

              {/* Connectors */}
              <div>
                <h4 style={{ marginBottom: '1rem', color: '#374151' }}>🔌 Connectors</h4>
                {realtimeData?.connectors ? Object.entries(realtimeData.connectors).map(([connectorId, connector]) => (
                  <div key={connectorId} className="card" style={{ marginBottom: '1rem' }}>
                    <div className="card-body">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <strong>Connector {connectorId}</strong>
                        {getStatusBadge(connector.status)}
                      </div>
                      
                      {connector.errorCode && connector.errorCode !== 'NoError' && (
                        <div style={{ color: '#ef4444', fontSize: '0.875rem' }}>
                          ⚠️ Error: {connector.errorCode}
                        </div>
                      )}
                      
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
                        Cập nhật: {formatDateTime(connector.lastUpdate)}
                      </div>
                    </div>
                  </div>
                )) : (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                    Không có dữ liệu connector
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StationDetail;
