import { useState, useEffect } from 'react'
import { rtdbService } from '../services/rtdb'

export function RealtimeDemo() {
  const [allStations, setAllStations] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedStationId, setSelectedStationId] = useState(null)

  useEffect(() => {
    // Debug Firebase structure first
    rtdbService.debugFirebaseStructure()

    // Subscribe to all stations
    const unsubscribe = rtdbService.subscribeToAllStations((stations) => {
      console.log('📊 Received stations update:', stations)
      setAllStations(stations)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const renderConnectorStatus = (connectorId, connector) => {
    const getStatusColor = (status) => {
      switch (status) {
        case 'Available': return 'bg-green-100 text-green-800'
        case 'Charging': return 'bg-blue-100 text-blue-800'
        case 'Unavailable': return 'bg-red-100 text-red-800'
        default: return 'bg-gray-100 text-gray-800'
      }
    }

    const isCharging = connector.status === 'Charging'
    const hasTransaction = connector.txId || connector.session_kwh > 0

    return (
      <div key={connectorId} className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">Connector {connectorId}</h4>
          <span className={`px-2 py-1 rounded-full text-sm ${getStatusColor(connector.status)}`}>
            {connector.status}
          </span>
        </div>

        {connector.errorCode && connector.errorCode !== 'NoError' && (
          <div className="bg-red-50 border border-red-200 rounded p-2 text-red-700 text-sm">
            ❌ Error: {connector.errorCode}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="font-medium">Current Power:</span>
            <div>{connector.W_now ? `${(connector.W_now / 1000).toFixed(1)} kW` : '0 kW'}</div>
          </div>
          
          <div>
            <span className="font-medium">Total Energy:</span>
            <div>{connector.kwh ? `${connector.kwh.toFixed(2)} kWh` : '0 kWh'}</div>
          </div>
          
          <div>
            <span className="font-medium">Session Energy:</span>
            <div>{connector.session_kwh ? `${connector.session_kwh.toFixed(2)} kWh` : '0 kWh'}</div>
          </div>
          
          <div>
            <span className="font-medium">Session Cost:</span>
            <div>{connector.session_cost ? `${connector.session_cost.toLocaleString()} đ` : '0 đ'}</div>
          </div>
          
          <div>
            <span className="font-medium">Total Estimate:</span>
            <div>{connector.costEstimate ? `${connector.costEstimate.toLocaleString()} đ` : '0 đ'}</div>
          </div>
          
          <div>
            <span className="font-medium">Last Update:</span>
            <div className="text-xs">{connector.lastUpdate ? new Date(connector.lastUpdate).toLocaleString() : 'N/A'}</div>
          </div>
        </div>

        {connector.txId && (
          <div className="bg-blue-50 border border-blue-200 rounded p-2 text-blue-700 text-sm">
            Transaction ID: {connector.txId}
          </div>
        )}
      </div>
    )
  }

  const renderStationCard = (stationId, station) => {
    const connectors = station.connectors || {}
    const connectorEntries = Object.entries(connectors).filter(([id]) => id !== '0' && id !== 'null')
    
    const getStatusColor = () => {
      if (!station.online) return 'bg-red-100 text-red-800'
      const availableCount = connectorEntries.filter(([_, c]) => c.status === 'Available').length
      return availableCount > 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
    }

    return (
      <div key={stationId} className="border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">{station.stationName || stationId}</h3>
            <p className="text-gray-600">{station.address || 'No address'}</p>
            <p className="text-sm text-gray-500">
              {station.vendor} {station.model} {station.firmwareVersion}
            </p>
          </div>
          
          <div className="text-right">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
              {station.online ? 'Online' : 'Offline'}
            </span>
            {station.lastHeartbeat && (
              <div className="text-xs text-gray-500 mt-1">
                Last heartbeat: {new Date(station.lastHeartbeat).toLocaleString()}
              </div>
            )}
          </div>
        </div>

        {station.latitude && station.longitude && (
          <div className="text-sm text-gray-600">
            📍 Location: {station.latitude.toFixed(6)}, {station.longitude.toFixed(6)}
          </div>
        )}

        <div className="space-y-3">
          <h4 className="font-semibold">Connectors ({connectorEntries.length})</h4>
          {connectorEntries.length === 0 ? (
            <div className="text-gray-500 text-center py-4">No connectors found</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {connectorEntries.map(([connectorId, connector]) => 
                renderConnectorStatus(connectorId, connector)
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => setSelectedStationId(selectedStationId === stationId ? null : stationId)}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {selectedStationId === stationId ? 'Hide Raw Data' : 'Show Raw Data'}
        </button>

        {selectedStationId === stationId && (
          <div className="bg-gray-100 rounded-lg p-4">
            <h5 className="font-semibold mb-2">Raw Station Data:</h5>
            <pre className="text-xs overflow-auto max-h-64">
              {JSON.stringify(station, null, 2)}
            </pre>
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading realtime data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Realtime Data Demo</h1>
          <p className="text-gray-600">
            Monitoring {Object.keys(allStations).length} stations in realtime
          </p>
        </div>

        {Object.keys(allStations).length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📡</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Stations Found</h2>
            <p className="text-gray-600">Check Firebase Realtime Database connection</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {Object.entries(allStations).map(([stationId, station]) => 
              renderStationCard(stationId, station)
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default RealtimeDemo
