import React, { useEffect, useState } from "react";
import { useCharging } from "../contexts/ChargingContext";
import { filterStationsByKeyword, sortStationsByDistance } from "../utils/stationUtils";
import StationMap from "../components/StationMap";
import StationDetailPopup from "../components/StationDetailPopup";

function FindStation() {
  const { stations, stationsLoading, stationsError } = useCharging();
  const [userPos, setUserPos] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedStation, setSelectedStation] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserPos({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
        () => setUserPos(null)
      );
    }
  }, []);

  let filteredStations = filterStationsByKeyword(stations, search);
  if (statusFilter !== "all") {
    filteredStations = filteredStations.filter(
      s => statusFilter === "online" ? s.online : !s.online
    );
  }
  const sortedStations = sortStationsByDistance(filteredStations, userPos);

  const validStations = sortedStations.filter(
    s => typeof s.latitude === "number" && typeof s.longitude === "number"
  );

  return (
    <div>
      <h2>Tìm trạm sạc gần bạn</h2>
      <input
        type="text"
        placeholder="Tìm theo tên trạm hoặc địa chỉ..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginRight: 12 }}
      />
      <select
        value={statusFilter}
        onChange={e => setStatusFilter(e.target.value)}
        style={{ marginBottom: 12 }}
      >
        <option value="all">Tất cả trạng thái</option>
        <option value="online">Chỉ Online</option>
        <option value="offline">Chỉ Offline</option>
      </select>
      {stationsLoading && <div>Đang tải...</div>}
      {stationsError && <div style={{ color: "red" }}>{stationsError}</div>}
      {!userPos && <div>Không lấy được vị trí của bạn.</div>}

      {/* Thêm bản đồ, truyền onStationClick */}
      <div style={{ margin: "24px 0" }}>
        <StationMap stations={validStations} onStationClick={setSelectedStation} />
      </div>

      <ul>
        {sortedStations.slice(0, 5).map(station => (
          <li
            key={station.id}
            style={{ cursor: "pointer", borderBottom: "1px solid #eee", padding: 8 }}
            onClick={() => setSelectedStation(station)}
          >
            <b>{station.name || station.stationName}</b>
            {station.distance !== undefined && (
              <> - {station.distance.toFixed(2)} km</>
            )}
            <br />
            {station.address}
            <br />
            <span style={{ color: station.online ? "green" : "red" }}>
              {station.online ? "Online" : "Offline"}
            </span>
          </li>
        ))}
      </ul>

      {/* Popup chi tiết trạm */}
      {selectedStation && (
        <StationDetailPopup
          station={selectedStation}
          userPos={userPos}
          onClose={() => setSelectedStation(null)}
        />
      )}
    </div>
  );
}

export default FindStation;