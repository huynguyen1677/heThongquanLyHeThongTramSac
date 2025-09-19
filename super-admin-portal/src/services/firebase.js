import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

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

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Realtime Database
export const rtdb = getDatabase(app);

export default app;