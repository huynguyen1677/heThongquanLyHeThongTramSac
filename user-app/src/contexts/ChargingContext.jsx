import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ref, onValue, off, update } from "firebase/database";
import useStations from "./useStations";
import useChargingHistory from "./useChargingHistory";
import { useAuth } from "./AuthContext";
import { realtimeDb } from "../services/firebase";

const ChargingContext = createContext();

export const ChargingProvider = ({ children }) => {
  const { stations, loading: stationsLoading, error: stationsError } = useStations();
  const [confirmationRequest, setConfirmationRequest] = useState(null)

  // Lấy userId từ context xác thực (ưu tiên), fallback localStorage nếu cần
  const { user } = useAuth();
  let userId = user?.userId;
  if (!userId) {
    userId = localStorage.getItem("userId") || null;
  }
  // Đảm bảo userId là string
  if (typeof userId === "number") userId = userId.toString();
  console.log("ChargingProvider userId:", userId, typeof userId);

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
        console.log('🔔 Received confirmation request:', data)
        if (data.status === 'pending') {
          setConfirmationRequest(data)
        } else {
          setConfirmationRequest(null)
        }
      } else {
        setConfirmationRequest(null)
      }
    })

    console.log(`👂 Listening for confirmation requests at: chargingRequests/${user.userId}`)
    return () => off(confirmationRef, 'value', unsubscribe)
  }, [user?.userId])
  

  // Respond to charging confirmation request
  const respondToConfirmationRequest = useCallback(async (approved) => {
    console.log('🔥 respondToConfirmationRequest called with:', approved)
    console.log('🔥 confirmationRequest:', confirmationRequest)
    console.log('🔥 user.userId:', user?.userId)
    
    if (!confirmationRequest || !user?.userId) {
      console.log('❌ Missing confirmationRequest or userId')
      return
    }

    try {
      console.log(`📤 Responding to confirmation: ${approved ? 'ACCEPTED' : 'DENIED'}`)
      const confirmationRef = ref(realtimeDb, `chargingRequests/${user.userId}`)
      console.log('📤 Firebase path:', `chargingRequests/${user.userId}`)
      
      await update(confirmationRef, {
        status: approved ? 'accepted' : 'denied',  // ✅ Sửa: 'accepted' thay vì 'approved'
        responseTime: Date.now()
      })
      
      console.log('✅ Response sent successfully to Firebase')
      // Clear local confirmation request
      setConfirmationRequest(null)
    } catch (error) {
      console.error('❌ Error responding to confirmation request:', error)
    }
  }, [confirmationRequest, user?.userId])

  const value = {
    stations,
    stationsLoading,
    stationsError,
    chargingHistory,
    historyLoading,
    historyError,
    confirmationRequest, // Thêm dòng này
    respondConfirmation: respondToConfirmationRequest // Thêm dòng này
  };

  return (
    <ChargingContext.Provider value={value}>
      {children}
    </ChargingContext.Provider>
  );

  
};

export const useCharging = () => useContext(ChargingContext);