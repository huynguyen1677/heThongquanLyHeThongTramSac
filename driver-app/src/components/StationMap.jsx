import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom charging station icon
const chargingIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#10B981" width="32" height="32">
      <path d="M14.5 11l-3 6v-4h-2l3-6v4h2zm-7 7c0-.55-.45-1-1-1s-1 .45-1 1 .45 1 1 1 1-.45 1-1zm15.5-1c0 .55-.45 1-1 1s-1-.45-1-1 .45-1 1-1 1 .45 1 1zm-3-9c.55 0 1-.45 1-1V5.5l-.5-.5h-3l-.5.5V7c0 .55.45 1 1 1h2zm-7 0c.55 0 1-.45 1-1V5.5l-.5-.5h-3l-.5.5V7c0 .55.45 1 1 1h2zm7.5-3c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zm-7 0c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1z"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
})

// Component to handle map centering
function MapCenter({ center }) {
  const map = useMap()
  
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom())
    }
  }, [center, map])
  
  return null
}

export default function StationMap({ stations = [], center, onStationClick, height = '400px' }) {
  const [userLocation, setUserLocation] = useState(null)
  
  // Default center (Ho Chi Minh City)
  const defaultCenter = center || [10.8231, 106.6297]
  
  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude])
        },
        (error) => {
          console.log('Error getting location:', error)
        }
      )
    }
  }, [])

  return (
    <div className="map-container" style={{ height, width: '100%' }}>
      <MapContainer
        center={userLocation || defaultCenter}
        zoom={13}
        style={{ height: '100%', width: '100%', borderRadius: '12px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapCenter center={center} />
        
        {/* User location marker */}
        {userLocation && (
          <Marker position={userLocation}>
            <Popup>
              <div className="text-center">
                <div className="text-lg mb-1">📍</div>
                <div className="font-medium">Vị trí của bạn</div>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Charging station markers */}
        {stations.map((station) => (
          <Marker
            key={station.id}
            position={[station.latitude, station.longitude]}
            icon={chargingIcon}
            eventHandlers={{
              click: () => onStationClick && onStationClick(station)
            }}
          >
            <Popup>
              <div className="min-w-64">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">⚡</span>
                  <h3 className="font-bold text-gray-900">{station.name}</h3>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-1">
                    <span>📍</span>
                    <span>{station.address}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>🔌</span>
                    <span>{station.totalConnectors || 0} connector(s)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>⭐</span>
                    <span>{station.rating || 'N/A'}</span>
                  </div>
                  {station.vendor && (
                    <div className="flex items-center gap-1">
                      <span>🏭</span>
                      <span>{station.vendor} {station.model}</span>
                    </div>
                  )}
                </div>
                
                {/* Station Status Summary */}
                {station.totalConnectors > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center p-2 bg-green-50 rounded-lg">
                      <div className="text-lg font-bold text-green-600">{station.availableConnectors || 0}</div>
                      <div className="text-xs text-green-700">Sẵn sàng</div>
                    </div>
                    <div className="text-center p-2 bg-blue-50 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">{station.chargingConnectors || 0}</div>
                      <div className="text-xs text-blue-700">Đang sạc</div>
                    </div>
                    <div className="text-center p-2 bg-red-50 rounded-lg">
                      <div className="text-lg font-bold text-red-600">{station.errorConnectors || 0}</div>
                      <div className="text-xs text-red-700">Lỗi</div>
                    </div>
                  </div>
                )}

                {/* Available connectors */}
                {station.connectors && station.connectors.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <div className="font-medium text-gray-800">Chi tiết connectors:</div>
                    {station.connectors.slice(0, 3).map((connector, index) => (
                      <div key={index} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">#{connector.id}</span>
                          <span className="text-gray-600">
                            {connector.type} - {connector.power}kW
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            connector.status === 'Available' 
                              ? 'bg-green-100 text-green-800' 
                              : connector.status === 'Charging'
                              ? 'bg-blue-100 text-blue-800'
                              : connector.status === 'Occupied'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {connector.status}
                          </span>
                          {connector.isCharging && (
                            <div className="text-right">
                              <div className="text-blue-600 font-medium">{connector.currentPower}W</div>
                              <div className="text-gray-500">{connector.sessionKwh?.toFixed(2)}kWh</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {station.connectors.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{station.connectors.length - 3} connector(s) khác
                      </div>
                    )}
                  </div>
                )}
                
                <button
                  onClick={() => onStationClick && onStationClick(station)}
                  className="w-full bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Xem chi tiết
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
