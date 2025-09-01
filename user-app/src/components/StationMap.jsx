import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Icon cho vị trí user
const userIcon = new L.Icon({
  iconUrl: "https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-blue.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const stationIcon = new L.Icon({
  iconUrl: "https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-green.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

function UserMarker({ setMapCenter }) {
  const [position, setPosition] = useState(null);
  const map = useMap();

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setPosition(coords);
        setMapCenter && setMapCenter(coords);
        map.flyTo(coords, 14);
      },
      () => { }
    );
    // eslint-disable-next-line
  }, []);

  return position ? (
    <Marker position={position} icon={userIcon}>
      <Popup>Vị trí của bạn</Popup>
    </Marker>
  ) : null;
}

function StationMap({ stations, onStationClick }) {
  const [mapCenter, setMapCenter] = useState(
    stations.length > 0
      ? [stations[0].latitude, stations[0].longitude]
      : [10.762622, 106.660172]
  );

  return (
    <MapContainer center={mapCenter} zoom={13} style={{ height: 400, width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <UserMarker setMapCenter={setMapCenter} />
      {stations
        .filter(
          (s) =>
            typeof s.latitude === "number" && typeof s.longitude === "number"
        )
        .map((station) => (
          <Marker
            key={station.id}
            position={[station.latitude, station.longitude]}
            icon={stationIcon}
            eventHandlers={{
              click: () => onStationClick && onStationClick(station),
            }}
          />
        ))}
    </MapContainer>
  );
}

export default StationMap;