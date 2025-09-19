import React from 'react';
import { Clock, Users, Activity, CheckCircle, XCircle } from 'lucide-react';
import { formatDate } from '../../utils/formatUtils';

const StationSessions = ({ sessions, analytics }) => {
  if (!sessions || sessions.length === 0) {
    return (
      <div className="station-sessions">
        <h3 className="section-title">Phiên sạc</h3>
        <div className="empty-state">
          <Clock size={48} />
          <p>Chưa có phiên sạc nào</p>
        </div>
      </div>
    );
  }

  const getSessionStatusInfo = (status) => {
    switch (status) {
      case 'completed':
        return { icon: CheckCircle, text: 'Hoàn thành', color: 'success' };
      case 'active':
      case 'charging':
        return { icon: Activity, text: 'Đang sạc', color: 'info' };
      case 'stopped':
        return { icon: XCircle, text: 'Đã dừng', color: 'warning' };
      case 'failed':
        return { icon: XCircle, text: 'Thất bại', color: 'danger' };
      default:
        return { icon: Clock, text: status || 'Không xác định', color: 'secondary' };
    }
  };

  const recentSessions = sessions
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 20);

  // Group sessions by status
  const sessionsByStatus = sessions.reduce((acc, session) => {
    const status = session.status || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="station-sessions">
      <h3 className="section-title">Phiên sạc</h3>
      
      {/* Sessions Summary */}
      {analytics?.sessions && (
        <div className="sessions-summary">
          <div className="summary-cards">
            <div className="summary-card primary">
              <Users className="summary-icon" size={24} />
              <div className="summary-content">
                <h4>Tổng phiên sạc (30 ngày)</h4>
                <div className="summary-value">{analytics.sessions.total30Days}</div>
                <div className="summary-sub">
                  Trung bình {analytics.sessions.avgPerDay.toFixed(1)} phiên/ngày
                </div>
              </div>
            </div>
            
            <div className="summary-card info">
              <Clock className="summary-icon" size={24} />
              <div className="summary-content">
                <h4>Thời gian TB/phiên</h4>
                <div className="summary-value">
                  {(analytics.sessions.avgDuration / 60).toFixed(1)} giờ
                </div>
                <div className="summary-sub">
                  {analytics.sessions.avgDuration.toFixed(0)} phút
                </div>
              </div>
            </div>

            <div className="summary-card success">
              <Activity className="summary-icon" size={24} />
              <div className="summary-content">
                <h4>7 ngày qua</h4>
                <div className="summary-value">{analytics.sessions.total7Days}</div>
                <div className="summary-sub">
                  {analytics.sessions.growth7Days >= 0 ? '+' : ''}{analytics.sessions.growth7Days.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sessions by Status */}
      <div className="sessions-by-status">
        <h4>Phân bố theo trạng thái</h4>
        <div className="status-grid">
          {Object.entries(sessionsByStatus).map(([status, count]) => {
            const statusInfo = getSessionStatusInfo(status);
            const StatusIcon = statusInfo.icon;
            const percentage = ((count / sessions.length) * 100).toFixed(1);
            
            return (
              <div key={status} className={`status-card ${statusInfo.color}`}>
                <StatusIcon className="status-icon" size={20} />
                <div className="status-content">
                  <div className="status-text">{statusInfo.text}</div>
                  <div className="status-count">{count} phiên</div>
                  <div className="status-percentage">{percentage}%</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Sessions Table */}
      <div className="recent-sessions">
        <h4>Phiên sạc gần đây</h4>
        <div className="sessions-table">
          <div className="table-header">
            <div>Thời gian bắt đầu</div>
            <div>Người dùng</div>
            <div>Connector</div>
            <div>Thời lượng</div>
            <div>Năng lượng</div>
            <div>Trạng thái</div>
          </div>
          <div className="table-body">
            {recentSessions.map((session, index) => {
              const statusInfo = getSessionStatusInfo(session.status);
              const StatusIcon = statusInfo.icon;
              const duration = session.duration ? 
                `${Math.floor(session.duration / 60)}h ${session.duration % 60}m` : 
                'N/A';
              
              return (
                <div key={session.id || index} className="table-row">
                  <div>{formatDate(session.createdAt, 'vi-VN', { 
                    year: 'numeric', 
                    month: '2-digit', 
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</div>
                  <div>{session.userId || 'N/A'}</div>
                  <div>Connector {session.connectorId || 'N/A'}</div>
                  <div>{duration}</div>
                  <div>{session.energy ? `${session.energy.toFixed(2)} kWh` : 'N/A'}</div>
                  <div>
                    <span className={`session-status ${statusInfo.color}`}>
                      <StatusIcon size={14} />
                      {statusInfo.text}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StationSessions;