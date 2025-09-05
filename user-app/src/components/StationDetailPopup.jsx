import React from "react";

// CSS styles as JavaScript objects
const styles = {
  overlay: {
    position: "fixed",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.6)",
    backdropFilter: "blur(4px)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1rem",
    animation: "fadeIn 0.3s ease-out"
  },
  
  popup: {
    background: "white",
    borderRadius: "20px",
    padding: "0",
    minWidth: "400px",
    maxWidth: "500px",
    width: "100%",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
    transform: "translateY(0)",
    animation: "slideUp 0.3s ease-out",
    overflow: "hidden"
  },
  
  header: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    padding: "1.5rem",
    position: "relative",
    overflow: "hidden"
  },
  
  headerDecoration: {
    position: "absolute",
    top: 0,
    right: 0,
    width: "100px",
    height: "100px",
    background: "rgba(255, 255, 255, 0.1)",
    borderRadius: "50%",
    transform: "translate(30px, -30px)"
  },
  
  title: {
    margin: "0 0 0.5rem 0",
    fontSize: "1.5rem",
    fontWeight: "600",
    position: "relative",
    zIndex: 2
  },
  
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.25rem 0.75rem",
    borderRadius: "20px",
    fontSize: "0.875rem",
    fontWeight: "500",
    position: "relative",
    zIndex: 2
  },
  
  statusOnline: {
    background: "rgba(34, 197, 94, 0.2)",
    color: "#059669",
    border: "1px solid rgba(34, 197, 94, 0.3)"
  },
  
  statusOffline: {
    background: "rgba(239, 68, 68, 0.2)",
    color: "#dc2626",
    border: "1px solid rgba(239, 68, 68, 0.3)"
  },
  
  content: {
    padding: "1.5rem"
  },
  
  infoGrid: {
    display: "grid",
    gap: "1rem",
    marginBottom: "1.5rem"
  },
  
  infoItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.75rem",
    background: "#f8fafc",
    borderRadius: "8px",
    border: "1px solid #e2e8f0"
  },
  
  infoLabel: {
    fontWeight: "500",
    color: "#374151",
    fontSize: "0.9rem"
  },
  
  infoValue: {
    color: "#111827",
    fontWeight: "600"
  },
  
  addressItem: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "0.5rem"
  },
  
  address: {
    color: "#6b7280",
    lineHeight: "1.5",
    fontSize: "0.9rem"
  },
  
  actions: {
    display: "flex",
    gap: "0.75rem",
    marginTop: "1.5rem"
  },
  
  btnPrimary: {
    flex: 1,
    padding: "0.75rem 1.5rem",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    textDecoration: "none"
  },
  
  btnSecondary: {
    padding: "0.75rem 1.5rem",
    background: "#f3f4f6",
    color: "#374151",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.3s ease"
  },
  
  closeBtn: {
    position: "absolute",
    top: "1rem",
    right: "1rem",
    width: "2rem",
    height: "2rem",
    background: "rgba(255, 255, 255, 0.2)",
    border: "none",
    borderRadius: "50%",
    color: "white",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.25rem",
    transition: "background 0.3s ease",
    zIndex: 3
  },
  
  connectorsInfo: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem"
  },
  
  connectorsCount: {
    background: "#dbeafe",
    color: "#1d4ed8",
    padding: "0.25rem 0.5rem",
    borderRadius: "4px",
    fontSize: "0.875rem",
    fontWeight: "600"
  }
};

// CSS animations
const cssAnimations = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideUp {
    from { 
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    to { 
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
`;

function StationDetailPopup({ station, userPos, onClose }) {
  if (!station) return null;

  // Add CSS animations to document
  React.useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = cssAnimations;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const connectorsCount = station.connectors
    ? (Array.isArray(station.connectors)
        ? station.connectors.length
        : Object.keys(station.connectors).length)
    : 0;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.popup} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerDecoration}></div>
          <button 
            style={styles.closeBtn}
            onClick={onClose}
            onMouseEnter={(e) => e.target.style.background = "rgba(255, 255, 255, 0.3)"}
            onMouseLeave={(e) => e.target.style.background = "rgba(255, 255, 255, 0.2)"}
          >
            ✕
          </button>
          <h3 style={styles.title}>{station.name || station.stationName}</h3>
          <div style={{
            ...styles.statusBadge,
            ...(station.online ? styles.statusOnline : styles.statusOffline)
          }}>
            <div style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: station.online ? "#22c55e" : "#ef4444"
            }}></div>
            {station.online ? "Online" : "Offline"}
          </div>
        </div>

        {/* Content */}
        <div style={styles.content}>
          <div style={styles.infoGrid}>
            {/* Address */}
            <div style={{...styles.infoItem, ...styles.addressItem}}>
              <div style={styles.infoLabel}>
                📍 Địa chỉ
              </div>
              <div style={styles.address}>{station.address}</div>
            </div>

            {/* Connectors */}
            <div style={styles.infoItem}>
              <div style={styles.infoLabel}>🔌 Số cổng sạc</div>
              <div style={styles.connectorsInfo}>
                <div style={styles.connectorsCount}>{connectorsCount}</div>
                <span style={styles.infoValue}>cổng</span>
              </div>
            </div>

            {/* Model & Vendor */}
            <div style={styles.infoItem}>
              <div style={styles.infoLabel}>🏭 Model / Vendor</div>
              <div style={styles.infoValue}>
                {station.model || "N/A"} / {station.vendor || "N/A"}
              </div>
            </div>

            {/* Firmware */}
            <div style={styles.infoItem}>
              <div style={styles.infoLabel}>⚙️ Firmware</div>
              <div style={styles.infoValue}>{station.firmwareVersion || "N/A"}</div>
            </div>

            {/* Station ID */}
            <div style={styles.infoItem}>
              <div style={styles.infoLabel}>🆔 Station ID</div>
              <div style={{...styles.infoValue, fontFamily: "monospace", fontSize: "0.9rem"}}>
                {station.id}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={styles.actions}>
            {userPos && station.latitude && station.longitude && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&origin=${userPos.latitude},${userPos.longitude}&destination=${station.latitude},${station.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.btnPrimary}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-1px)";
                  e.target.style.boxShadow = "0 4px 16px rgba(102, 126, 234, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "none";
                }}
              >
                🧭 Chỉ đường
              </a>
            )}
            <button 
              style={styles.btnSecondary}
              onClick={onClose}
              onMouseEnter={(e) => e.target.style.background = "#e5e7eb"}
              onMouseLeave={(e) => e.target.style.background = "#f3f4f6"}
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StationDetailPopup;