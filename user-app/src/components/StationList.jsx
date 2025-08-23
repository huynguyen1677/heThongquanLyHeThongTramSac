import React from "react";
import { useCharging } from "../contexts/ChargingContext";

const statusColor = (online) => (online ? "#4caf50" : "#f44336");

function StationList() {
  const { stations, loading } = useCharging();

  if (loading) return <div>Đang tải...</div>;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h2 style={{ textAlign: "center", margin: "24px 0" }}>Danh sách trạm sạc</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "center" }}>
        {stations.map(station => (
          <div
            key={station.id}
            style={{
              minWidth: 320,
              maxWidth: 380,
              flex: "1 1 340px",
              background: "#fff",
              border: "1px solid #e0e0e0",
              borderRadius: 16,
              boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
              padding: 20,
              marginBottom: 16,
              transition: "box-shadow 0.2s",
              position: "relative"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: statusColor(station.online),
                  marginRight: 10,
                  border: "2px solid #fff",
                  boxShadow: "0 0 0 2px #eee"
                }}
                title={station.online ? "Online" : "Offline"}
              />
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
                {station.stationName || station.name || station.id || "Không có tên"}
              </h3>
            </div>
            <div style={{ color: "#757575", marginBottom: 8 }}>
              <strong>Địa chỉ:</strong> {station.address || "Chưa cập nhật"}
            </div>
            <div style={{ marginBottom: 8 }}>
              <strong>Trạng thái:</strong>{" "}
              <span style={{ color: statusColor(station.online), fontWeight: 500 }}>
                {station.status || (station.online ? "Online" : "Offline")}
              </span>
            </div>
            <div style={{ marginBottom: 8 }}>
              <strong>Số cổng sạc:</strong>{" "}
              {Array.isArray(station.connectors)
                ? station.connectors.length
                : station.connectors
                ? Object.keys(station.connectors).length
                : 0}
            </div>
            {/* Hiển thị connectors */}
            {station.connectors && (
              <div style={{ marginTop: 10 }}>
                <strong>Connectors:</strong>
                <ul style={{ paddingLeft: 18, margin: 0 }}>
                  {(Array.isArray(station.connectors)
                    ? station.connectors
                    : Object.entries(station.connectors).map(([id, val]) => ({ id, ...val }))
                  ).map((connector, idx) => (
                    <li
                      key={connector.id || connector.type || idx}
                      style={{
                        marginBottom: 6,
                        background: "#f5f5f5",
                        borderRadius: 8,
                        padding: "6px 10px"
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 500 }}>
                          Connector {connector.type || connector.id || idx}
                        </span>
                        {" - "}
                        <span
                          style={{
                            color:
                              connector.status === "Available"
                                ? "#4caf50"
                                : connector.status === "Charging"
                                ? "#2196f3"
                                : "#ff9800",
                            fontWeight: 500
                          }}
                        >
                          {connector.status || "Unknown"}
                        </span>
                        {connector.lastUpdate && (
                          <span style={{ color: "#999", marginLeft: 8, fontSize: 12 }}>
                            ({connector.lastUpdate})
                          </span>
                        )}
                      </div>
                      {/* Hiển thị chi tiết các trường khác */}
                      <div style={{ fontSize: 13, color: "#555", marginTop: 4 }}>
                        {Object.entries(connector).map(([k, v]) =>
                          ["status", "type", "id", "lastUpdate"].includes(k) ? null : (
                            <div key={k}>
                              <strong>{k}:</strong> {String(v)}
                            </div>
                          )
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {/* Thông tin thêm */}
            <div style={{ marginTop: 10, color: "#999", fontSize: 13 }}>
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