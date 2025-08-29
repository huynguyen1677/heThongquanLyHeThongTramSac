import React from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import "../styles/layout.css"; // nhớ tạo file này

function MainLayout({ children }) {
  return (
    <div className="main-layout">
      <Sidebar />
      <div className="main-content">
        <Header />
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}

export default MainLayout;