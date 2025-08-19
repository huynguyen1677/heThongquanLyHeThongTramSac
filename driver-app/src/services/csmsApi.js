import { auth } from './firebase';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

// Helper để lấy ID token của user hiện tại
async function getAuthToken() {
  const user = auth.currentUser;
  if (user) {
    return await user.getIdToken();
  }
  throw new Error('User not authenticated');
}

// Helper để gọi API với auth header
async function apiCall(endpoint, options = {}) {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

// API functions
export const csmsApi = {
  // Bắt đầu sạc
  async startCharging(stationId, connectorId, idTag) {
    return await apiCall('/api/driver/start', {
      method: 'POST',
      body: JSON.stringify({
        stationId,
        connectorId,
        idTag
      })
    });
  },

  // Dừng sạc
  async stopCharging(stationId, connectorId, txId) {
    return await apiCall('/api/driver/stop', {
      method: 'POST',
      body: JSON.stringify({
        stationId,
        connectorId,
        txId
      })
    });
  },

  // Lấy giá điện hiệu lực
  async getEffectivePrice(stationId) {
    return await apiCall(`/api/pricing/effective?stationId=${stationId}`);
  },

  // Lấy thông tin trạm
  async getStationInfo(stationId) {
    return await apiCall(`/api/stations/${stationId}`);
  }
};
