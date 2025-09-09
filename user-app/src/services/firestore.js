import { initializeApp, getApps, getApp } from "firebase/app";
import { collection, getDocs, doc, getDoc, query, where } from "firebase/firestore";
import { db } from "./firebase";

// Lấy tất cả trạm sạc
export async function getAllStations() {
  const querySnapshot = await getDocs(collection(db, "stations"));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Lấy thông tin 1 trạm sạc
export async function getStation(stationId) {
  const docRef = doc(db, "stations", stationId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  } else {
    return null;
  }
}

/**
 * Lấy tổng chi tiêu/thanh toán tháng này từ collection payment_history
 * @param {string} userId
 * @returns {Promise<number>}
 */
export async function getMonthlyPaymentTotal(userId) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const q = query(
    collection(db, "payment_history"),
    where("userId", "==", userId),
    where("type", "==", "payment"),
    where("status", "==", "completed"),
    where("createdAt", ">=", monthStart.toISOString()),
    where("createdAt", "<", monthEnd.toISOString())
  );

  const snapshot = await getDocs(q);
  let total = 0;
  snapshot.forEach(doc => {
    const data = doc.data();
    if (typeof data.amount === "number") {
      total += data.amount;
    }
  });
  return total;
}