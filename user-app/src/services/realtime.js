// utils/realtime.js
import { ref, onValue } from "firebase/database";
import { realtimeDb } from "../services/firebase";

export function listenStationStatuses(callback) {
  const statusRef = ref(realtimeDb, "stationStatuses");
  return onValue(statusRef, (snapshot) => {
    callback(snapshot.val() || {});
  });
}