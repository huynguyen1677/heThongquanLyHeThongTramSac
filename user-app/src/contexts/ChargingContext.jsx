import React, { createContext, useContext } from "react";
import useStations from "./useStations";
import useChargingHistory from "./useChargingHistory";
import { useAuth } from "./AuthContext"; // Thêm dòng này

const ChargingContext = createContext();

export const ChargingProvider = ({ children }) => {
  const { stations, loading: stationsLoading, error: stationsError } = useStations();

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

  const value = {
    stations,
    stationsLoading,
    stationsError,
    chargingHistory,
    historyLoading,
    historyError,
  };

  return (
    <ChargingContext.Provider value={value}>
      {children}
    </ChargingContext.Provider>
  );
};

export const useCharging = () => useContext(ChargingContext);