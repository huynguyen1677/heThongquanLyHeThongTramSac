import React from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import ChargingConfirmationDialog from "../components/ChargingConfirmationDialog";
import { useCharging } from "../contexts/ChargingContext";
import "../styles/layout-clean.css";

function MainLayout() {
  const { confirmationRequest, respondConfirmation } = useCharging();
  console.log("MainLayout confirmationRequest:", confirmationRequest);

  return (
    <div className="main-layout">
      {/* Main Container */}
      <div className="layout-container">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content */}
        <div className="main-content">
          {/* Header */}
          <Header />
          
          {/* Page Content */}
          <main className="page-content">
            <Outlet /> {/* Đây là nơi các trang con sẽ được render */}
          </main>
        </div>
      </div>
      
      <ChargingConfirmationDialog
        confirmationRequest={confirmationRequest}
        onRespond={respondConfirmation}
      />
    </div>
  );
}

export default MainLayout;