import React from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

function getStatusConfig(status) {
  switch (status) {
    case 'Charging': return { class: 'status-charging', icon: 'fa-bolt', text: 'Đang sạc', color: '#f59e0b' };
    case 'Completed': return { class: 'status-completed', icon: 'fa-check-circle', text: 'Hoàn thành', color: '#10b981' };
    case 'Cancelled': return { class: 'status-cancelled', icon: 'fa-times-circle', text: 'Đã hủy', color: '#6b7280' };
    case 'Failed': return { class: 'status-failed', icon: 'fa-exclamation-triangle', text: 'Thất bại', color: '#ef4444' };
    default: return { class: 'status-unknown', icon: 'fa-question-circle', text: status, color: '#6b7280' };
  }
}

function formatDuration(minutes) {
  if (!minutes) return '0 phút';
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours > 0) return `${hours}h ${mins > 0 ? mins + 'm' : ''}`;
  return `${mins}m`;
}

// Hàm helper để xử lý session.id an toàn
function formatSessionId(id) {
  if (!id) return 'N/A';
  
  // Chuyển về string trước khi slice
  const idString = String(id);
  
  // Nếu ID quá ngắn, trả về toàn bộ
  if (idString.length <= 8) return idString;
  
  // Lấy 8 ký tự cuối
  return idString.slice(-8);
}

const SessionCard = ({ session, viewMode }) => {
  const statusConfig = getStatusConfig(session.status);

  const cardStyles = {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '16px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden'
  };

  const cardHoverStyles = {
    ...cardStyles,
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
  };

  const headerStyles = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid #f3f4f6'
  };

  const statusBadgeStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#fff',
    backgroundColor: statusConfig.color
  };

  const mainInfoStyles = {
    marginBottom: '16px'
  };

  const stationNameStyles = {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#111827',
    margin: '0 0 8px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const stationAddressStyles = {
    fontSize: '0.875rem',
    color: '#6b7280',
    margin: '0',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  };

  const detailsStyles = {
    display: 'grid',
    gridTemplateColumns: viewMode === 'list' ? 'repeat(auto-fit, minmax(150px, 1fr))' : '1fr',
    gap: '12px',
    marginBottom: '16px'
  };

  const detailRowStyles = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px'
  };

  const detailItemStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.875rem',
    color: '#4b5563'
  };

  const timeInfoStyles = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    marginBottom: '16px'
  };

  const timeItemStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  };

  const timeLabelStyles = {
    fontSize: '0.75rem',
    color: '#6b7280',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  };

  const timeValueStyles = {
    fontSize: '0.875rem',
    color: '#111827',
    fontWeight: '600'
  };

  const footerStyles = {
    borderTop: '1px solid #f3f4f6',
    paddingTop: '16px'
  };

  const metricsStyles = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '16px'
  };

  const metricItemStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px'
  };

  const metricIconStyles = {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.125rem'
  };

  const energyIconStyles = {
    ...metricIconStyles,
    backgroundColor: '#fef3c7',
    color: '#d97706'
  };

  const costIconStyles = {
    ...metricIconStyles,
    backgroundColor: '#d1fae5',
    color: '#059669'
  };

  const metricInfoStyles = {
    display: 'flex',
    flexDirection: 'column'
  };

  const metricLabelStyles = {
    fontSize: '0.75rem',
    color: '#6b7280',
    fontWeight: '500'
  };

  const metricValueStyles = {
    fontSize: '0.875rem',
    color: '#111827',
    fontWeight: '700'
  };

  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div 
      style={isHovered ? cardHoverStyles : cardStyles}
      className={`session-card ${viewMode} ${statusConfig.class}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div style={headerStyles}>
        <div style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>
          #{formatSessionId(session.id)}
        </div>
        <div style={statusBadgeStyles}>
          <i className={`fas ${statusConfig.icon}`}></i>
          {statusConfig.text}
        </div>
      </div>

      {/* Main Info */}
      <div style={mainInfoStyles}>
        <h3 style={stationNameStyles}>
          <i className="fas fa-charging-station"></i>
          {session.stationName || session.stationId || 'Trạm không xác định'}
        </h3>
        <p style={stationAddressStyles}>
          <i className="fas fa-map-marker-alt"></i>
          {session.stationAddress || session.address || 'Địa chỉ không xác định'}
        </p>
      </div>

      {/* Details */}
      <div style={detailsStyles}>
        <div style={detailRowStyles}>
          <div style={detailItemStyles}>
            <i className="fas fa-plug"></i>
            <span>Cổng {session.connectorId || 'N/A'}</span>
          </div>
          <div style={detailItemStyles}>
            <i className="fas fa-bolt"></i>
            <span>{session.connectorType || 'AC'} - {session.power || session.powerKW || 'N/A'}kW</span>
          </div>
          {session.duration > 0 && (
            <div style={detailItemStyles}>
              <i className="fas fa-clock"></i>
              <span>{formatDuration(session.duration)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Time Info */}
      <div style={timeInfoStyles}>
        <div style={timeItemStyles}>
          <span style={timeLabelStyles}>Bắt đầu</span>
          <span style={timeValueStyles}>
            {session.startTime ? 
              format(new Date(session.startTime), 'HH:mm - dd/MM/yyyy', { locale: vi }) :
              'N/A'
            }
          </span>
        </div>
        {session.endTime && (
          <div style={timeItemStyles}>
            <span style={timeLabelStyles}>Kết thúc</span>
            <span style={timeValueStyles}>
              {format(new Date(session.endTime), 'HH:mm - dd/MM/yyyy', { locale: vi })}
            </span>
          </div>
        )}
      </div>

      {/* Footer Metrics */}
      <div style={footerStyles}>
        <div style={metricsStyles}>
          <div style={metricItemStyles}>
            <div style={energyIconStyles}>
              <i className="fas fa-battery-three-quarters"></i>
            </div>
            <div style={metricInfoStyles}>
              <span style={metricLabelStyles}>Năng lượng</span>
              <span style={metricValueStyles}>
                {((session.energyConsumed || 0) / 1000)} kWh
              </span>
            </div>
          </div>
          
          <div style={metricItemStyles}>
            <div style={costIconStyles}>
              <i className="fas fa-coins"></i>
            </div>
            <div style={metricInfoStyles}>
              <span style={metricLabelStyles}>Chi phí</span>
              <span style={metricValueStyles}>
                {(session.estimatedCost || session.cost || session.totalCost || 0).toLocaleString()}₫
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionCard;