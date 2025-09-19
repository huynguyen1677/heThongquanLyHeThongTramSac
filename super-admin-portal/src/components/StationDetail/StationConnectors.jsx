import React from 'react';
import { Zap, Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { formatDate } from '../../utils/formatUtils';

const StationConnectors = ({ realtimeData }) => {
  if (!realtimeData?.connectors) {
    return (
      <div className="station-connectors">
        <h3 className="section-title">Connectors</h3>
        <div className="empty-state">
          <Zap size={48} />
          <p>Không có thông tin connector</p>
        </div>
      </div>
    );
  }

  const connectors = Object.entries(realtimeData.connectors);

  const getConnectorStatusInfo = (status) => {
    switch (status) {
      case 'Available':
        return { icon: CheckCircle, text: 'Sẵn sàng', color: 'success' };
      case 'Occupied':
        return { icon: Activity, text: 'Đang sạc', color: 'info' };
      case 'Charging':
        return { icon: Activity, text: 'Đang sạc', color: 'warning' };
      case 'Faulted':
        return { icon: AlertTriangle, text: 'Lỗi', color: 'danger' };
      case 'Unavailable':
        return { icon: AlertTriangle, text: 'Không khả dụng', color: 'secondary' };
      default:
        return { icon: AlertTriangle, text: status || 'Không xác định', color: 'secondary' };
    }
  };

  return (
    <div className="station-connectors">
      <h3 className="section-title">Connectors ({connectors.length})</h3>
      
      <div className="connectors-grid">
        {connectors.map(([connectorId, connector]) => {
          const statusInfo = getConnectorStatusInfo(connector.status);
          const StatusIcon = statusInfo.icon;
          
          return (
            <div key={connectorId} className={`connector-card ${statusInfo.color}`}>
              <div className="connector-header">
                <div className="connector-id">
                  <Zap size={20} />
                  <span>Connector {connectorId}</span>
                </div>
                <div className={`connector-status ${statusInfo.color}`}>
                  <StatusIcon size={16} />
                  <span>{statusInfo.text}</span>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="connector-quick-stats">
                <div className="quick-stat">
                  <span className="stat-label">Công suất</span>
                  <span className="stat-value power">{connector.powerKw || 0} kW</span>
                </div>
                <div className="quick-stat">
                  <span className="stat-label">Năng lượng</span>
                  <span className="stat-value energy">{connector.currentEnergyKwh || 0} kWh</span>
                </div>
                {connector.chargeProgress !== undefined && (
                  <div className="quick-stat">
                    <span className="stat-label">Tiến độ</span>
                    <span className="stat-value progress">{connector.chargeProgress}%</span>
                  </div>
                )}
              </div>
              
              <div className="connector-details">
                <div className="detail-row">
                  <label>Trạng thái:</label>
                  <span className={`connector-status-text ${statusInfo.color}`}>
                    {statusInfo.text} ({connector.status})
                  </span>
                </div>
                <div className="detail-row">
                  <label>Mã lỗi:</label>
                  <span className={connector.errorCode === 'NoError' ? 'status-success' : 'status-error'}>
                    {connector.errorCode || 'Không xác định'}
                  </span>
                </div>
                <div className="detail-row">
                  <label>Công suất hiện tại:</label>
                  <span className="power-value">
                    {connector.powerKw ? `${connector.powerKw} kW` : '0 kW'}
                  </span>
                </div>
                <div className="detail-row">
                  <label>Năng lượng hiện tại:</label>
                  <span className="energy-value">
                    {connector.currentEnergyKwh ? `${connector.currentEnergyKwh} kWh` : '0 kWh'}
                  </span>
                </div>
                {connector.duration && (
                  <div className="detail-row">
                    <label>Thời gian sạc:</label>
                    <span className="duration-value">{connector.duration}</span>
                  </div>
                )}
                {connector.chargeProgress !== undefined && (
                  <div className="detail-row">
                    <label>Tiến độ sạc:</label>
                    <div className="progress-container">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${Math.min(connector.chargeProgress, 100)}%` }}
                        ></div>
                      </div>
                      <span className="progress-value">{connector.chargeProgress}%</span>
                    </div>
                  </div>
                )}
                {connector.estimatedCost && (
                  <div className="detail-row">
                    <label>Chi phí ước tính:</label>
                    <span className="cost-value">{connector.estimatedCost.toLocaleString('vi-VN')} VNĐ</span>
                  </div>
                )}
                {connector.fullChargeThresholdKwh && (
                  <div className="detail-row">
                    <label>Ngưỡng sạc đầy:</label>
                    <span>{connector.fullChargeThresholdKwh} kWh</span>
                  </div>
                )}
                <div className="detail-row">
                  <label>Cập nhật cuối:</label>
                  <span>{formatDate(connector.lastUpdate || connector.lastUpdated) || 'Chưa có dữ liệu'}</span>
                </div>
              </div>
                
              {connector.currentSession && (
                <div className="current-session">
                  <h5>Phiên sạc hiện tại:</h5>
                  <div className="detail-row">
                    <label>Người dùng:</label>
                    <span>{connector.currentSession.userId || 'Không xác định'}</span>
                  </div>
                  <div className="detail-row">
                    <label>Bắt đầu:</label>
                    <span>{formatDate(connector.currentSession.startTime)}</span>
                  </div>
                  <div className="detail-row">
                    <label>Năng lượng:</label>
                    <span>{connector.currentSession.energy || 0} kWh</span>
                  </div>
                  <div className="detail-row">
                    <label>Thời gian:</label>
                    <span>
                      {connector.currentSession.duration 
                        ? `${Math.floor(connector.currentSession.duration / 60)} phút`
                        : 'Đang tính...'
                      }
                    </span>
                  </div>
                </div>
              )}
              
              {connector.lastSession && !connector.currentSession && (
                <div className="last-session">
                  <h5>Phiên sạc cuối:</h5>
                  <div className="detail-row">
                    <label>Kết thúc:</label>
                    <span>{formatDate(connector.lastSession.endTime)}</span>
                  </div>
                  <div className="detail-row">
                    <label>Năng lượng:</label>
                    <span>{connector.lastSession.energy || 0} kWh</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StationConnectors;