import StationList from "../components/StationList";
import { useCharging } from '../contexts/ChargingContext'

function Home() {
  const { confirmationRequest, respondToConfirmationRequest } = useCharging();

  return (
    <div>
      <h1>Trang chủ</h1>
      <StationList />

      {/* Popup xác nhận sạc từ CSMS */}
      <ChargingConfirmationDialog
        confirmationRequest={confirmationRequest}
        onRespond={respondToConfirmationRequest}
      />
    </div>
  );
}

function ChargingConfirmationDialog({ confirmationRequest, onRespond }) {
  if (!confirmationRequest) return null;
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Yêu cầu xác nhận sạc</h3>
        <p>
          Trạm <b>{confirmationRequest.stationId}</b> - Cổng <b>{confirmationRequest.connectorId}</b> muốn bắt đầu sạc.<br />
          Bạn có đồng ý không?
        </p>
        <div className="modal-actions">
          <button onClick={() => onRespond(true)} className="start-button">Đồng ý</button>
          <button onClick={() => onRespond(false)} className="stop-button">Từ chối</button>
        </div>
      </div>
    </div>
  );
}

export default Home;