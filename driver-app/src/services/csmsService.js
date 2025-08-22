// CSMS API service for driver app
const CSMS_BASE_URL = 'http://localhost:3001/api';

class CSMSService {
  // Get all stations with real-time status
  static async getAllStations() {
    try {
      const response = await fetch(`${CSMS_BASE_URL}/stations`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Error fetching stations:', error);
      throw error;
    }
  }

  // Get station by ID with connector status
  static async getStationById(stationId) {
    try {
      const response = await fetch(`${CSMS_BASE_URL}/stations/${stationId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Error fetching station:', error);
      throw error;
    }
  }

  // Start charging session
  static async startCharging(stationId, connectorId, userId) {
    try {
      const response = await fetch(`${CSMS_BASE_URL}/stations/${stationId}/connectors/${connectorId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          idTag: userId,
          timestamp: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error starting charging:', error);
      throw error;
    }
  }

  // Stop charging session
  static async stopCharging(stationId, connectorId, transactionId) {
    try {
      const response = await fetch(`${CSMS_BASE_URL}/stations/${stationId}/connectors/${connectorId}/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId: transactionId,
          timestamp: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error stopping charging:', error);
      throw error;
    }
  }

  // Get charging sessions for user
  static async getUserChargingSessions(userId) {
    try {
      const response = await fetch(`${CSMS_BASE_URL}/chargingSessions/user/${userId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Error fetching user sessions:', error);
      throw error;
    }
  }

  // Get real-time station status (for map updates)
  static async getStationStatus(stationId) {
    try {
      const response = await fetch(`${CSMS_BASE_URL}/stations/${stationId}/status`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Error fetching station status:', error);
      throw error;
    }
  }

  // Check connector availability
  static async checkConnectorAvailability(stationId, connectorId) {
    try {
      const response = await fetch(`${CSMS_BASE_URL}/stations/${stationId}/connectors/${connectorId}/status`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Error checking connector availability:', error);
      throw error;
    }
  }
}

export default CSMSService;
