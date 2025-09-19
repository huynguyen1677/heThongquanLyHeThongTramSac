import { useState } from 'react';
import { Plus, X, MapPin, Zap, Cpu } from 'lucide-react';
import FirestoreService from '../services/firestore';

const StationForm = ({ onClose, onStationCreated, ownerId }) => {
  const [formData, setFormData] = useState({
    stationId: '',
    stationName: '',
    address: '',
    latitude: '',
    longitude: '',
    vendor: 'SIM',
    model: 'SIM-X',
    firmwareVersion: '1.0.0'
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.stationId.trim()) {
      alert('Vui lòng nhập Station ID!');
      return;
    }

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
      // Check if station ID already exists
      const exists = await FirestoreService.checkStationExists(formData.stationId);
      if (exists) {
        alert('Station ID đã tồn tại! Vui lòng chọn ID khác.');
        return;
      }

      // Prepare station data
      const stationData = {
        ...formData,
        ownerId: ownerId,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null
      };

      // Create station
      const newStation = await FirestoreService.createStation(stationData);
      
      alert('Tạo trạm sạc thành công!');
      onStationCreated(newStation);
      onClose();

    } catch (error) {
      console.error('Error creating station:', error);
      alert(`Lỗi khi tạo trạm sạc: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
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
      <div className="card" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflow: 'auto' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="card-title">
            <Plus size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
            Tạo trạm sạc mới
          </h2>
          <button 
            onClick={onClose} 
            className="btn btn-outline"
            style={{ padding: '0.5rem' }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {/* Station Basic Info */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ color: '#374151', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
                <Zap size={18} style={{ marginRight: '0.5rem', color: '#3b82f6' }} />
                Thông tin cơ bản
              </h3>
              
              <div className="grid grid-2">
                <div className="form-group">
                  <label htmlFor="stationId">Station ID *</label>
                  <input
                    type="text"
                    id="stationId"
                    name="stationId"
                    value={formData.stationId}
                    onChange={handleInputChange}
                    placeholder="VD: CP_HCM_001"
                    disabled={isLoading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="stationName">Tên trạm sạc *</label>
                  <input
                    type="text"
                    id="stationName"
                    name="stationName"
                    value={formData.stationName}
                    onChange={handleInputChange}
                    placeholder="VD: Trạm sạc Vincom Center"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Location Info */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ color: '#374151', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
                <MapPin size={18} style={{ marginRight: '0.5rem', color: '#10b981' }} />
                Thông tin vị trí
              </h3>
              
              <div className="form-group">
                <label htmlFor="address">Địa chỉ *</label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="VD: 72 Lê Thánh Tôn, Quận 1, TP.HCM"
                  disabled={isLoading}
                  rows={3}
                />
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label htmlFor="latitude">Latitude (Vĩ độ)</label>
                  <input
                    type="number"
                    id="latitude"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleInputChange}
                    placeholder="VD: 10.7769"
                    step="any"
                    min="-90"
                    max="90"
                    disabled={isLoading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="longitude">Longitude (Kinh độ)</label>
                  <input
                    type="number"
                    id="longitude"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleInputChange}
                    placeholder="VD: 106.7009"
                    step="any"
                    min="-180"
                    max="180"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div style={{
                background: '#f3f4f6', 
                padding: '0.75rem', 
                borderRadius: '0.5rem', 
                fontSize: '0.75rem',
                color: '#6b7280'
              }}>
                💡 <strong>Cách lấy tọa độ:</strong> Mở Google Maps → Click chuột phải vào vị trí → "What's here?"
              </div>
            </div>

            {/* Hardware Info */}
            <div style={{ marginBottom: '1.5rem' }}>
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
                    disabled={isLoading}
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
                    disabled={isLoading}
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
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                onClick={onClose}
                className="btn btn-outline"
                disabled={isLoading}
              >
                Hủy
              </button>
              <button 
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="loading"></div>
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Tạo trạm sạc
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StationForm;
