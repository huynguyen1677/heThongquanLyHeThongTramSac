// Service for connecting to CSMS API endpoints
const CSMS_BASE_URL = 'http://localhost:3001/api';

class CSMSApiService {
  // Get charging sessions for a specific user
  static async getChargingSessionsByUser(userId) {
    try {
      const response = await fetch(`${CSMS_BASE_URL}/charging-sessions/user/${userId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching user charging sessions:', error);
      throw error;
    }
  }

  // Get charging sessions for a specific station
  static async getChargingSessionsByStation(stationId) {
    try {
      const response = await fetch(`${CSMS_BASE_URL}/charging-sessions/station/${stationId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching station charging sessions:', error);
      throw error;
    }
  }

  // Get charging sessions for a specific owner
  static async getChargingSessionsByOwner(ownerId) {
    try {
      const response = await fetch(`${CSMS_BASE_URL}/charging-sessions/owner/${ownerId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching owner charging sessions:', error);
      throw error;
    }
  }

  // Get all charging sessions with optional filters
  static async getAllChargingSessions(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.limit) queryParams.append('limit', filters.limit);
      
      const url = `${CSMS_BASE_URL}/charging-sessions${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching all charging sessions:', error);
      throw error;
    }
  }

  // Get specific charging session by ID
  static async getChargingSessionById(sessionId) {
    try {
      const response = await fetch(`${CSMS_BASE_URL}/charging-sessions/${sessionId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching charging session by ID:', error);
      throw error;
    }
  }

  // Get charging session statistics for an owner
  static async getChargingSessionStats(ownerId, timeRange = '30d') {
    try {
      const response = await fetch(`${CSMS_BASE_URL}/charging-sessions/stats/${ownerId}?range=${timeRange}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching charging session stats:', error);
      throw error;
    }
  }
}

export default CSMSApiService;
