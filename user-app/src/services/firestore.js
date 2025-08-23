import { initializeApp, getApps, getApp } from "firebase/app";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
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