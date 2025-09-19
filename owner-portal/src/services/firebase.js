import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

// Lấy cấu hình từ biến môi trường (.env)
const firebaseConfig = {
  apiKey: "AIzaSyDF_nhW4eX8yZIMxJH0CIWBxz5JlrCQaVk",
  authDomain: "hethongquanlytramsacxe.firebaseapp.com",
  databaseURL: "https://hethongquanlytramsacxe-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "hethongquanlytramsacxe",
  storageBucket: "hethongquanlytramsacxe.firebasestorage.app",
  messagingSenderId: "307955847766",
  appId: "1:307955847766:web:280433eaec4ebb51ed21f7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);

// Export auth functions to be used in components
export { signInWithEmailAndPassword, signOut, onAuthStateChanged };