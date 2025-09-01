import { useState, useEffect, useCallback } from "react";
import { db } from "../services/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function useChargingHistory(userId) {
  const [chargingHistory, setChargingHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUserId, setLastUserId] = useState(null);

  // Hàm fetch thực tế, có thể gọi lại khi cần
  const fetchHistory = useCallback(
    async (force = false) => {
      if (!userId) {
        setChargingHistory([]);
        setLoading(false);
        return;
      }
      // Nếu userId không đổi và đã có dữ liệu, không fetch lại trừ khi force=true
      if (!force && userId === lastUserId && chargingHistory.length > 0) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // userId đã là số, không cần ép kiểu nữa
        console.log("Query Firestore with userId:", userId, "Type:", typeof userId);

        const q = query(
          collection(db, "chargingSessions"),
          where("userId", "==", userId)
        );
        const snapshot = await getDocs(q);

        console.log("Firestore docs found:", snapshot.docs.length);

        const data = snapshot.docs.map((doc) => {
          const docData = doc.data();
          const stationInfo = docData.stationInfo || {};
          return {
            id: doc.id,
            ...docData,
            stationName: stationInfo.stationName || docData.stationId,
            address: stationInfo.address || "",
            latitude: stationInfo.latitude,
            longitude: stationInfo.longitude,
            model: stationInfo.model,
            vendor: stationInfo.vendor,
          };
        });

        console.log("Mapped chargingHistory data:", data);

        setChargingHistory(data);
        setLastUserId(userId);
      } catch (err) {
        console.error("Lỗi khi lấy lịch sử sạc:", err);
        setError("Không thể tải lịch sử sạc");
      } finally {
        setLoading(false);
      }
    },
    [userId, lastUserId, chargingHistory.length]
  );

  // Chỉ fetch khi userId thay đổi hoặc lần đầu
  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line
  }, [userId]);

  // Trả về hàm làm mới để dùng ở component
  return { chargingHistory, loading, error, reloadHistory: () => fetchHistory(true) };
}