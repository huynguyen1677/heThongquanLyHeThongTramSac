import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase configuration - using the same config as owner-portal
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDF_nhW4eX8yZIMxJH0CIWBxz5JlrCQaVk",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "hethongquanlytramsacxe.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://hethongquanlytramsacxe-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "hethongquanlytramsacxe",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "hethongquanlytramsacxe.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "307955847766",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:307955847766:web:280433eaec4ebb51ed21f7"
};

// Validate required config
const requiredKeys = ['apiKey', 'authDomain', 'projectId'];
const missingKeys = requiredKeys.filter(key => !firebaseConfig[key]);

if (missingKeys.length > 0) {
  console.error('Missing Firebase configuration:', missingKeys);
  throw new Error(`Firebase configuration missing: ${missingKeys.join(', ')}`);
}

console.log('Firebase Config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  apiKeyPresent: !!firebaseConfig.apiKey
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
