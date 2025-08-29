import React from "react";
import { NavLink } from "react-router-dom";
import "../styles/sidebar.css";

function Sidebar() {
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <NavLink to="/" className="sidebar-link" end>
          Trang chủ
        </NavLink>
        <NavLink to="/find" className="sidebar-link">
          Tìm trạm
        </NavLink>
        <NavLink to="/history" className="sidebar-link">
          Lịch sử
        </NavLink>
        <NavLink to="/settings" className="sidebar-link">
          Cài đặt
        </NavLink>
      </nav>
    </aside>
  );
}

export default Sidebar;