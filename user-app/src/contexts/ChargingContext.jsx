import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { collection, query, where, orderBy, limit, onSnapshot, doc, addDoc, updateDoc } from 'firebase/firestore'
import { ref, onValue, off } from 'firebase/database'
import { db, realtimeDb } from '../services/firebase'
import { useAuth } from './AuthContext'
import apiService from '../services/api'
import settingsService from '../services/settingsService'

const ChargingContext = createContext()

export const useCharging = () => {
  const context = useContext(ChargingContext)
  if (!context) {
    throw new Error('useCharging must be used within a ChargingProvider')
  }
  return context
}

export const ChargingProvider = ({ children }) => {
  const [stations, setStations] = useState([])
  const [activeSession, setActiveSession] = useState(null)
  const [chargingHistory, setChargingHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [pricePerKwh, setPricePerKwh] = useState(3500)
  const { user } = useAuth()


  // Load charging history từ Firebase khi user đăng nhập
  useEffect(() => {
    if (!user) {
      setChargingHistory([])
      setActiveSession(null)
      return
    }

    // Lắng nghe charging history từ Firestore
    const historyQuery = query(
      collection(db, 'chargingSessions'),
      where('userId', '==', user.id),
      orderBy('startTime', 'desc'),
      limit(50)
    )

    const unsubscribe = onSnapshot(historyQuery, (snapshot) => {
      const sessions = []
      snapshot.forEach((doc) => {
        sessions.push({ id: doc.id, ...doc.data() })
      })
      setChargingHistory(sessions)

      // Tìm active session
      const activeSession = sessions.find(s => s.status === 'Charging')
      setActiveSession(activeSession || null)
    })

    return () => unsubscribe()
  }, [user])

  // Load price per kWh và lắng nghe thay đổi
  useEffect(() => {
    const loadPrice = async () => {
      const price = await settingsService.getPricePerKwh()
      setPricePerKwh(price)
    }

    loadPrice()

    // Lắng nghe thay đổi giá
    const unsubscribePrice = settingsService.listenToPriceChanges((newPrice) => {
      setPricePerKwh(newPrice)
      console.log('Price per kWh updated:', newPrice)
    })

    return () => {
      if (unsubscribePrice) unsubscribePrice()
    }
  }, [])

  // Load stations từ Firestore và theo dõi real-time updates
  useEffect(() => {
    const loadFirestoreStations = () => {
      const stationsQuery = query(collection(db, 'stations'))
      
      return onSnapshot(stationsQuery, (snapshot) => {
        const firestoreStations = []
        snapshot.forEach((doc) => {
          firestoreStations.push({
            id: doc.id,
            ...doc.data()
          })
        })
        
        console.log('Loaded stations from Firestore:', firestoreStations)
        setStations(firestoreStations)
      }, (error) => {
        console.error('Error loading stations from Firestore:', error)
        // Fallback to mock data if Firestore fails
        setStations(mockStations)
      })
    }

    // Load stations từ Firestore
    const unsubscribeFirestore = loadFirestoreStations()

    return () => {
      if (unsubscribeFirestore) unsubscribeFirestore()
    }
  }, [])

  // Lắng nghe và cập nhật trạng thái tổng thể của tất cả trạm và connector
  // (dùng cho danh sách trạm)
  useEffect(() => {
    const liveStationsRef = ref(realtimeDb, 'live/stations')

    const handleLiveStationsUpdate = (snapshot) => {
      const liveData = snapshot.val()
      console.log('Live stations data from RTDB:', liveData)

      setStations(prevStations =>
        prevStations.map(station => {
          const liveStation = liveData?.[station.id]
          if (liveStation) {
            // Chỉ cập nhật các trường trạng thái từ realtime
            let updatedStation = { ...station }
            updatedStation.online = !!liveStation.online
            updatedStation.lastHeartbeat = liveStation.lastHeartbeat
            updatedStation.status = liveStation.online ? 'Online' : 'Offline'

            // Merge connectors trạng thái realtime
            if (liveStation.connectors && station.connectors) {
              const connectorsArray = Array.isArray(station.connectors)
                ? station.connectors
                : Object.entries(station.connectors).map(([id, val]) => ({ id, ...val }))

              updatedStation.connectors = connectorsArray.map(connector => {
                const liveConnector = liveStation.connectors[connector.id]
                return {
                  ...connector,
                  ...(liveConnector
                    ? {
                        status: liveConnector.status || 'Unavailable',
                        txId: liveConnector.txId,
                        energyConsumed: liveConnector.kwh || 0,
                        currentPower: liveConnector.W_now || 0,
                        sessionKwh: liveConnector.session_kwh || 0,
                        sessionCost: liveConnector.session_cost || 0,
                        totalCost: liveConnector.costEstimate || 0,
                        lastUpdate: liveConnector.lastUpdate,
                        errorCode: liveConnector.errorCode
                      }
                    : {})
                }
              })
            }
            return updatedStation
          }
          // Nếu không có realtime thì không set status/online/lastHeartbeat
          return { ...station }
        })
      )
    }

    onValue(liveStationsRef, handleLiveStationsUpdate, (error) => {
      console.error('Error listening to live stations:', error)
    })

    return () => {
      off(liveStationsRef, 'value', handleLiveStationsUpdate)
    }
  }, [])

  // Lắng nghe chi tiết realtime cho phiên sạc đang diễn ra của user
  // (dùng cho màn hình chi tiết phiên sạc)
  useEffect(() => {
    if (!activeSession || !user) return
    // Lắng nghe thay đổi của connector đang sạc
    const connectorRef = ref(realtimeDb, `live/stations/${activeSession.stationId}/connectors/${activeSession.connectorId}`)
    
    const handleConnectorUpdate = (snapshot) => {
      const connectorData = snapshot.val()
      if (connectorData && connectorData.txId) {
        // Cập nhật session với dữ liệu real-time từ connector
        setActiveSession(prev => ({
          ...prev,
          energyConsumed: connectorData.session_kwh || prev.energyConsumed || 0,
          totalEnergyConsumed: connectorData.kwh || 0,
          cost: connectorData.session_cost || prev.cost || 0,
          totalCost: connectorData.costEstimate || 0,
          currentPower: connectorData.W_now || 0,
          connectorStatus: connectorData.status,
          lastUpdate: connectorData.lastUpdate,
          transactionId: connectorData.txId,
          meterValues: {
            ...prev.meterValues,
            whTotal: connectorData.Wh_total || 0,
            sessionKwh: connectorData.session_kwh || 0,
            power: connectorData.W_now || 0
          }
        }))
      }
    }

    onValue(connectorRef, handleConnectorUpdate, (error) => {
      console.error('Error listening to connector updates:', error)
    })

    return () => {
      off(connectorRef, 'value', handleConnectorUpdate)
    }
  }, [activeSession?.id, activeSession?.stationId, activeSession?.connectorId, user])

  // Bắt đầu phiên sạc
  const startCharging = useCallback(async (stationId, connectorId, options = {}) => {
    if (!user) {
      throw new Error('Vui lòng đăng nhập để bắt đầu sạc')
    }

    if (activeSession) {
      throw new Error('Bạn đã có phiên sạc đang hoạt động')
    }

    const station = stations.find(s => s.id === stationId)
    const connector = station?.connectors?.find(c => c.id === parseInt(connectorId))
    
    if (!station || !connector) {
      throw new Error('Không tìm thấy trạm sạc hoặc cổng sạc')
    }

    if (connector.status !== 'Available') {
      throw new Error('Cổng sạc không khả dụng')
    }

    try {
      // Tạo session trong Firestore trước
      const sessionData = {
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        stationId,
        stationName: station.name,
        stationAddress: station.address,
        connectorId: parseInt(connectorId),
        connectorType: connector.type,
        power: connector.power,
        pricePerKwh: pricePerKwh, // Sử dụng giá hiện tại từ settings
        startTime: new Date().toISOString(),
        status: 'Charging',
        energyConsumed: 0,
        totalEnergyConsumed: 0,
        estimatedCost: 0,
        targetEnergy: options.targetEnergy || null,
        paymentMethod: options.paymentMethod || 'wallet',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        meterValues: {
          whTotal: 0,
          sessionKwh: 0,
          power: 0
        }
      }

      // Lưu vào Firestore
      const sessionDoc = await addDoc(collection(db, 'chargingSessions'), sessionData)
      const session = { id: sessionDoc.id, ...sessionData }

      // Gửi lệnh start charging đến CSMS qua API
      const idTag = user.id // Sử dụng user ID làm idTag
      await apiService.startCharging(stationId, connectorId, idTag)

      setActiveSession(session)
      return session
    } catch (error) {
      console.error('Error starting charging:', error)
      throw new Error(error.message || 'Không thể bắt đầu sạc')
    }
  }, [stations, activeSession, user, pricePerKwh])

  // Dừng phiên sạc
  const stopCharging = useCallback(async () => {
    if (!activeSession) {
      throw new Error('Không có phiên sạc đang hoạt động')
    }

    try {
      const endTime = new Date().toISOString()
      const duration = (new Date(endTime) - new Date(activeSession.startTime)) / 1000 / 60 // minutes

      // Cập nhật session trong Firestore
      const updatedData = {
        endTime,
        duration,
        status: 'Completed',
        updatedAt: endTime
      }

      await updateDoc(doc(db, 'chargingSessions', activeSession.id), updatedData)

      // Gửi lệnh stop charging đến CSMS qua API
      if (activeSession.transactionId) {
        await apiService.stopCharging(activeSession.stationId, activeSession.transactionId)
      }

      const completedSession = {
        ...activeSession,
        ...updatedData
      }

      setActiveSession(null)
      return completedSession
    } catch (error) {
      console.error('Error stopping charging:', error)
      throw new Error(error.message || 'Không thể dừng sạc')
    }
  }, [activeSession])

  // Refresh stations
  const refreshStations = useCallback(async () => {
    setLoading(true)
    try {
      const response = await apiService.getStations()
      if (response.success) {
        setStations(response.data)
      }
    } catch (error) {
      console.error('Error refreshing stations:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const value = {
    stations,
    activeSession,
    chargingHistory,
    loading,
    pricePerKwh,
    startCharging,
    stopCharging,
    refreshStations
  }

  return (
    <ChargingContext.Provider value={value}>
      {children}
    </ChargingContext.Provider>
  )
}
