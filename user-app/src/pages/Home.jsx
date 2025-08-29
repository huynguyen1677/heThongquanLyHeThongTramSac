import React from "react";
import "../styles/home.css";
import StationList from "../components/StationList";
import ChargingConfirmationDialog from '../components/ChargingConfirmationDialog';
import StationMap from "../components/StationMap";
import useStations from "../contexts/useStations";

function Home() {
  const { stations, loading, error } = useStations();

  // Lọc trạm nổi bật (ví dụ: 2 trạm đầu)
  const featuredStations = stations.slice(0, 2);

  // Lọc ra các trạm có đủ latitude và longitude
  const validStations = stations.filter(
    s => typeof s.latitude === "number" && typeof s.longitude === "number"
  );

  return (
    <div className="home">
      {/* Hero section */}
      <section className="home-hero">
        <div className="home-hero-text">
          <h1>Chào mừng đến với hệ thống trạm sạc EV</h1>
          <p>
            Tìm kiếm, quản lý và sử dụng trạm sạc xe điện một cách dễ dàng, hiện đại và an toàn.
          </p>
        </div>
        <img
          src="/ev-hero.png"
          alt="EV Charging"
          className="home-hero-img"
        />
      </section>

      {/* Featured stations */}
      <section className="home-featured">
        <h2>Trạm sạc nổi bật</h2>
        {loading ? (
          <div>Đang tải...</div>
        ) : error ? (
          <div style={{ color: "red" }}>{error}</div>
        ) : (
          <StationList stations={featuredStations} title="Trạm sạc nổi bật" />
        )}
      </section>

      {/* Quick access */}
      <section className="home-quick">
        <a href="/find" className="quick-card">🔍 Tìm trạm</a>
        <a href="/history" className="quick-card">📜 Lịch sử</a>
        <a href="/settings" className="quick-card">⚙️ Cài đặt</a>
      </section>

      {/* Stats */}
      <section className="home-stats">
        <div className="stat-box">
          <div className="stat-value">12</div>
          <div className="stat-label">Trạm sạc</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">36</div>
          <div className="stat-label">Phiên sạc</div>
        </div>
        <div className="stat-box">
          <div className="stat-value online"></div>
          <div className="stat-label">Hệ thống hoạt động</div>
        </div>
      </section>

      {/* Tips */}
      <section className="home-tips">
        <h2>Mẹo an toàn & Giá điện</h2>
        <ul>
          <li>🔌 Luôn kiểm tra đầu sạc trước khi sử dụng.</li>
          <li>⚡ Không sạc xe khi trời mưa lớn.</li>
          <li>💡 Giá điện hiện tại: <b>2.500đ/kWh</b></li>
        </ul>
      </section>

      {/* Map section */}
      <section className="home-map">
        <h2>Bản đồ trạm sạc</h2>
        <StationMap stations={validStations} />
      </section>
    </div>
  );
}

export default Home;