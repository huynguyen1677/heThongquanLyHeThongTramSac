import React from "react";
import { useNavigate } from "react-router-dom";
import useStations from "../contexts/useStations";
import "../styles/station-list.css";

function StationList({ stations: propStations, title }) {
  const navigate = useNavigate();
  // Nếu không truyền prop, tự lấy từ hook
  const { stations: contextStations, loading, error } = useStations();

  // Ưu tiên dùng prop, nếu không có thì dùng context
  const stations = propStations || contextStations;

  if ((loading && !propStations)) return <div>Đang tải...</div>;
  if (error && !propStations) return <div style={{ color: "red" }}>{error}</div>;
  if (!stations || stations.length === 0) return <div>Không có trạm nào.</div>;

  return (
    <div className="station-list-wrapper">
      <h2 className="station-list-title">{title || "Danh sách trạm sạc"}</h2>
      <div className="station-list">
        {stations.map(station => (
          <div key={station.id} className="station-card">
            <div className="station-card-header">
              <div
                className={`station-status ${station.online ? "online" : "offline"}`}
                title={station.online ? "Online" : "Offline"}
              />
              <h3 className="station-card-name">
                {station.stationName || station.name || station.id || "Không có tên"}
              </h3>
            </div>
            <div className="station-card-address">
              <strong>Địa chỉ:</strong> {station.address || "Chưa cập nhật"}
            </div>
            <div className="station-card-status">
              <strong>Trạng thái:</strong>{" "}
              <span className={station.online ? "online" : "offline"}>
                {station.status || (station.online ? "Online" : "Offline")}
              </span>
            </div>
            <div className="station-card-connectors">
              <strong>Số cổng sạc:</strong>{" "}
              {Array.isArray(station.connectors)
                ? station.connectors.length
                : station.connectors
                ? Object.keys(station.connectors).length
                : 0}
            </div>
            {/* Hiển thị connectors */}
            {station.connectors && (
              <div className="station-card-connector-list">
                <strong>Connectors:</strong>
                <ul className="connector-list">
                  {(Array.isArray(station.connectors)
                    ? station.connectors
                    : Object.entries(station.connectors).map(([id, val]) => ({ id, ...val }))
                  ).map((connector, idx) => (
                    <li
                      key={connector.id || connector.type || idx}
                      className="connector-item"
                    >
                      <div>
                        <span className="connector-name">
                          {connector.type || connector.id || `Connector ${idx + 1}`}
                        </span>
                        {" - "}
                        <span
                          className={`connector-status ${connector.status?.toLowerCase() || ""}`}
                        >
                          {connector.status || "Unknown"}
                        </span>
                        {connector.power && (
                          <>
                            {" - "}
                            <span className="connector-power">
                              {connector.power} kW
                            </span>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="station-card-extra">
              <div>
                <strong>Model:</strong> {station.model || "N/A"}
              </div>
              <div>
                <strong>Vendor:</strong> {station.vendor || "N/A"}
              </div>
              <div>
                <strong>Firmware:</strong> {station.firmwareVersion || "N/A"}
              </div>
              <div>
                <strong>ID:</strong> {station.id}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StationList;