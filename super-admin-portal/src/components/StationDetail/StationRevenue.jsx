import React from 'react';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '../../utils/formatUtils';

const StationRevenue = ({ payments }) => {
  if (!payments || payments.length === 0) {
    return (
      <div className="station-revenue">
        <h3 className="section-title">Doanh thu & Thanh toán</h3>
        <div className="empty-state">
          <DollarSign size={48} />
          <p>Chưa có dữ liệu doanh thu</p>
          <small>Trạm này chưa có giao dịch nào được ghi nhận</small>
        </div>
      </div>
    );
  }

  // Group payments by day for chart (last 30 days)
  const today = new Date();
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (29 - i));
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  });

  const dailyRevenue = last30Days.reduce((acc, dateStr) => {
    acc[dateStr] = 0;
    return acc;
  }, {});

  // Fill in actual payment data
  payments.forEach(payment => {
    const paymentDate = new Date(payment.createdAt).toISOString().split('T')[0];
    if (paymentDate in dailyRevenue) {
      dailyRevenue[paymentDate] += (payment.amount || 0);
    }
  });

  const recentPayments = payments
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 15); // Show more recent payments

  const maxDailyAmount = Math.max(...Object.values(dailyRevenue));
  const totalRevenue = Object.values(dailyRevenue).reduce((sum, amount) => sum + amount, 0);
  const averageDaily = totalRevenue / 30;

  // Tính toán chiều cao cho biểu đồ - đảm bảo có base line
  const chartMaxValue = maxDailyAmount > 0 ? maxDailyAmount : 100000; // Default 100k nếu không có data

  // Debug log để kiểm tra dữ liệu
  console.log('💰 StationRevenue Debug:', {
    paymentsCount: payments.length,
    dailyRevenue: Object.entries(dailyRevenue).filter(([, amount]) => amount > 0),
    maxDailyAmount,
    chartMaxValue,
    totalRevenue,
    samplePayment: payments[0]
  });

  return (
    <div className="station-revenue">
      <h3 className="section-title">Doanh thu & Thanh toán</h3>
      
      {/* Revenue Summary */}
      <div className="revenue-summary">
        <div className="summary-cards">
          <div className="summary-card primary">
            <DollarSign className="summary-icon" size={24} />
            <div className="summary-content">
              <h4>Tổng doanh thu (30 ngày)</h4>
              <div className="summary-value">{formatCurrency(totalRevenue)}</div>
              <div className="summary-sub">
                {payments.length} giao dịch
              </div>
            </div>
          </div>
          
          <div className="summary-card success">
            <DollarSign className="summary-icon" size={24} />
            <div className="summary-content">
              <h4>Trung bình/ngày</h4>
              <div className="summary-value">{formatCurrency(averageDaily)}</div>
              <div className="summary-sub">
                Dựa trên 30 ngày qua
              </div>
            </div>
          </div>

          <div className="summary-card info">
            <DollarSign className="summary-icon" size={24} />
            <div className="summary-content">
              <h4>Cao nhất/ngày</h4>
              <div className="summary-value">{formatCurrency(maxDailyAmount)}</div>
              <div className="summary-sub">
                Doanh thu tốt nhất
              </div>
            </div>
          </div>

          <div className="summary-card warning">
            <DollarSign className="summary-icon" size={24} />
            <div className="summary-content">
              <h4>Giao dịch TB</h4>
              <div className="summary-value">
                {formatCurrency(payments.length > 0 ? totalRevenue / payments.length : 0)}
              </div>
              <div className="summary-sub">
                Giá trị trung bình/giao dịch
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Revenue Chart - Improved */}
      <div className="daily-revenue-chart">
        <div className="chart-header">
          <h4>Doanh thu 30 ngày qua</h4>
          <div className="chart-stats">
            <span className="chart-stat">
              <strong>Tổng:</strong> {formatCurrency(totalRevenue)}
            </span>
            <span className="chart-stat">
              <strong>TB/ngày:</strong> {formatCurrency(averageDaily)}
            </span>
          </div>
        </div>
        <div className="chart-container">
          <div className="chart-y-axis">
            <span className="y-label">{formatCurrency(chartMaxValue)}</span>
            <span className="y-label">{formatCurrency(chartMaxValue * 0.75)}</span>
            <span className="y-label">{formatCurrency(chartMaxValue * 0.5)}</span>
            <span className="y-label">{formatCurrency(chartMaxValue * 0.25)}</span>
            <span className="y-label">0</span>
          </div>
          <div className="chart-bars">
            {Object.entries(dailyRevenue).map(([dateStr, amount]) => {
              const date = new Date(dateStr);
              const height = chartMaxValue > 0 ? (amount / chartMaxValue) * 100 : 0;
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;
              const dayLabel = date.getDate();
              const monthLabel = date.getMonth() + 1;
              
              return (
                <div key={dateStr} className="chart-bar-container">
                  <div 
                    className={`chart-bar ${isWeekend ? 'weekend' : ''} ${amount > 0 ? 'has-data' : 'no-data'}`}
                    style={{ height: `${Math.max(height, amount > 0 ? 3 : 1)}%` }}
                    title={`${dayLabel}/${monthLabel}: ${formatCurrency(amount)}`}
                  />
                  <div className="chart-label">
                    {dayLabel === 1 || dayLabel % 5 === 0 ? `${dayLabel}/${monthLabel}` : dayLabel}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="chart-legend">
          <div className="legend-item">
            <div className="legend-color weekday"></div>
            <span>Ngày thường</span>
          </div>
          <div className="legend-item">
            <div className="legend-color weekend"></div>
            <span>Cuối tuần</span>
          </div>
          <div className="legend-item">
            <div className="legend-color no-data"></div>
            <span>Không có giao dịch</span>
          </div>
        </div>
      </div>

      {/* Recent Payments - Improved */}
      <div className="recent-payments">
        <div className="payments-header">
          <h4>Giao dịch gần đây</h4>
          <div className="payments-summary">
            <span className="summary-text">
              Hiển thị {Math.min(recentPayments.length, 15)} trong {payments.length} giao dịch
            </span>
          </div>
        </div>
        
        {recentPayments.length > 0 ? (
          <div className="payments-table">
            <div className="table-header">
              <div>Thời gian</div>
              <div>Người dùng</div>
              <div>Phương thức</div>
              <div>Số tiền</div>
              <div>Trạng thái</div>
            </div>
            <div className="table-body">
              {recentPayments.map((payment, index) => (
                <div key={payment.id || index} className="table-row">
                  <div className="payment-time">
                    <div className="time-main">
                      {new Date(payment.createdAt).toLocaleDateString('vi-VN')}
                    </div>
                    <div className="time-sub">
                      {new Date(payment.createdAt).toLocaleTimeString('vi-VN', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                  <div className="user-info">
                    <span className="user-id">
                      {payment.userId || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className={`payment-method ${payment.method || 'unknown'}`}>
                      {payment.method === 'wallet' ? 'Ví điện tử' : 
                       payment.method === 'card' ? 'Thẻ tín dụng' : 
                       payment.method === 'bank' ? 'Chuyển khoản' : 
                       payment.method === 'cash' ? 'Tiền mặt' : 
                       'Không xác định'}
                    </span>
                  </div>
                  <div className="amount-cell">
                    <span className="amount">{formatCurrency(payment.amount || 0)}</span>
                  </div>
                  <div>
                    <span className={`payment-status ${payment.status || 'unknown'}`}>
                      {payment.status === 'completed' ? 'Thành công' :
                       payment.status === 'pending' ? 'Đang xử lý' :
                       payment.status === 'failed' ? 'Thất bại' :
                       payment.status === 'cancelled' ? 'Đã hủy' :
                       'Không xác định'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="no-payments">
            <p>Không có giao dịch nào trong khoảng thời gian này</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StationRevenue;