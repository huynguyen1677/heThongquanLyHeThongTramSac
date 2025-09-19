import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCharging } from '../contexts/ChargingContext'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

const toConnectorArray = (connectors) =>
  Array.isArray(connectors)
    ? connectors
    : connectors
    ? Object.entries(connectors).map(([id, val]) => ({ id, ...val }))
    : [];

const Stations = () => {
  const { stations, loading, refreshStations, pricePerKwh } = useCharging();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Filter stations
  const filteredStations = stations.filter(station => {
    const connectorsArr = toConnectorArray(station.connectors);
    const matchesSearch =
      (station.name || station.stationName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (station.address || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      selectedStatus === 'all' ||
      (selectedStatus === 'online' && station.status === 'Online') ||
      (selectedStatus === 'offline' && station.status === 'Offline');

    const matchesType =
      selectedType === 'all' ||
      connectorsArr.some(c =>
        selectedType === 'ac' ? c.type === 'AC' : c.type === 'DC'
      );

    return matchesSearch && matchesStatus && matchesType;
  })

  const handleRefresh = async () => {
    await refreshStations()
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Trạm sạc</h1>
          <p className="text-gray-600">
            Tìm và chọn trạm sạc phù hợp với nhu cầu của bạn
          </p>
        </div>
        
        <button 
          onClick={handleRefresh}
          disabled={loading}
          className="btn btn-outline"
        >
          {loading ? (
            <>
              <div className="spinner mr-2"></div>
              Đang tải...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2">
                <path d="M23 4v6h-6"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
              Làm mới
            </>
          )}
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-8">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="form-label">Tìm kiếm</label>
              <input
                type="text"
                placeholder="Tên trạm hoặc địa chỉ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="form-label">Trạng thái</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="form-input"
              >
                <option value="all">Tất cả</option>
                <option value="online">Đang hoạt động</option>
                <option value="offline">Offline</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="form-label">Loại sạc</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="form-input"
              >
                <option value="all">Tất cả</option>
                <option value="ac">AC (Sạc chậm)</option>
                <option value="dc">DC (Sạc nhanh)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-600">
          Tìm thấy <span className="font-semibold">{filteredStations.length}</span> trạm sạc
        </p>
      </div>

      {/* Stations Grid */}
      {loading ? (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {nearbyStations.map(station => (
      <div key={station.id} className="card">
        <div className="card-body">
          <div className="animate-pulse">
            <div className="bg-gray-200 h-6 rounded mb-4"></div>
            <div className="bg-gray-200 h-4 rounded mb-2"></div>
                  <div className="bg-gray-200 h-4 rounded mb-4 w-3/4"></div>
                  <div className="bg-gray-200 h-10 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStations.map(station => (
            <StationCard key={station.id} station={station} />
          ))}
        </div>
      )}

      {filteredStations.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Không tìm thấy trạm sạc</h3>
          <p className="text-gray-600 mb-4">
            Thử thay đổi bộ lọc hoặc tìm kiếm với từ khóa khác
          </p>
          <button 
            onClick={() => {
              setSearchTerm('')
              setSelectedStatus('all')
              setSelectedType('all')
            }}
            className="btn btn-primary"
          >
            Xóa bộ lọc
          </button>
        </div>
      )}
    </div>
  )
}

// Station Card Component
const StationCard = ({ station }) => {
  const { pricePerKwh } = useCharging();
  const connectorsArr = toConnectorArray(station.connectors);
  const availableConnectors = connectorsArr.filter(c => c.status === 'Available');
  const chargingConnectors = connectorsArr.filter(c => c.status === 'Charging');
  const faultedConnectors = connectorsArr.filter(c => c.status === 'Faulted');
  
  // Format last heartbeat time
  const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'Chưa rõ'
    try {
      return formatDistanceToNow(new Date(timestamp), { 
        addSuffix: true, 
        locale: vi 
      })
    } catch {
      return 'Chưa rõ'
    }
  }

  // Get station status color and text
  const getStationStatus = () => {
    if (station.online === false) return { color: 'badge-danger', text: 'Offline' }
    if (station.online === true) return { color: 'badge-success', text: 'Hoạt động' }
    if (station.status === 'Online') return { color: 'badge-success', text: 'Hoạt động' }
    return { color: 'badge-danger', text: 'Offline' }
  }

  const stationStatus = getStationStatus()
  
  return (
    <div className={`station-card ${station.online ? 'station-status-online' : 'station-status-offline'}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1">{station.name || station.stationName || `Trạm ${station.id}`}</h3>
          <p className="text-gray-600 text-sm mb-2">{station.address || 'Địa chỉ chưa cập nhật'}</p>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {station.distance && <span>📍 {station.distance}km</span>}
            {station.rating && (
              <div className="flex items-center">
                <span className="text-yellow-500 mr-1">⭐</span>
                <span>{station.rating}</span>
              </div>
            )}
          </div>
          {station.lastHeartbeat && (
            <div className="text-xs text-gray-500 mt-1">
              Cập nhật: {formatLastSeen(station.lastHeartbeat)}
            </div>
          )}
        </div>
        <span className={`badge ${stationStatus.color}`}>
          {stationStatus.text}
        </span>
      </div>

      {/* Connectors */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Cổng sạc</span>
          <span className="text-xs text-gray-500">
            {availableConnectors.length}/{connectorsArr.length}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {connectorsArr.length > 0 ? connectorsArr.map(connector => (
            <div
              key={connector.id}
              className={`connector-card ${
                connector.status === 'Available'
                  ? 'connector-available'
                  : connector.status === 'Charging'
                  ? 'connector-charging'
                  : connector.status === 'Preparing'
                  ? 'connector-occupied'
                  : connector.status === 'Finishing'
                  ? 'connector-occupied'
                  : connector.status === 'Faulted'
                  ? 'connector-faulted'
                  : 'connector-unavailable'
              }`}
            >
              <div className="font-medium text-sm">
                Cổng {connector.id}
              </div>
              <div className="text-xs text-gray-600">
                {connector.type || 'AC'} • {connector.power || 22}kW
              </div>
              <div className="text-xs font-medium mt-1">
                {pricePerKwh.toLocaleString()}đ/kWh
              </div>
              
              {/* Hiển thị thông tin real-time nếu đang sạc */}
              {connector.status === 'Charging' && connector.currentPower > 0 && (
                <div className="text-xs text-blue-600 mt-1">
                  {(connector.currentPower / 1000).toFixed(1)}kW
                  {connector.sessionKwh > 0 && ` • ${formatKwh(connector.sessionKwh)}`}
                </div>
              )}
              
              <div className="text-xs mt-1">
                <span className={`badge badge-sm ${
                  connector.status === 'Available' ? 'badge-success' :
                  connector.status === 'Charging' ? 'badge-warning' :
                  connector.status === 'Preparing' ? 'badge-info' :
                  connector.status === 'Finishing' ? 'badge-info' :
                  connector.status === 'Faulted' ? 'badge-danger' :
                  'badge-secondary'
                }`}>
                  {connector.status === 'Available' ? 'Có sẵn' :
                   connector.status === 'Charging' ? 'Đang sạc' :
                   connector.status === 'Preparing' ? 'Chuẩn bị' :
                   connector.status === 'Finishing' ? 'Hoàn thành' :
                   connector.status === 'Faulted' ? 'Lỗi' :
                   connector.status === 'Unavailable' ? 'Không khả dụng' :
                   connector.status}
                </span>
              </div>
              
              {/* Hiển thị lỗi nếu có */}
              {connector.errorCode && connector.errorCode !== 'NoError' && (
                <div className="text-xs text-red-600 mt-1">
                  {connector.errorCode}
                </div>
              )}
            </div>
          )) : (
            <div className="col-span-2 text-center text-gray-500 text-sm py-4">
              Chưa có thông tin cổng sạc
            </div>
          )}
        </div>
      </div>

      {/* Amenities */}
      {station.amenities && station.amenities.length > 0 && (
        <div className="mb-4">
          <span className="text-sm font-medium text-gray-700 mb-2 block">Tiện ích</span>
          <div className="flex flex-wrap gap-1">
            {station.amenities.slice(0, 3).map(amenity => (
              <span key={amenity} className="badge badge-primary text-xs">
                {amenity}
              </span>
            ))}
            {station.amenities.length > 3 && (
              <span className="badge badge-primary text-xs">
                +{station.amenities.length - 3}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="mt-auto">
        {station.status === 'Online' && availableConnectors.length > 0 ? (
          <Link 
            to={`/stations/${station.id}`}
            className="btn btn-primary w-full"
          >
            Chọn trạm này
          </Link>
        ) : station.status === 'Online' && chargingConnectors.length > 0 ? (
          <button disabled className="btn btn-outline w-full">
            Tất cả cổng đang bận
          </button>
        ) : (
          <button disabled className="btn btn-outline w-full">
            Trạm không khả dụng
          </button>
        )}
      </div>
    </div>
  )
}

export default Stations
