import React from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import ChargingConfirmationDialog from "../components/ChargingConfirmationDialog";
import { useCharging } from "../contexts/ChargingContext";
import "../styles/layout.css";

function MainLayout() {
  const { confirmationRequest, respondConfirmation } = useCharging();

  return (
    <div className="main-layout">
      <Header />
      <main className="page-content">
        <Outlet />
      </main>
      <ChargingConfirmationDialog
        confirmationRequest={confirmationRequest}
        onRespond={respondConfirmation}
      />
    </div>
  );
}

export default MainLayout;