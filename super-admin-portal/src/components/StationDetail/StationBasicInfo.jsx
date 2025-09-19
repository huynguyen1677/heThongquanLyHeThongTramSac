import React from 'react';
import { MapPin, Building, Phone, Mail, Calendar, User } from 'lucide-react';
import { formatDate } from '../../utils/formatUtils';

const StationBasicInfo = ({ station }) => {
  if (!station) return null;

  return (
    <div className="station-basic-info">
      <h3 className="section-title">Thông tin cơ bản</h3>
      
      <div className="info-grid">
        <div className="info-card">
          <div className="info-header">
            <Building className="info-icon" size={20} />
            <h4>Thông tin trạm</h4>
          </div>
          <div className="info-content">
            <div className="info-row">
              <label>ID Trạm:</label>
              <span>{station.id}</span>
            </div>
            <div className="info-row">
              <label>Tên trạm:</label>
              <span>{station.stationName || station.name || station.id}</span>
            </div>
            <div className="info-row">
              <label>Chủ sở hữu:</label>
              <span>{station.ownerId || 'Chưa xác định'}</span>
            </div>
            <div className="info-row">
              <label>Ngày tạo:</label>
              <span>{formatDate(station.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="info-card">
          <div className="info-header">
            <MapPin className="info-icon" size={20} />
            <h4>Vị trí</h4>
          </div>
          <div className="info-content">
            <div className="info-row">
              <label>Địa chỉ:</label>
              <span>{station.address || 'Chưa có thông tin'}</span>
            </div>
            <div className="info-row">
              <label>Thành phố:</label>
              <span>{station.city || 'Chưa có thông tin'}</span>
            </div>
            <div className="info-row">
              <label>Tọa độ:</label>
              <span>
                {station.latitude && station.longitude 
                  ? `${station.latitude}, ${station.longitude}`
                  : 'Chưa có thông tin'
                }
              </span>
            </div>
          </div>
        </div>

        <div className="info-card">
          <div className="info-header">
            <Phone className="info-icon" size={20} />
            <h4>Thông tin kỹ thuật</h4>
          </div>
          <div className="info-content">
            <div className="info-row">
              <label>Model:</label>
              <span>{station.model || 'Chưa có thông tin'}</span>
            </div>
            <div className="info-row">
              <label>Nhà sản xuất:</label>
              <span>{station.vendor || 'Chưa có thông tin'}</span>
            </div>
            <div className="info-row">
              <label>Firmware:</label>
              <span>{station.firmwareVersion || 'Chưa có thông tin'}</span>
            </div>
          </div>
        </div>

        <div className="info-card">
          <div className="info-header">
            <Calendar className="info-icon" size={20} />
            <h4>Trạng thái hiện tại</h4>
          </div>
          <div className="info-content">
            <div className="info-row">
              <label>Kết nối:</label>
              <span className={station.online ? 'status-online' : 'status-offline'}>
                {station.online ? 'Trực tuyến' : 'Ngoại tuyến'}
              </span>
            </div>
            <div className="info-row">
              <label>Heartbeat cuối:</label>
              <span>{formatDate(station.lastHeartbeat) || 'Chưa có dữ liệu'}</span>
            </div>
            <div className="info-row">
              <label>Cập nhật lần cuối:</label>
              <span>{formatDate(station.lastUpdated) || 'Chưa có dữ liệu'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StationBasicInfo;