import React from "react";
import "../styles/charging-dialog.css";

function ChargingConfirmationDialog({ confirmationRequest, onRespond }) {
  console.log("Dialog confirmationRequest:", confirmationRequest);

  // Đảm bảo chỉ return null khi confirmationRequest là null hoặc undefined
  if (!confirmationRequest) return null;

  return (
    <div className="charging-confirmation-dialog-overlay">
      <div className="charging-confirmation-dialog">
        <h3>Xác nhận bắt đầu sạc</h3>
        <p>
          Bạn có muốn bắt đầu sạc tại trạm <b>{confirmationRequest.stationId}</b> (Connector {confirmationRequest.connectorId}) không?
        </p>
        <div className="dialog-actions">
          <button onClick={() => onRespond(true)} className="btn btn-primary">Đồng ý</button>
          <button onClick={() => onRespond(false)} className="btn btn-outline">Hủy</button>
        </div>
      </div>
    </div>
  );
}

export default ChargingConfirmationDialog;