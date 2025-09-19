import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration, read from .env file
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDF_nhW4eX8yZIMxJH0CIWBxz5JlrCQaVk",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "hethongquanlytramsacxe.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://hethongquanlytramsacxe-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "hethongquanlytramsacxe",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "hethongquanlytramsacxe.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "307955847766",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:307955847766:web:280433eaec4ebb51ed21f7",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
