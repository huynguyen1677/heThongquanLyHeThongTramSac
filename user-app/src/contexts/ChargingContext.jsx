import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ref, onValue, off, update, set } from "firebase/database"; // Thêm set
import useStations from "./useStations";
import useChargingHistory from "./useChargingHistory";
import { useAuth } from "./AuthContext";
import { realtimeDb } from "../services/firebase";

const ChargingContext = createContext();

export const ChargingProvider = ({ children }) => {
  const { stations, loading: stationsLoading, error: stationsError } = useStations();
  const [confirmationRequest, setConfirmationRequest] = useState(null)

  const { user } = useAuth();
  let userId = user?.userId;
  if (!userId) {
    userId = localStorage.getItem("userId") || null;
  }
  if (typeof userId === "number") userId = userId.toString();
  console.log("ChargingProvider userId:", userId, typeof userId);

  const { chargingHistory, loading: historyLoading, error: historyError } = useChargingHistory(userId);

  // Hàm xử lý trừ tiền khi phiên sạc hoàn thành
  const handleSessionComplete = useCallback(async (sessionData) => {
    if (!user?.userId || !sessionData) return;

    try {
      console.log('🏁 Processing payment for completed session:', sessionData);
      
      // Tính chi phí (3000₫/kWh)
      const energyKWh = (sessionData.energyConsumed || 0) / 1000;
      const pricePerKWh = 3000;
      const sessionCost = Math.round(energyKWh * pricePerKWh);
      
      console.log('💰 Session cost:', sessionCost, 'VND');
      
      if (sessionCost <= 0) {
        console.log('❌ Invalid session cost, skipping payment');
        return;
      }
      
      // Lấy số dư hiện tại
      const currentBalance = typeof user.walletBalance === "number"
        ? user.walletBalance
        : parseFloat(user.walletBalance) || 0;
      
      console.log('💰 Current balance:', currentBalance);
      
      if (currentBalance < sessionCost) {
        console.error('❌ Insufficient balance for payment');
        alert(`Số dư không đủ để thanh toán phiên sạc! Cần: ${sessionCost.toLocaleString()}₫`);
        return;
      }
      
      // Tính số dư mới
      const newBalance = currentBalance - sessionCost;
      console.log('💰 New balance:', newBalance);
      
      // Cập nhật số dư trong Firebase Realtime Database
      const userBalanceRef = ref(realtimeDb, `users/${user.userId}/walletBalance`);
      await set(userBalanceRef, newBalance); // Dùng set thay vì update
      
      // Tạo giao dịch thanh toán
      const paymentTransaction = {
        id: Date.now(),
        type: 'payment',
        amount: -sessionCost,
        method: 'Thanh toán sạc',
        status: 'completed',
        date: new Date().toISOString(),
        description: `Thanh toán phiên sạc tại ${sessionData.stationName || sessionData.stationId}`,
        reference: `PAY${String(sessionData.id || Date.now()).slice(-6)}`,
        sessionId: sessionData.id,
        energyConsumed: sessionData.energyConsumed,
        stationId: sessionData.stationId
      };
      
      // Lưu giao dịch vào Firebase - giữ nguyên vì đây là object
      const transactionRef = ref(realtimeDb, `transactions/${user.userId}/${paymentTransaction.id}`);
      await set(transactionRef, paymentTransaction); // Có thể dùng set cho object cũng được
      
      // Đánh dấu phiên đã thanh toán - sửa thành set
      const sessionRef = ref(realtimeDb, `chargingHistory/${user.userId}/${sessionData.id}/paymentProcessed`);
      await set(sessionRef, true); // Dùng set thay vì update
      
      console.log('✅ Payment processed successfully!');
      console.log('💰 Amount charged:', sessionCost);
      console.log('💰 New balance:', newBalance);
      
      alert(`Thanh toán thành công! Đã trừ ${sessionCost.toLocaleString()}₫. Số dư còn lại: ${newBalance.toLocaleString()}₫`);
      
    } catch (error) {
      console.error('❌ Error processing payment:', error);
      alert('Lỗi khi xử lý thanh toán: ' + error.message);
    }
  }, [user]);

  // Hàm kiểm tra số dư ví trước khi hiển thị dialog xác nhận
  const handleSimulatorRequest = useCallback((data) => {
    console.log('🔔 Received confirmation request:', data);
    
    const balance = typeof user?.walletBalance === "number"
      ? user.walletBalance
      : parseFloat(user?.walletBalance) || 0;

    console.log('💰 Current wallet balance:', balance);

    if (balance < 20000) {
      alert('Số dư ví không đủ! Cần tối thiểu 20.000đ để sạc. Vui lòng nạp thêm tiền.');
      console.log('❌ Insufficient balance for charging');
      return;
    }

    console.log('✅ Balance sufficient, showing confirmation dialog');
    setConfirmationRequest(data);
  }, [user?.walletBalance]);

  // Lắng nghe phiên sạc hoàn thành để tự động trừ tiền
  useEffect(() => {
    if (!user?.userId) return;

    console.log('👂 Setting up listener for completed sessions...');
    
    const historyRef = ref(realtimeDb, `chargingHistory/${user.userId}`);
    
    const unsubscribe = onValue(historyRef, (snapshot) => {
      if (snapshot.exists()) {
        const sessions = snapshot.val();
        
        // Kiểm tra từng phiên để tìm phiên hoàn thành chưa thanh toán
        Object.entries(sessions).forEach(([sessionId, sessionData]) => {
          if (sessionData.status === 'completed' && !sessionData.paymentProcessed) {
            console.log('🔍 Found unpaid completed session:', sessionData);
            handleSessionComplete({ ...sessionData, id: sessionId });
          }
        });
      }
    });

    return () => {
      console.log('🔇 Cleaning up session completion listener');
      unsubscribe();
    };
  }, [user?.userId, handleSessionComplete]);

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
          handleSimulatorRequest(data)
        } else {
          setConfirmationRequest(null)
        }
      } else {
        setConfirmationRequest(null)
      }
    })

    console.log(`👂 Listening for confirmation requests at: chargingRequests/${user.userId}`)
    return () => off(confirmationRef, 'value', unsubscribe)
  }, [user?.userId, handleSimulatorRequest])
  
  // Respond to charging confirmation request
  const respondToConfirmationRequest = useCallback(async (approved) => {
    console.log('🔥 respondToConfirmationRequest called with:', approved)
    
    if (!confirmationRequest || !user?.userId) {
      console.log('❌ Missing confirmationRequest or userId')
      return
    }

    try {
      console.log(`📤 Responding to confirmation: ${approved ? 'ACCEPTED' : 'DENIED'}`)
      const confirmationRef = ref(realtimeDb, `chargingRequests/${user.userId}`)
      
      await update(confirmationRef, {
        status: approved ? 'accepted' : 'denied',
        responseTime: Date.now()
      })
      
      console.log('✅ Response sent successfully to Firebase')
      setConfirmationRequest(null)
    } catch (error) {
      console.error('❌ Error responding to confirmation request:', error)
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
    respondConfirmation: respondToConfirmationRequest,
    handleSimulatorRequest,
    handleSessionComplete // Export để có thể test
  };

  return (
    <ChargingContext.Provider value={value}>
      {children}
    </ChargingContext.Provider>
  );
};

export const useCharging = () => useContext(ChargingContext);