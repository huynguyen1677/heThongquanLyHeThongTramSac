import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRScanner } from '../components/QRScanner'
import StationMap from '../components/StationMap'
import { rtdbService } from '../services/rtdb'

export default function FindStation() {
  const navigate = useNavigate()
  const [stationId, setStationId] = useState('')
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [viewMode, setViewMode] = useState('map') // 'map' or 'list'
  const [searchQuery, setSearchQuery] = useState('')
  const [userLocation, setUserLocation] = useState(null)
  const [nearbyStations, setNearbyStations] = useState([])
  const [filteredStations, setFilteredStations] = useState([])
  const [loadingStations, setLoadingStations] = useState(true)

  // Load real stations from Firebase
  useEffect(() => {
    const loadStations = async () => {
      setLoadingStations(true)
      try {
        console.log('Loading stations from RTDB...')
        const stations = await rtdbService.getAllStations()
        console.log('Loaded stations from RTDB:', stations)
        console.log('Station IDs available:', stations.map(s => s.id))
        setNearbyStations(stations)
        setFilteredStations(stations)
        
        // Calculate distance if user location is available
        if (userLocation && stations.length > 0) {
          const stationsWithDistance = calculateDistances(stations, userLocation)
          setNearbyStations(stationsWithDistance)
          setFilteredStations(stationsWithDistance)
        }
      } catch (error) {
        console.error('Error loading stations:', error)
      } finally {
        setLoadingStations(false)
      }
    }

    loadStations()

    // Subscribe to real-time updates
    const unsubscribe = rtdbService.subscribeToAllStations((stations) => {
      const stationsWithDistance = userLocation 
        ? calculateDistances(stations, userLocation)
        : stations
      
      setNearbyStations(stationsWithDistance)
      if (!searchQuery.trim()) {
        setFilteredStations(stationsWithDistance)
      }
    })

    return unsubscribe
  }, [])

  // Calculate distances from user location
  const calculateDistances = (stations, userLoc) => {
    return stations.map(station => ({
      ...station,
      distance: calculateDistance(
        userLoc[0], userLoc[1],
        station.latitude, station.longitude
      )
    })).sort((a, b) => a.distance - b.distance)
  }

  // Haversine formula to calculate distance
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371 // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c // Distance in km
  }

  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLoc = [position.coords.latitude, position.coords.longitude]
          setUserLocation(userLoc)
          
          // Recalculate distances for existing stations
          if (nearbyStations.length > 0) {
            const stationsWithDistance = calculateDistances(nearbyStations, userLoc)
            setNearbyStations(stationsWithDistance)
            setFilteredStations(stationsWithDistance)
          }
        },
        (error) => {
          console.log('Error getting location:', error)
        }
      )
    }
  }, [nearbyStations.length])

  useEffect(() => {
    // Filter stations based on search query
    if (searchQuery.trim()) {
      const filtered = nearbyStations.filter(station =>
        station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        station.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        station.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredStations(filtered)
    } else {
      setFilteredStations(nearbyStations)
    }
  }, [searchQuery, nearbyStations])

  const handleManualInput = async (e) => {
    e.preventDefault()
    if (!stationId.trim()) return

    setIsLoading(true)
    try {
      // Kiểm tra station có tồn tại không
      // Thực tế sẽ gọi API để verify station
      await new Promise(resolve => setTimeout(resolve, 1000)) // Mock delay
      
      navigate(`/station/${stationId.trim()}`)
    } catch (error) {
      alert('Không tìm thấy trạm sạc. Vui lòng kiểm tra lại mã trạm.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleQRScan = (result) => {
    if (result) {
      // QR code có thể chứa trực tiếp station ID hoặc URL
      let extractedStationId = result
      
      // Nếu là URL, extract station ID từ URL
      try {
        const url = new URL(result)
        const pathParts = url.pathname.split('/')
        const stationIndex = pathParts.indexOf('station')
        if (stationIndex !== -1 && pathParts[stationIndex + 1]) {
          extractedStationId = pathParts[stationIndex + 1]
        }
      } catch {
        // Nếu không phải URL hợp lệ, sử dụng result trực tiếp
      }

      setStationId(extractedStationId)
      setShowQRScanner(false)
      
      // Tự động navigate sau khi quét
      setTimeout(() => {
        navigate(`/station/${extractedStationId}`)
      }, 500)
    }
  }

  const handleStationClick = (station) => {
    navigate(`/station/${station.id}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card glass">
        <div className="text-center">
          <h1 className="text-2xl font-bold heading-gradient mb-2">
            🗺️ Tìm trạm sạc gần bạn
          </h1>
          <p className="text-gray-600">
            Sử dụng bản đồ hoặc tìm kiếm để tìm trạm sạc phù hợp
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card glass">
        <div className="flex gap-2 mb-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Tìm kiếm trạm sạc, địa chỉ..."
              className="form-input"
            />
          </div>
          <button
            onClick={() => setShowQRScanner(true)}
            className="btn-outline px-4"
            title="Quét QR Code"
          >
            📱
          </button>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('map')}
            className={`btn-sm flex-1 ${viewMode === 'map' ? 'btn-primary' : 'btn-outline'}`}
          >
            🗺️ Bản đồ
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`btn-sm flex-1 ${viewMode === 'list' ? 'btn-primary' : 'btn-outline'}`}
          >
            📋 Danh sách
          </button>
        </div>
      </div>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="card glass max-w-md w-full">
            <div className="text-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                📱 Quét QR Code
              </h2>
              <p className="text-sm text-gray-600">
                Hướng camera vào QR code trên trạm sạc
              </p>
            </div>
            
            <QRScanner
              onScan={handleQRScan}
              onError={(error) => {
                console.error('QR Scanner Error:', error)
                alert('Không thể truy cập camera. Vui lòng nhập mã trạm thủ công.')
                setShowQRScanner(false)
              }}
            />
            
            <div className="text-center mt-4">
              <button
                onClick={() => setShowQRScanner(false)}
                className="btn-outline"
              >
                ❌ Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map View */}
      {viewMode === 'map' && (
        <div className="card glass p-0 overflow-hidden">
          {loadingStations ? (
            <div className="map-loading">
              <div className="text-center">
                <div className="spinner mb-4"></div>
                <p className="text-gray-600">Đang tải dữ liệu trạm sạc...</p>
              </div>
            </div>
          ) : (
            <>
              <StationMap
                stations={filteredStations}
                center={userLocation}
                onStationClick={handleStationClick}
                height="500px"
              />
              
              {filteredStations.length > 0 && (
                <div className="p-4 bg-white bg-opacity-80">
                  <div className="text-sm text-gray-600 text-center">
                    ⚡ Tìm thấy {filteredStations.length} trạm sạc
                    {userLocation && ' gần bạn'}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {loadingStations ? (
            <div className="card glass text-center">
              <div className="spinner mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Đang tải trạm sạc...
              </h3>
              <p className="text-gray-600">
                Đang lấy dữ liệu từ hệ thống
              </p>
            </div>
          ) : filteredStations.length > 0 ? (
            filteredStations.map((station) => (
              <div
                key={station.id}
                className="card glass hover:shadow-lg transition-all cursor-pointer station-card"
                onClick={() => handleStationClick(station)}
              >
                <div className="flex items-start gap-4">
                  <div className="text-2xl">⚡</div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-gray-900">{station.name}</h3>
                        <p className="text-sm text-gray-600">{station.address}</p>
                        {station.vendor && (
                          <p className="text-xs text-gray-500">{station.vendor} {station.model}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-blue-600">
                          📍 {station.distance ? `${station.distance.toFixed(1)}km` : 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600">
                          ⭐ {station.rating}
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          station.online 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {station.online ? '🟢 Online' : '🔴 Offline'}
                        </div>
                      </div>
                    </div>
                    
                    {/* Station Status Summary */}
                    {station.totalConnectors > 0 && (
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="text-center p-2 bg-green-50 rounded-lg">
                          <div className="text-sm font-bold text-green-600">{station.availableConnectors || 0}</div>
                          <div className="text-xs text-green-700">Sẵn sàng</div>
                        </div>
                        <div className="text-center p-2 bg-blue-50 rounded-lg">
                          <div className="text-sm font-bold text-blue-600">{station.chargingConnectors || 0}</div>
                          <div className="text-xs text-blue-700">Đang sạc</div>
                        </div>
                        <div className="text-center p-2 bg-red-50 rounded-lg">
                          <div className="text-sm font-bold text-red-600">{station.errorConnectors || 0}</div>
                          <div className="text-xs text-red-700">Lỗi</div>
                        </div>
                      </div>
                    )}
                    
                    {/* Connectors Detail */}
                    <div className="space-y-2 mb-3">
                      {station.connectors && station.connectors.length > 0 ? (
                        station.connectors.map((connector, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">#{connector.id}</span>
                              <span className="text-sm text-gray-600">
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
                                <div className="text-right text-xs">
                                  <div className="text-blue-600 font-medium">{connector.currentPower}W</div>
                                  <div className="text-gray-500">{connector.sessionKwh?.toFixed(2)}kWh</div>
                                  {connector.sessionCost > 0 && (
                                    <div className="text-green-600">{connector.sessionCost.toLocaleString()}đ</div>
                                  )}
                                </div>
                              )}
                              {connector.hasError && (
                                <div className="text-xs text-red-600">{connector.errorCode}</div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center p-2 bg-gray-50 rounded-lg text-sm text-gray-500">
                          Không có thông tin connector
                        </div>
                      )}
                    </div>
                    
                    {/* Pricing */}
                    <div className="flex justify-between items-center pt-3 border-t border-gray-200 mb-3">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-600">Giá sạc</span>
                        <span className="text-lg font-bold text-green-600">
                          {station.pricing?.basePrice ? `${station.pricing.basePrice.toLocaleString()}đ/kWh` : 'N/A'}
                        </span>
                        {station.pricing?.timeBasedPricing && (
                          <span className="text-xs text-gray-500">
                            + {station.pricing.timeBasedPricing.toLocaleString()}đ/phút
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-sm text-gray-600">Công suất tổng</span>
                        <span className="text-sm font-medium text-blue-600">
                          {station.totalPower || 'N/A'}kW
                        </span>
                        {station.totalConnectors > 0 && (
                          <span className="text-xs text-gray-500">
                            {station.totalConnectors} connector
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        {station.connectors ? station.connectors.filter(c => c.status === 'Available').length : 0}/{station.connectors ? station.connectors.length : 0} trạm sẵn sàng
                      </div>
                      <button 
                        onClick={() => navigate(`/station/${station.id}`)}
                        className="btn-sm btn-primary"
                      >
                        Xem chi tiết →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="card glass text-center">
              <div className="text-4xl mb-4">�</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Không tìm thấy trạm sạc
              </h3>
              <p className="text-gray-600">
                Thử thay đổi từ khóa tìm kiếm hoặc mở rộng bán kính tìm kiếm
              </p>
            </div>
          )}
        </div>
      )}

      {/* Manual Station ID Input */}
      <div className="card glass">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          🔢 Nhập mã trạm trực tiếp
        </h2>
        
        <form onSubmit={handleManualInput} className="space-y-4">
          <div>
            <label htmlFor="stationId" className="form-label">
              Mã trạm sạc
            </label>
            <input
              type="text"
              id="stationId"
              value={stationId}
              onChange={(e) => setStationId(e.target.value)}
              placeholder="Ví dụ: STATION001"
              className="form-input"
              disabled={isLoading}
            />
          </div>
          
          <button
            type="submit"
            disabled={!stationId.trim() || isLoading}
            className="btn-primary w-full"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="spinner-sm mr-2"></div>
                Đang tìm kiếm...
              </div>
            ) : (
              '🔍 Tìm trạm sạc'
            )}
          </button>
        </form>
      </div>

      {/* Tips */}
      <div className="card glass">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          💡 Mẹo tìm trạm sạc
        </h3>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <span>🗺️</span>
            <span>Sử dụng bản đồ để xem vị trí chính xác của các trạm sạc</span>
          </div>
          <div className="flex items-start gap-2">
            <span>📱</span>
            <span>Quét QR code trên trạm để kết nối nhanh chóng</span>
          </div>
          <div className="flex items-start gap-2">
            <span>⚡</span>
            <span>Kiểm tra trạng thái trước khi di chuyển để tránh chờ đợi</span>
          </div>
        </div>
      </div>
    </div>
  )
}
