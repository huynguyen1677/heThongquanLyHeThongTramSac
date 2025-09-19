// utils/realtime.js
import { ref, onValue, off } from "firebase/database";
import { realtimeDb } from "../services/firebase";

export function listenStationStatuses(callback) {
  const statusRef = ref(realtimeDb, "stationStatuses");
  return onValue(statusRef, (snapshot) => {
    callback(snapshot.val() || {});
  });
}

// Lắng nghe realtime xác nhận sạc cho userId
export function listenChargingRequest(userId, callback) {
  const requestRef = ref(realtimeDb, `chargingRequests/${userId}`);
  const unsubscribe = onValue(requestRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : null);
  });
  // Trả về hàm hủy lắng nghe
  return () => off(requestRef, "value", unsubscribe);
}

// Lắng nghe trạng thái sạc realtime cho userId cụ thể
export function listenUserCharging(userId, callback) {
  const stationsRef = ref(realtimeDb, `live/stations`);
  const unsubscribe = onValue(stationsRef, (snapshot) => {
    let userChargingData = null;
    const stations = snapshot.val();
    
    console.log('Firebase stations data:', stations);
    
    if (stations) {
      // Duyệt qua tất cả các trạm
      Object.entries(stations).forEach(([stationId, station]) => {
        if (station.connectors) {
          // Duyệt qua tất cả các connector
          Object.entries(station.connectors).forEach(([connectorId, connector]) => {
            console.log(`Checking connector ${stationId}-${connectorId}:`, connector);
            
            // Tìm connector của user đang sạc
            if (connector.userId === userId && connector.status === "Charging") {
              userChargingData = {
                ...connector,
                stationId,
                connectorId
              };
              console.log('Found charging session for user:', userChargingData);
            }
          });
        }
      });
    }
    
    console.log('Final userChargingData:', userChargingData);
    callback(userChargingData);
  });
  
  return () => off(stationsRef, "value", unsubscribe);
}