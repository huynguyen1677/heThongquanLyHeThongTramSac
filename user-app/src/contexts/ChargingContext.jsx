import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ref, onValue, off, update } from "firebase/database";
import useStations from "./useStations";
import useChargingHistory from "./useChargingHistory";
import { useAuth } from "./AuthContext";
import { realtimeDb } from "../services/firebase";

const ChargingContext = createContext();

export const ChargingProvider = ({ children }) => {
  const { stations, loading: stationsLoading, error: stationsError } = useStations();
  const [confirmationRequest, setConfirmationRequest] = useState(null);

  const { user } = useAuth();
  let userId = user?.userId;
  if (!userId) {
    userId = localStorage.getItem("userId") || null;
  }
  if (typeof userId === "number") userId = userId.toString();

  const { chargingHistory, loading: historyLoading, error: historyError } = useChargingHistory(userId);

  // Listen for charging confirmation requests
  useEffect(() => {
    if (!user || !user.userId) {
      setConfirmationRequest(null)
      return
    }

    const confirmationRef = ref(realtimeDb, `chargingRequests/${user.userId}`)
    
    const unsubscribe = onValue(confirmationRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        if (data.status === 'pending') {
          setConfirmationRequest(data)
        } else {
          setConfirmationRequest(null)
        }
      } else {
        setConfirmationRequest(null)
      }
    })

    return () => off(confirmationRef, 'value', unsubscribe)
  }, [user?.userId])

  // Respond to charging confirmation request
  const respondToConfirmationRequest = useCallback(async (approved) => {
    if (!confirmationRequest || !user?.userId) {
      return
    }

    try {
      const confirmationRef = ref(realtimeDb, `chargingRequests/${user.userId}`)
      await update(confirmationRef, {
        status: approved ? 'accepted' : 'denied',
        responseTime: Date.now()
      })
      setConfirmationRequest(null)
    } catch (error) {
      setConfirmationRequest(null)
    }
  }, [confirmationRequest, user?.userId])

  const value = {
    stations,
    stationsLoading,
    stationsError,
    chargingHistory,
    historyLoading,
    historyError,
    confirmationRequest,
    respondConfirmation: respondToConfirmationRequest
    // Đã xóa handleSimulatorRequest, handleSessionComplete
  };

  return (
    <ChargingContext.Provider value={value}>
      {children}
    </ChargingContext.Provider>
  );
};

export const useCharging = () => useContext(ChargingContext);