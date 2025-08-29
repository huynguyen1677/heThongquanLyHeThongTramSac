import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function StationMap({ stations }) {
  const center = stations.length > 0
    ? [stations[0].latitude, stations[0].longitude]
    : [10.762622, 106.660172]; // Vị trí mặc định (TP.HCM)

  return (
    <MapContainer center={center} zoom={13} style={{ height: 400, width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {stations.map(station => (
        <Marker
          key={station.id}
          position={[station.latitude, station.longitude]}
        >
          <Popup>
            <b>{station.name}</b><br />
            {station.address}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default StationMap;