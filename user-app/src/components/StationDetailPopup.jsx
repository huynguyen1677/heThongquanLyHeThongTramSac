import React from "react";

function StationDetailPopup({ station, userPos, onClose }) {
  if (!station) return null;
  return (
    <div
      style={{
        position: "fixed",
        left: 0, top: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.3)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 10,
          padding: 24,
          minWidth: 320,
          boxShadow: "0 2px 16px rgba(0,0,0,0.18)"
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3>{station.name || station.stationName}</h3>
        <div><b>Địa chỉ:</b> {station.address}</div>
        <div><b>Trạng thái:</b> {station.online ? "Online" : "Offline"}</div>
        <div><b>Số cổng sạc:</b> {station.connectors
          ? (Array.isArray(station.connectors)
              ? station.connectors.length
              : Object.keys(station.connectors).length)
          : 0}
        </div>
        <div><b>Model:</b> {station.model || "N/A"}</div>
        <div><b>Vendor:</b> {station.vendor || "N/A"}</div>
        <div><b>Firmware:</b> {station.firmwareVersion || "N/A"}</div>
        <div><b>ID:</b> {station.id}</div>
        {userPos && station.latitude && station.longitude && (
          <a
            href={`https://www.google.com/maps/dir/?api=1&origin=${userPos.latitude},${userPos.longitude}&destination=${station.latitude},${station.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "inline-block", marginTop: 12, color: "#2563eb" }}
          >
            🧭 Chỉ đường đến trạm này
          </a>
        )}
        <button style={{ marginTop: 16 }} onClick={onClose}>
          Đóng
        </button>
      </div>
    </div>
  );
}

export default StationDetailPopup;