import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { rtdbService } from '../services/rtdb'
import { pricingService } from '../services/pricing'
import { formatCurrency, formatTime } from '../utils/format'
import { ConnectorCard } from '../components/ConnectorCard'

export function StationDetail() {
  const { id: stationId } = useParams()
  const navigate = useNavigate()
  
  const [station, setStation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pricePerKwh, setPricePerKwh] = useState(3800) // Default price
  const [selectedConnector, setSelectedConnector] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)

  // Load station data và setup realtime listener
  useEffect(() => {
    if (!stationId) {
      setError('Station ID không hợp lệ')
      setLoading(false)
      return
    }

    let unsubscribe = null

    const loadStationData = async () => {
      try {
        setLoading(true)
        
        // Get initial data
        const stationData = await rtdbService.getStationData(stationId)
        if (!stationData) {
          setError('Không tìm thấy thông tin trạm sạc')
          setLoading(false)
          return
        }

        setStation(stationData)
        setLoading(false)

        // Setup realtime listener
        unsubscribe = rtdbService.subscribeToStation(stationId, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val()
            
            // Process connector data
            const processedConnectors = {}
            if (data.connectors) {
              Object.entries(data.connectors).forEach(([id, connector]) => {
                if (id !== '0' && id !== 'null' && connector) {
                  processedConnectors[id] = {
                    ...connector,
                    id: parseInt(id),
                    type: connector.type || 'AC Type 2',
                    power: connector.power || 22,
                    isCharging: connector.status === 'Charging',
                    isAvailable: connector.status === 'Available',
                    hasError: connector.errorCode && connector.errorCode !== 'NoError',
                    // Map realtime data fields
                    currentPower: connector.W_now || 0,
                    totalEnergy: connector.Wh_total || 0,
                    energyKwh: connector.kwh || 0,
                    sessionEnergy: connector.session_kwh || 0,
                    sessionCost: connector.session_cost || 0,
                    estimatedCost: connector.costEstimate || 0,
                    transactionId: connector.txId || null
                  }
                }
              })
            }

            setStation(prevStation => ({
              ...prevStation,
              ...data,
              connectors: processedConnectors,
              online: data.online !== false,
              lastHeartbeat: data.lastHeartbeat,
              stationName: data.stationName || prevStation?.name || stationId,
              address: data.address || prevStation?.address || 'Chưa có địa chỉ'
            }))
            setLastUpdate(new Date().toISOString())
          }
        })

      } catch (err) {
        console.error('Error loading station:', err)
        setError('Lỗi tải thông tin trạm sạc')
        setLoading(false)
      }
    }

    loadStationData()

    // Cleanup
    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [stationId])

  // Load pricing
  useEffect(() => {
    const loadPrice = async () => {
      try {
        const price = await pricingService.getPricePerKwh()
        if (price) {
          setPricePerKwh(price)
        }
      } catch (err) {
        console.warn('Could not load pricing, using default')
      }
    }

    loadPrice()
  }, [])

  const getStationStatusInfo = () => {
    if (!station) return { color: 'gray', text: 'Đang tải...', icon: '⏳' }
    
    if (!station.online) {
      return { color: 'red', text: 'Offline', icon: '🔴' }
    }

    const connectors = Object.values(station.connectors || {})
    const availableCount = connectors.filter(c => c.status === 'Available').length
    const chargingCount = connectors.filter(c => c.status === 'Charging').length
    const totalCount = connectors.length

    if (availableCount === 0 && chargingCount === 0) {
      return { color: 'red', text: 'Không khả dụng', icon: '🚫' }
    } else if (availableCount > 0) {
      return { color: 'green', text: `${availableCount}/${totalCount} sẵn sàng`, icon: '🟢' }
    } else {
      return { color: 'yellow', text: `${chargingCount}/${totalCount} đang sạc`, icon: '🟡' }
    }
  }

  const getTotalMetrics = () => {
    if (!station?.connectors) return { totalPower: 0, totalEnergy: 0, totalCost: 0 }

    const connectors = Object.values(station.connectors)
    return connectors.reduce((acc, connector) => ({
      totalPower: acc.totalPower + (connector.currentPower || connector.W_now || 0),
      totalEnergy: acc.totalEnergy + (connector.energyKwh || connector.kwh || 0),
      totalCost: acc.totalCost + (connector.estimatedCost || connector.costEstimate || 0)
    }), { totalPower: 0, totalEnergy: 0, totalCost: 0 })
  }

  const handleConnectorSelect = (connectorId) => {
    setSelectedConnector(connectorId)
  }

  const handleStartCharging = (connectorId) => {
    // Navigate to charging session page
    navigate(`/charging/${stationId}/${connectorId}`)
  }

  const renderConnectorStatus = (connectorId, connector) => {
    const getStatusColor = (status) => {
      switch (status) {
        case 'Available': return 'text-green-600 bg-green-100'
        case 'Charging': return 'text-blue-600 bg-blue-100'
        case 'Preparing': return 'text-yellow-600 bg-yellow-100'
        case 'Finishing': return 'text-purple-600 bg-purple-100'
        case 'Unavailable': return 'text-red-600 bg-red-100'
        case 'Faulted': return 'text-red-600 bg-red-100'
        default: return 'text-gray-600 bg-gray-100'
      }
    }

    const getStatusIcon = (status) => {
      switch (status) {
        case 'Available': return '🟢'
        case 'Charging': return '⚡'
        case 'Preparing': return '🟡'
        case 'Finishing': return '🏁'
        case 'Unavailable': return '🔴'
        case 'Faulted': return '❌'
        default: return '❓'
      }
    }

    const isCharging = connector.status === 'Charging'
    const hasSession = (connector.transactionId || connector.txId) || 
                      (connector.sessionEnergy || connector.session_kwh) && 
                      (connector.sessionEnergy || connector.session_kwh) > 0

    return (
      <div 
        key={connectorId}
        className={`p-4 border rounded-lg cursor-pointer transition-all ${
          selectedConnector === connectorId ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={() => handleConnectorSelect(connectorId)}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-lg">Connector {connectorId}</h3>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(connector.status)}`}>
            {getStatusIcon(connector.status)} {connector.status}
          </span>
        </div>

        {/* Error display */}
        {connector.errorCode && connector.errorCode !== 'NoError' && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            ❌ Lỗi: {connector.errorCode}
          </div>
        )}

        {/* Current session info for charging connectors */}
        {isCharging && hasSession && (
          <div className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-lg font-bold text-blue-600">
                  {connector.currentPower || connector.W_now ? 
                    `${((connector.currentPower || connector.W_now) / 1000).toFixed(1)}kW` : '0kW'}
                </div>
                <div className="text-xs text-gray-600">Công suất hiện tại</div>
              </div>
              
              <div>
                <div className="text-lg font-bold text-green-600">
                  {connector.sessionEnergy || connector.session_kwh ? 
                    `${(connector.sessionEnergy || connector.session_kwh).toFixed(2)}kWh` : 
                    `${(connector.energyKwh || connector.kwh || 0).toFixed(2)}kWh`}
                </div>
                <div className="text-xs text-gray-600">Năng lượng phiên</div>
              </div>
              
              <div>
                <div className="text-lg font-bold text-purple-600">
                  {connector.sessionCost || connector.session_cost ? 
                    `${(connector.sessionCost || connector.session_cost).toLocaleString()}đ` : 
                    `${(connector.estimatedCost || connector.costEstimate || 0).toLocaleString()}đ`}
                </div>
                <div className="text-xs text-gray-600">Chi phí phiên</div>
              </div>
            </div>
            
            {(connector.transactionId || connector.txId) && (
              <div className="mt-2 text-center text-xs text-gray-500">
                Transaction ID: {connector.transactionId || connector.txId}
              </div>
            )}
          </div>
        )}

        {/* Total accumulated metrics */}
        <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
          <div>
            <span className="font-medium">Tổng năng lượng:</span>
            <div className="text-lg font-semibold text-gray-900">
              {connector.energyKwh || connector.kwh ? 
                `${(connector.energyKwh || connector.kwh).toFixed(2)} kWh` : '0 kWh'}
            </div>
          </div>
          
          <div>
            <span className="font-medium">Tổng ước tính:</span>
            <div className="text-lg font-semibold text-gray-900">
              {formatCurrency(connector.estimatedCost || connector.costEstimate || 0)}
            </div>
          </div>
        </div>

        {/* Last update time */}
        {connector.lastUpdate && (
          <div className="mt-2 text-xs text-gray-500">
            Cập nhật lần cuối: {formatTime(connector.lastUpdate)}
          </div>
        )}

        {/* Action button */}
        {connector.status === 'Available' && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleStartCharging(connectorId)
            }}
            className="mt-3 w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            ⚡ Bắt đầu sạc
          </button>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin trạm sạc...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Lỗi</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
          >
            Quay lại
          </button>
        </div>
      </div>
    )
  }

  if (!station) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy</h2>
          <p className="text-gray-600 mb-4">Trạm sạc với ID "{stationId}" không tồn tại</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
          >
            Quay lại
          </button>
        </div>
      </div>
    )
  }

  const statusInfo = getStationStatusInfo()
  const metrics = getTotalMetrics()
  const connectors = station.connectors || {}
  const connectorEntries = Object.entries(connectors).filter(([id]) => id !== '0' && id !== 'null')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ← Quay lại
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {station.stationName || station.name || `Station ${stationId}`}
              </h1>
              <p className="text-gray-600">{station.address || 'Chưa có địa chỉ'}</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              statusInfo.color === 'green' ? 'bg-green-100 text-green-800' :
              statusInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {statusInfo.icon} {statusInfo.text}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Station Info */}
        <div className="bg-white rounded-lg shadow-sm border mb-6 p-6">
          <h2 className="text-xl font-semibold mb-4">Thông tin trạm sạc</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {metrics.totalPower > 0 ? `${(metrics.totalPower / 1000).toFixed(1)}kW` : '0kW'}
              </div>
              <div className="text-sm text-gray-600">Tổng công suất hiện tại</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {metrics.totalEnergy.toFixed(2)}kWh
              </div>
              <div className="text-sm text-gray-600">Tổng năng lượng</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(metrics.totalCost)}
              </div>
              <div className="text-sm text-gray-600">Tổng ước tính</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Nhà cung cấp:</span>
              <div>{station.vendor || 'N/A'}</div>
            </div>
            
            <div>
              <span className="font-medium text-gray-700">Model:</span>
              <div>{station.model || 'N/A'}</div>
            </div>
            
            <div>
              <span className="font-medium text-gray-700">Firmware:</span>
              <div>{station.firmwareVersion || 'N/A'}</div>
            </div>
            
            <div>
              <span className="font-medium text-gray-700">Giá điện:</span>
              <div>{formatCurrency(pricePerKwh)}/kWh</div>
            </div>
            
            <div>
              <span className="font-medium text-gray-700">Heartbeat cuối:</span>
              <div>{station.lastHeartbeat ? formatTime(station.lastHeartbeat) : 'N/A'}</div>
            </div>
            
            <div>
              <span className="font-medium text-gray-700">Cập nhật cuối:</span>
              <div>{lastUpdate ? formatTime(lastUpdate) : 'N/A'}</div>
            </div>
          </div>
        </div>

        {/* Connectors */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">
            Connectors ({connectorEntries.length})
          </h2>
          
          {connectorEntries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🔌</div>
              <p>Không có connector nào được tìm thấy</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {connectorEntries.map(([connectorId, connector]) => 
                renderConnectorStatus(connectorId, connector)
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
