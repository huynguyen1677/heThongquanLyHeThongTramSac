import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
    })

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const user = JSON.parse(localStorage.getItem('user') || 'null')
        if (user?.token) {
          config.headers.Authorization = `Bearer ${user.token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response.data,
      (error) => {
        console.error('API Error:', error.response?.data || error.message)
        return Promise.reject(error.response?.data || error)
      }
    )
  }

  // Stations API
  async getStations() {
    return this.api.get('/stations')
  }

  async getStation(stationId) {
    return this.api.get(`/stations/${stationId}`)
  }

  async getStationConnectors(stationId) {
    return this.api.get(`/stations/${stationId}/connectors`)
  }

  async startCharging(stationId, connectorId, idTag) {
    return this.api.post(`/stations/${stationId}/start`, {
      connectorId,
      idTag
    })
  }

  async stopCharging(stationId, transactionId) {
    return this.api.post(`/stations/${stationId}/stop`, {
      transactionId
    })
  }

  // Charging Sessions API
  async getChargingSessionsByUser(userId) {
    return this.api.get(`/chargingSessions/user/${userId}`)
  }

  async getChargingSession(sessionId) {
    return this.api.get(`/chargingSessions/${sessionId}`)
  }

  // System API
  async getSystemOverview() {
    return this.api.get('/system/overview')
  }

  async getSystemStats() {
    return this.api.get('/system/stats')
  }
}

export default new ApiService()
