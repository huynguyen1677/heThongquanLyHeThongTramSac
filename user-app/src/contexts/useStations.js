import { useState, useEffect } from "react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { ref, onValue, off } from "firebase/database";
import { db, realtimeDb } from "../services/firebase";

export default function useStations() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load stations từ Firestore
  useEffect(() => {
    setLoading(true);
    const stationsQuery = query(collection(db, "stations"));
    const unsubscribe = onSnapshot(
      stationsQuery,
      (snapshot) => {
        const firestoreStations = [];
        snapshot.forEach((doc) => {
          firestoreStations.push({
            id: doc.id,
            ...doc.data(),
          });
        });
        setStations(firestoreStations);
        setError(null);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading stations from Firestore:", error);
        setError("Không thể tải danh sách trạm sạc. Vui lòng thử lại sau.");
        setStations([]);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Lắng nghe realtime trạng thái trạm
  useEffect(() => {
    const liveStationsRef = ref(realtimeDb, "live/stations");
    const handleLiveStationsUpdate = (snapshot) => {
      const liveData = snapshot.val();
      setStations((prevStations) =>
        prevStations.map((station) => {
          const liveStation = liveData?.[station.id];
          if (liveStation) {
            let updatedStation = { ...station };
            updatedStation.online = !!liveStation.online;
            updatedStation.lastHeartbeat = liveStation.lastHeartbeat;
            updatedStation.status = liveStation.online ? "Online" : "Offline";
            // Merge connectors trạng thái realtime
            if (liveStation.connectors && station.connectors) {
              const connectorsArray = Array.isArray(station.connectors)
                ? station.connectors
                : Object.entries(station.connectors).map(([id, val]) => ({ id, ...val }));
              updatedStation.connectors = connectorsArray.map((connector) => {
                const liveConnector = liveStation.connectors[connector.id];
                return {
                  ...connector,
                  ...(liveConnector
                    ? {
                        status: liveConnector.status || "Unavailable",
                        txId: liveConnector.txId,
                        energyConsumed: liveConnector.kwh || 0,
                        currentPower: liveConnector.W_now || 0,
                        sessionKwh: liveConnector.session_kwh || 0,
                        sessionCost: liveConnector.session_cost || 0,
                        totalCost: liveConnector.costEstimate || 0,
                        lastUpdate: liveConnector.lastUpdate,
                        errorCode: liveConnector.errorCode,
                      }
                    : {}),
                };
              });
            }
            return updatedStation;
          }
          return { ...station };
        })
      );
    };
    onValue(liveStationsRef, handleLiveStationsUpdate, (error) => {
      console.error("Error listening to live stations:", error);
      setError("Không thể cập nhật trạng thái trạm realtime.");
    });
    return () => {
      off(liveStationsRef, "value", handleLiveStationsUpdate);
    };
  }, []);

  return { stations, loading, error };
}