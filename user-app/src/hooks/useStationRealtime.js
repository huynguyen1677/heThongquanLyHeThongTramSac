import { useState, useEffect } from 'react'
import { ref, onValue, off } from 'firebase/database'
import { realtimeDb } from '../services/firebase'

// Custom hook để lắng nghe realtime data của một trạm cụ thể
export const useStationRealtime = (stationId) => {
  const [stationData, setStationData] = useState(null)
  const [connectors, setConnectors] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!stationId) {
      setStationData(null)
      setConnectors([])
      return
    }

    setLoading(true)
    setError(null)

    // Lắng nghe dữ liệu realtime của trạm cụ thể
    const stationRef = ref(realtimeDb, `live/stations/${stationId}`)

    const handleStationUpdate = (snapshot) => {
      try {
        const liveStationData = snapshot.val()
        console.log(`[Realtime] Station ${stationId} update:`, liveStationData)

        if (liveStationData) {
          // Cập nhật thông tin tổng quan của trạm
          setStationData({
            id: stationId,
            online: !!liveStationData.online,
            lastHeartbeat: liveStationData.lastHeartbeat,
            status: liveStationData.online ? 'Online' : 'Offline',
            model: liveStationData.model,
            vendor: liveStationData.vendor,
            firmwareVersion: liveStationData.firmwareVersion,
            serialNumber: liveStationData.serialNumber,
            // Thêm các trường khác nếu cần
          })

          // Xử lý connectors realtime
          if (liveStationData.connectors) {
            const connectorsArray = Object.entries(liveStationData.connectors).map(([id, connectorData]) => ({
              id: id,
              status: connectorData.status || 'Unavailable',
              txId: connectorData.txId,
              energyConsumed: connectorData.kwh || 0,
              currentPower: connectorData.W_now || 0,
              sessionKwh: connectorData.session_kwh || 0,
              sessionCost: connectorData.session_cost || 0,
              totalCost: connectorData.costEstimate || 0,
              lastUpdate: connectorData.lastUpdate,
              errorCode: connectorData.errorCode,
              voltage: connectorData.voltage || 0,
              current: connectorData.current || 0,
              temperature: connectorData.temperature || 0,
              // Thêm các meter values khác
              meterValues: {
                whTotal: connectorData.Wh_total || 0,
                sessionKwh: connectorData.session_kwh || 0,
                power: connectorData.W_now || 0,
                voltage: connectorData.voltage || 0,
                current: connectorData.current || 0,
                temperature: connectorData.temperature || 0,
                frequency: connectorData.frequency || 0,
                powerFactor: connectorData.powerFactor || 0,
              },
              // Thông tin session nếu đang sạc
              activeSession: connectorData.txId ? {
                transactionId: connectorData.txId,
                startTime: connectorData.startTime,
                idTag: connectorData.idTag,
                meterStart: connectorData.meterStart || 0,
                sessionDuration: connectorData.sessionDuration || 0,
              } : null
            }))

            setConnectors(connectorsArray)
          } else {
            setConnectors([])
          }
        } else {
          // Nếu không có dữ liệu realtime
          setStationData({
            id: stationId,
            online: false,
            status: 'Offline',
            lastHeartbeat: null
          })
          setConnectors([])
        }

        setLoading(false)
      } catch (err) {
        console.error(`Error processing station ${stationId} update:`, err)
        setError(err.message)
        setLoading(false)
      }
    }

    const handleError = (error) => {
      console.error(`Error listening to station ${stationId}:`, error)
      setError(error.message)
      setLoading(false)
    }

    // Bắt đầu lắng nghe
    onValue(stationRef, handleStationUpdate, handleError)

    // Cleanup function
    return () => {
      off(stationRef, 'value', handleStationUpdate)
    }
  }, [stationId])

  // Helper function để lấy connector cụ thể
  const getConnector = (connectorId) => {
    return connectors.find(c => c.id === connectorId || c.id === String(connectorId))
  }

  // Helper function để lấy trạng thái tổng quan
  const getStationSummary = () => {
    if (!stationData) return null

    const availableConnectors = connectors.filter(c => c.status === 'Available').length
    const chargingConnectors = connectors.filter(c => c.status === 'Charging').length
    const totalConnectors = connectors.length

    return {
      ...stationData,
      totalConnectors,
      availableConnectors,
      chargingConnectors,
      occupancyRate: totalConnectors > 0 ? ((totalConnectors - availableConnectors) / totalConnectors * 100).toFixed(1) : 0
    }
  }

  return {
    stationData,
    connectors,
    loading,
    error,
    getConnector,
    getStationSummary
  }
}

export default useStationRealtime
