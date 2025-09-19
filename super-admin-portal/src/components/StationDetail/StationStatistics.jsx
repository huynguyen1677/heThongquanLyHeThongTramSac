import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Clock, Users, Battery, Zap } from 'lucide-react';
import { formatCurrency, formatNumber } from '../../utils/formatUtils';

const StationStatistics = ({ analytics }) => {
  if (!analytics) return null;

  const { revenue, sessions, utilization } = analytics;

  const StatCard = ({ icon: Icon, title, value, subValue, trend, color = 'primary' }) => (
    <div className={`stat-card ${color}`}>
      <div className="stat-header">
        <Icon className="stat-icon" size={24} />
        <div className="stat-trend">
          {trend !== undefined && (
            <>
              {trend >= 0 ? (
                <TrendingUp className="trend-icon positive" size={16} />
              ) : (
                <TrendingDown className="trend-icon negative" size={16} />
              )}
              <span className={`trend-value ${trend >= 0 ? 'positive' : 'negative'}`}>
                {Math.abs(trend).toFixed(1)}%
              </span>
            </>
          )}
        </div>
      </div>
      <div className="stat-content">
        <h3 className="stat-title">{title}</h3>
        <div className="stat-value">{value}</div>
        {subValue && <div className="stat-subvalue">{subValue}</div>}
      </div>
    </div>
  );

  return (
    <div className="station-statistics">
      <h3 className="section-title">Thống kê 30 ngày qua</h3>
      
      <div className="stats-grid">
        {/* Revenue Stats */}
        <StatCard
          icon={DollarSign}
          title="Doanh thu"
          value={formatCurrency(revenue.total30Days)}
          subValue={`Trung bình ${formatCurrency(revenue.avgPerDay)}/ngày`}
          trend={revenue.growth7Days}
          color="success"
        />

        {/* Sessions Stats */}
        <StatCard
          icon={Users}
          title="Phiên sạc"
          value={formatNumber(sessions.total30Days)}
          subValue={`Trung bình ${sessions.avgPerDay.toFixed(1)} phiên/ngày`}
          trend={sessions.growth7Days}
          color="info"
        />

        {/* Duration Stats */}
        <StatCard
          icon={Clock}
          title="Thời gian sạc TB"
          value={`${(sessions.avgDuration / 60).toFixed(1)} giờ`}
          subValue={`${sessions.avgDuration.toFixed(0)} phút`}
          color="warning"
        />

        {/* Utilization Stats */}
        <StatCard
          icon={Battery}
          title="Tỷ lệ sử dụng"
          value={`${utilization.rate.toFixed(1)}%`}
          subValue={`${utilization.usedHours.toFixed(0)}/${utilization.totalPossibleHours.toFixed(0)} giờ`}
          color={utilization.rate > 50 ? 'success' : utilization.rate > 25 ? 'warning' : 'danger'}
        />
      </div>

      {/* Detailed Metrics */}
      <div className="detailed-metrics">
        <div className="metrics-section">
          <h4>Chi tiết doanh thu</h4>
          <div className="metrics-grid">
            <div className="metric-item">
              <label>30 ngày qua:</label>
              <span>{formatCurrency(revenue.total30Days)}</span>
            </div>
            <div className="metric-item">
              <label>7 ngày qua:</label>
              <span>{formatCurrency(revenue.total7Days)}</span>
            </div>
            <div className="metric-item">
              <label>Trung bình/ngày:</label>
              <span>{formatCurrency(revenue.avgPerDay)}</span>
            </div>
            <div className="metric-item">
              <label>Xu hướng 7 ngày:</label>
              <span className={revenue.growth7Days >= 0 ? 'positive' : 'negative'}>
                {revenue.growth7Days >= 0 ? '+' : ''}{revenue.growth7Days.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <div className="metrics-section">
          <h4>Chi tiết phiên sạc</h4>
          <div className="metrics-grid">
            <div className="metric-item">
              <label>Tổng phiên sạc:</label>
              <span>{formatNumber(sessions.total30Days)}</span>
            </div>
            <div className="metric-item">
              <label>7 ngày qua:</label>
              <span>{formatNumber(sessions.total7Days)}</span>
            </div>
            <div className="metric-item">
              <label>Thời gian TB:</label>
              <span>{(sessions.avgDuration / 60).toFixed(1)} giờ</span>
            </div>
            <div className="metric-item">
              <label>Xu hướng 7 ngày:</label>
              <span className={sessions.growth7Days >= 0 ? 'positive' : 'negative'}>
                {sessions.growth7Days >= 0 ? '+' : ''}{sessions.growth7Days.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <div className="metrics-section">
          <h4>Hiệu suất sử dụng</h4>
          <div className="metrics-grid">
            <div className="metric-item">
              <label>Tỷ lệ sử dụng:</label>
              <span>{utilization.rate.toFixed(1)}%</span>
            </div>
            <div className="metric-item">
              <label>Số connector:</label>
              <span>{utilization.totalConnectors}</span>
            </div>
            <div className="metric-item">
              <label>Giờ đã sử dụng:</label>
              <span>{utilization.usedHours.toFixed(0)} giờ</span>
            </div>
            <div className="metric-item">
              <label>Tổng giờ có thể:</label>
              <span>{utilization.totalPossibleHours.toFixed(0)} giờ</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StationStatistics;