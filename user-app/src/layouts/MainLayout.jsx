import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import ChargingConfirmationDialog from "../components/ChargingConfirmationDialog";
import { useCharging } from "../contexts/ChargingContext";
import "../styles/layout-clean.css";

function MainLayout() {
  const { confirmationRequest, respondConfirmation } = useCharging();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="main-layout">
      {/* Mobile Header */}
      <div className="mobile-header">
        <button 
          className="mobile-menu-toggle"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <i className="fas fa-bars"></i>
        </button>
        <div className="mobile-logo">
          <i className="fas fa-charging-station"></i>
          <span>EV Station</span>
        </div>
        <div className="mobile-user">
          <i className="fas fa-user-circle"></i>
        </div>
      </div>

      {/* Main Container */}
      <div className="layout-container">
        {/* Sidebar với overlay cho mobile */}
        <div className={`sidebar-wrapper ${isSidebarOpen ? 'open' : ''}`}>
          <Sidebar onClose={() => setIsSidebarOpen(false)} />
        </div>
        
        {/* Sidebar Overlay cho mobile */}
        {isSidebarOpen && (
          <div 
            className="sidebar-overlay active"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}
        
        {/* Main Content */}
        <div className="main-content">
          {/* Desktop Header - ẩn trên mobile */}
          <div className="desktop-header">
            <Header />
          </div>
          
          {/* Page Content */}
          <main className="page-content">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-nav">
        <a href="/" className="nav-item">
          <i className="fas fa-home"></i>
          <span>Trang chủ</span>
        </a>
        <a href="/stations" className="nav-item">
          <i className="fas fa-map-marker-alt"></i>
          <span>Trạm sạc</span>
        </a>
        <a href="/history" className="nav-item">
          <i className="fas fa-history"></i>
          <span>Lịch sử</span>
        </a>
        <a href="/wallet" className="nav-item">
          <i className="fas fa-wallet"></i>
          <span>Ví</span>
        </a>
        <a href="/profile" className="nav-item">
          <i className="fas fa-user"></i>
          <span>Hồ sơ</span>
        </a>
      </nav>
      
      <ChargingConfirmationDialog
        confirmationRequest={confirmationRequest}
        onRespond={respondConfirmation}
      />
    </div>
  );
}

export default MainLayout;