import { rtdb } from './firebase';
import { ref, onValue, off, get } from 'firebase/database';

export const rtdbService = {
  // Subscribe để lắng nghe thay đổi station
  subscribeToStation(stationId, callback) {
    const stationRef = ref(rtdb, `live/stations/${stationId}`);
    onValue(stationRef, callback);
    return () => off(stationRef);
  },

  // Subscribe connector cụ thể
  subscribeToConnector(stationId, connectorId, callback) {
    const connectorRef = ref(rtdb, `live/stations/${stationId}/connectors/${connectorId}`);
    onValue(connectorRef, callback);
    return () => off(connectorRef);
  },

  // Subscribe giá điện (nếu có trong RTDB)
  subscribeToPricing(callback) {
    const priceRef = ref(rtdb, 'live/pricing/pricePerKwh');
    onValue(priceRef, callback);
    return () => off(priceRef);
  },

  // Get all stations with location data
  async getAllStations() {
    try {
      const stationsRef = ref(rtdb, 'live/stations');
      const snapshot = await get(stationsRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      const stationsData = snapshot.val();
      const stations = [];

      for (const [stationId, stationData] of Object.entries(stationsData)) {
        // Only include stations that have location data and are online
        if (stationData.latitude && stationData.longitude && stationData.online) {
          const connectors = [];
          
          // Get connectors data if available
          if (stationData.connectors) {
            for (const [connectorId, connectorData] of Object.entries(stationData.connectors)) {
              // Parse connector data with more details
              connectors.push({
                id: parseInt(connectorId),
                type: connectorData.type || 'AC Type 2',
                power: connectorData.power || 22,
                status: connectorData.status || 'Available',
                errorCode: connectorData.errorCode || 'NoError',
                // Current charging session info
                currentPower: connectorData.W_now || 0,
                sessionKwh: connectorData.session_kwh || 0,
                sessionCost: connectorData.session_cost || 0,
                totalKwh: connectorData.kwh || 0,
                lastUpdate: connectorData.lastUpdate,
                // Status indicators
                isCharging: connectorData.status === 'Charging',
                isAvailable: connectorData.status === 'Available',
                hasError: connectorData.errorCode !== 'NoError'
              });
            }
          }

          stations.push({
            id: stationId,
            name: stationData.stationName || `Station ${stationId}`,
            address: stationData.address || 'Unknown address',
            latitude: stationData.latitude,
            longitude: stationData.longitude,
            rating: 4.5, // Default rating, can be enhanced later
            distance: 0, // Will be calculated based on user location
            connectors,
            vendor: stationData.vendor,
            model: stationData.model,
            online: stationData.online,
            lastHeartbeat: stationData.lastHeartbeat,
            // Station statistics
            totalConnectors: connectors.length,
            availableConnectors: connectors.filter(c => c.isAvailable).length,
            chargingConnectors: connectors.filter(c => c.isCharging).length,
            errorConnectors: connectors.filter(c => c.hasError).length
          });
        }
      }

      return stations;
    } catch (error) {
      console.error('Error getting stations from RTDB:', error);
      return [];
    }
  },

  // Get single station data
  async getStationData(stationId) {
    try {
      console.log('🔍 Getting station data for:', stationId);
      const stationRef = ref(rtdb, `live/stations/${stationId}`);
      const snapshot = await get(stationRef);
      
      console.log('📊 Snapshot exists:', snapshot.exists());
      console.log('📊 Snapshot val:', snapshot.val());
      
      if (!snapshot.exists()) {
        console.warn('❌ No data found for station:', stationId);
        // Try alternative paths
        const altPaths = [
          `stations/${stationId}`,
          `live/${stationId}`,
          `csms/stations/${stationId}`
        ];
        
        for (const altPath of altPaths) {
          console.log(`🔍 Trying alternative path: ${altPath}`);
          const altRef = ref(rtdb, altPath);
          const altSnapshot = await get(altRef);
          if (altSnapshot.exists()) {
            console.log(`✅ Found data at: ${altPath}`, altSnapshot.val());
            break;
          }
        }
        
        return null;
      }

      const stationData = snapshot.val();
      console.log('✅ Raw station data:', stationData);

      // Parse connectors
      const connectors = {};
      if (stationData.connectors) {
        for (const [connectorId, connectorData] of Object.entries(stationData.connectors)) {
          connectors[connectorId] = {
            id: parseInt(connectorId),
            type: connectorData.type || 'AC Type 2',
            power: connectorData.power || 22,
            status: connectorData.status || 'Available',
            errorCode: connectorData.errorCode || 'NoError',
            currentPower: connectorData.W_now || 0,
            sessionKwh: connectorData.session_kwh || 0,
            sessionCost: connectorData.session_cost || 0,
            totalKwh: connectorData.kwh || 0,
            lastUpdate: connectorData.lastUpdate,
            isCharging: connectorData.status === 'Charging',
            isAvailable: connectorData.status === 'Available',
            hasError: connectorData.errorCode !== 'NoError'
          };
        }
      }

      const result = {
        id: stationId,
        name: stationData.name || stationId,
        address: stationData.address || 'Chưa có địa chỉ',
        vendor: stationData.vendor,
        model: stationData.model,
        latitude: stationData.latitude,
        longitude: stationData.longitude,
        online: stationData.online !== false,
        status: stationData.online !== false ? 'online' : 'offline',
        rating: stationData.rating || 4.5,
        connectors,
        totalConnectors: Object.keys(connectors).length,
        availableConnectors: Object.values(connectors).filter(c => c.status === 'Available').length,
        chargingConnectors: Object.values(connectors).filter(c => c.status === 'Charging').length,
        errorConnectors: Object.values(connectors).filter(c => c.hasError).length,
        lastUpdate: stationData.lastUpdate || new Date().toISOString()
      };

      console.log('Processed station data:', result);
      return result;
    } catch (error) {
      console.error('Error getting station data:', error);
      return null;
    }
  },

  // Debug function to check Firebase structure
  async debugFirebaseStructure() {
    try {
      console.log('🔍 Debugging Firebase structure...');
      
      const rootRef = ref(rtdb, '/');
      const rootSnapshot = await get(rootRef);
      
      if (rootSnapshot.exists()) {
        const rootData = rootSnapshot.val();
        console.log('🌳 Firebase root structure:', Object.keys(rootData));
        
        // Check common paths
        const pathsToCheck = [
          'live',
          'live/stations', 
          'stations',
          'csms',
          'csms/stations'
        ];
        
        for (const path of pathsToCheck) {
          const pathRef = ref(rtdb, path);
          const pathSnapshot = await get(pathRef);
          if (pathSnapshot.exists()) {
            const pathData = pathSnapshot.val();
            console.log(`✅ Path '${path}' exists:`, typeof pathData === 'object' ? Object.keys(pathData) : pathData);
          } else {
            console.log(`❌ Path '${path}' does not exist`);
          }
        }
      } else {
        console.log('❌ Firebase root is empty');
      }
    } catch (error) {
      console.error('🚨 Error debugging Firebase:', error);
    }
  },

  // Subscribe to all stations for real-time updates
  subscribeToAllStations(callback) {
    const stationsRef = ref(rtdb, 'live/stations');
    onValue(stationsRef, (snapshot) => {
      if (snapshot.exists()) {
        const stationsData = snapshot.val();
        const stations = [];

        for (const [stationId, stationData] of Object.entries(stationsData)) {
          if (stationData.latitude && stationData.longitude && stationData.online) {
            const connectors = [];
            
            if (stationData.connectors) {
              for (const [connectorId, connectorData] of Object.entries(stationData.connectors)) {
                connectors.push({
                  id: parseInt(connectorId),
                  type: connectorData.type || 'AC Type 2',
                  power: connectorData.power || 22,
                  status: connectorData.status || 'Available',
                  errorCode: connectorData.errorCode || 'NoError',
                  currentPower: connectorData.W_now || 0,
                  sessionKwh: connectorData.session_kwh || 0,
                  sessionCost: connectorData.session_cost || 0,
                  totalKwh: connectorData.kwh || 0,
                  lastUpdate: connectorData.lastUpdate,
                  isCharging: connectorData.status === 'Charging',
                  isAvailable: connectorData.status === 'Available',
                  hasError: connectorData.errorCode !== 'NoError'
                });
              }
            }

            stations.push({
              id: stationId,
              name: stationData.stationName || `Station ${stationId}`,
              address: stationData.address || 'Unknown address',
              latitude: stationData.latitude,
              longitude: stationData.longitude,
              rating: 4.5,
              distance: 0,
              connectors,
              vendor: stationData.vendor,
              model: stationData.model,
              online: stationData.online,
              lastHeartbeat: stationData.lastHeartbeat,
              totalConnectors: connectors.length,
              availableConnectors: connectors.filter(c => c.isAvailable).length,
              chargingConnectors: connectors.filter(c => c.isCharging).length,
              errorConnectors: connectors.filter(c => c.hasError).length
            });
          }
        }

        callback(stations);
      } else {
        callback([]);
      }
    });
    
    return () => off(stationsRef);
  }
};
