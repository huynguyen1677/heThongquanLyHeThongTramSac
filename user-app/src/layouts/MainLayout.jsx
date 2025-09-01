import React from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import ChargingConfirmationDialog from "../components/ChargingConfirmationDialog";
import { useCharging } from "../contexts/ChargingContext";
import "../styles/layout.css"; // nhớ tạo file này

function MainLayout() {
  const { confirmationRequest, respondConfirmation } = useCharging();
  console.log("MainLayout confirmationRequest:", confirmationRequest);

  return (
    <div className="main-layout">
      <Sidebar />
      <div className="main-content">
        <Header />
        <main className="page-content">
          <Outlet /> {/* Đây là nơi các trang con sẽ được render */}
        </main>
      </div>
      <ChargingConfirmationDialog
        confirmationRequest={confirmationRequest}
        onRespond={respondConfirmation}
      />
    </div>
  );
}

export default MainLayout;