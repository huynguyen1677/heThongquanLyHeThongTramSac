import React from "react";
import { NavLink } from "react-router-dom";
import "../styles/sidebar-clean.css";

function Sidebar() {
  return (
    <div className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-container">
          <div className="logo-icon">
            <i className="fas fa-charging-station"></i>
          </div>
          <div className="logo-text">
            <h1>EV Station</h1>
            <p>User App</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="sidebar-nav">
        <NavLink 
          to="/" 
          className={({ isActive }) => 
            `sidebar-item ${isActive ? 'active' : ''}`
          }
          end
        >
          <div className="nav-content">
            <i className="fas fa-home"></i>
            <span>Trang chủ</span>
          </div>
        </NavLink>
        
        <NavLink 
          to="/history" 
          className={({ isActive }) => 
            `sidebar-item ${isActive ? 'active' : ''}`
          }
        >
          <div className="nav-content">
            <i className="fas fa-history"></i>
            <span>Lịch sử sạc</span>
          </div>
        </NavLink>
        
        <NavLink 
          to="/stations" 
          className={({ isActive }) => 
            `sidebar-item ${isActive ? 'active' : ''}`
          }
        >
          <div className="nav-content">
            <i className="fas fa-map-marker-alt"></i>
            <span>Tìm trạm sạc</span>
          </div>
        </NavLink>
        
        <NavLink 
          to="/wallet" 
          className={({ isActive }) => 
            `sidebar-item ${isActive ? 'active' : ''}`
          }
        >
          <div className="nav-content">
            <i className="fas fa-wallet"></i>
            <span>Ví điện tử</span>
          </div>
        </NavLink>
        
        <NavLink 
          to="/profile" 
          className={({ isActive }) => 
            `sidebar-item ${isActive ? 'active' : ''}`
          }
        >
          <div className="nav-content">
            <i className="fas fa-user"></i>
            <span>Hồ sơ</span>
          </div>
        </NavLink>
        
        <NavLink 
          to="/settings" 
          className={({ isActive }) => 
            `sidebar-item ${isActive ? 'active' : ''}`
          }
        >
          <div className="nav-content">
            <i className="fas fa-cog"></i>
            <span>Cài đặt</span>
          </div>
        </NavLink>
      </nav>
    </div>
  );
}

export default Sidebar;