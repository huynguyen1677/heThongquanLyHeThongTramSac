import React, { useState } from "react";
import "../styles/home.css";
import StationList from "../components/StationList";
import StationMap from "../components/StationMap";
import { useCharging } from "../contexts/ChargingContext";
import StationDetailPopup from "../components/StationDetailPopup";
import { Link } from "react-router-dom";

function Home() {
  const { stations, stationsLoading: loading, stationsError: error } = useCharging();
  const [selectedStation, setSelectedStation] = useState(null);

  // Lọc trạm nổi bật (ví dụ: 4 trạm đầu)
  const featuredStations = stations.slice(0, 4);

  // Lọc ra các trạm có đủ latitude và longitude
  const validStations = stations.filter(
    s => typeof s.latitude === "number" && typeof s.longitude === "number"
  );

  // Tính toán thống kê
  const totalStations = stations.length;
  const totalSessions = 156; // Mock data - có thể lấy từ context sau
  const onlineStations = stations.filter(
    s =>
      (typeof s.status === "string" && s.status.toLowerCase() === "available") ||
      s.online === true
  ).length;

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              <span className="gradient-text">Chào mừng đến với</span>
              <br />
              EV Charging Station
            </h1>
            <p className="hero-description">
              Tìm kiếm, quản lý và sử dụng trạm sạc xe điện một cách dễ dàng, hiện đại và an toàn.
              Hệ thống thông minh giúp bạn tối ưu hóa trải nghiệm sạc xe điện.
            </p>
            <div className="hero-actions">
              <Link to="/stations" className="btn btn-primary btn-hero">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                </svg>
                Tìm trạm sạc
              </Link>
              <Link to="/history" className="btn btn-secondary btn-hero">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12,6 12,12 16,14"/>
                </svg>
                Xem lịch sử
              </Link>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-image-container">
              <img
                src="/api/placeholder/400/300"
                alt="EV Charging Station"
                className="hero-image"
              />
              <div className="hero-badge">
                <span className="badge-icon">⚡</span>
                <span className="badge-text">Eco-Friendly</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon stat-icon-primary">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{totalStations}</div>
              <div className="stat-label">Trạm sạc</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon stat-icon-success">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{totalSessions}</div>
              <div className="stat-label">Phiên sạc</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon stat-icon-info">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{onlineStations}</div>
              <div className="stat-label">Đang hoạt động</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon stat-icon-warning">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">99.9%</div>
              <div className="stat-label">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="quick-actions-section">
        <h2 className="section-title">Truy cập nhanh</h2>
        <div className="quick-actions-grid">
          <Link to="/stations" className="quick-action-card">
            <div className="quick-action-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
            </div>
            <div className="quick-action-content">
              <h3>Tìm trạm sạc</h3>
              <p>Tìm kiếm trạm sạc gần bạn nhất</p>
            </div>
            <div className="quick-action-arrow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9,18 15,12 9,6"/>
              </svg>
            </div>
          </Link>

          <Link to="/history" className="quick-action-card">
            <div className="quick-action-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12,6 12,12 16,14"/>
              </svg>
            </div>
            <div className="quick-action-content">
              <h3>Lịch sử sạc</h3>
              <p>Xem các phiên sạc đã thực hiện</p>
            </div>
            <div className="quick-action-arrow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9,18 15,12 9,6"/>
              </svg>
            </div>
          </Link>

          <Link to="/profile" className="quick-action-card">
            <div className="quick-action-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div className="quick-action-content">
              <h3>Hồ sơ cá nhân</h3>
              <p>Quản lý thông tin tài khoản</p>
            </div>
            <div className="quick-action-arrow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9,18 15,12 9,6"/>
              </svg>
            </div>
          </Link>

          <Link to="/settings" className="quick-action-card">
            <div className="quick-action-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6"/>
              </svg>
            </div>
            <div className="quick-action-content">
              <h3>Cài đặt</h3>
              <p>Tùy chỉnh ứng dụng theo ý bạn</p>
            </div>
            <div className="quick-action-arrow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9,18 15,12 9,6"/>
              </svg>
            </div>
          </Link>
        </div>
      </section>

      {/* Featured Stations */}
      <section className="featured-section">
        <div className="section-header">
          <h2 className="section-title">Trạm sạc nổi bật</h2>
          <Link to="/stations" className="section-link">
            Xem tất cả
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9,18 15,12 9,6"/>
            </svg>
          </Link>
        </div>
        
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <div className="loading-text">Đang tải trạm sạc...</div>
          </div>
        ) : error ? (
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <div className="error-message">{error}</div>
          </div>
        ) : (
          <StationList stations={featuredStations} />
        )}
      </section>

      {/* Map Section */}
      <section className="map-section">
        <div className="section-header">
          <h2 className="section-title">Bản đồ trạm sạc</h2>
          <div className="map-info">
            <span className="info-badge">
              <span className="online-indicator"></span>
              {onlineStations} trạm đang hoạt động
            </span>
          </div>
        </div>
        <div className="map-container">
          <StationMap stations={validStations} onStationClick={setSelectedStation} />
        </div>
      </section>

      {/* Tips & Pricing */}
      <section className="tips-section">
        <div className="tips-grid">
          <div className="tips-card">
            <div className="tips-header">
              <div className="tips-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4"/>
                  <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
                  <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
                  <path d="M13 12h3"/>
                  <path d="M8 12H5"/>
                </svg>
              </div>
              <h3>Mẹo an toàn</h3>
            </div>
            <ul className="tips-list">
              <li>🔌 Luôn kiểm tra đầu sạc trước khi sử dụng</li>
              <li>⚡ Không sạc xe khi trời mưa lớn</li>
              <li>🚗 Đảm bảo xe dừng đúng vị trí</li>
              <li>📱 Sử dụng app để theo dõi tiến trình</li>
            </ul>
          </div>

          <div className="pricing-card">
            <div className="pricing-header">
              <div className="pricing-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <h3>Giá điện hiện tại</h3>
            </div>
            <div className="pricing-info">
              <div className="price-main">
                <span className="price-value">2.500đ</span>
                <span className="price-unit">/kWh</span>
              </div>
              <div className="price-note">
                <span className="price-badge">Giờ thường</span>
                <span className="price-time">6:00 - 22:00</span>
              </div>
              <div className="price-alt">
                <span className="price-value-alt">1.800đ/kWh</span>
                <span className="price-time-alt">22:00 - 6:00</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Station Detail Popup */}
      {selectedStation && (
        <StationDetailPopup
          station={selectedStation}
          onClose={() => setSelectedStation(null)}
        />
      )}
    </div>
  );
}

export default Home;