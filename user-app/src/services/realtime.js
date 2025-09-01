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