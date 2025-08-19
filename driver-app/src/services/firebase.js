import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const rtdb = getDatabase(app);

// Connect to emulators in development - TEMPORARILY DISABLED TO USE PRODUCTION DATA
if (false && import.meta.env.DEV) {
  try {
    // Only connect to emulators if not already connected
    if (!auth._delegate._config?.emulator) {
      connectAuthEmulator(auth, 'http://localhost:9099');
    }
    if (!firestore._delegate._settings?.host?.includes('localhost')) {
      connectFirestoreEmulator(firestore, 'localhost', 8080);
    }
    if (!rtdb._delegate._repoInternal?.repoInfo_?.host?.includes('localhost')) {
      connectDatabaseEmulator(rtdb, 'localhost', 9000);
    }
  } catch (error) {
    console.log('Emulator connection error (might already be connected):', error.message);
  }
}

export default app;
