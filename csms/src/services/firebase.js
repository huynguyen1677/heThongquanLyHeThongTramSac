import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getDatabase } from 'firebase-admin/database';
import { logger } from '../utils/logger.js';

class FirebaseService {
  constructor() {
    this.app = null;
    this.firestore = null;
    this.database = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      // Get Firebase config from individual environment variables
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      
      if (!projectId || !privateKey || !clientEmail) {
        throw new Error('Firebase credentials not found in environment variables. Required: FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL');
      }
      
      // Create service account object
      const serviceAccount = {
        type: "service_account",
        project_id: projectId,
        private_key: privateKey.replace(/\\n/g, '\n'), // Handle escaped newlines
        client_email: clientEmail
      };

      this.app = initializeApp({
        credential: cert(serviceAccount),
        projectId: projectId,
        // Dán trực tiếp URL từ Firebase Console vào đây để chắc chắn
        databaseURL: "https://hethongquanlytramsacxe-default-rtdb.asia-southeast1.firebasedatabase.app/"
      });

      this.firestore = getFirestore(this.app);
      this.database = getDatabase(this.app);
      this.initialized = true;
      
      logger.info('🔥 Firebase services initialized successfully');
      logger.info(`📊 Project: ${projectId}`);
    } catch (error) {
      logger.warn('⚠️  Firebase initialization failed - continuing without Firebase:');
      logger.warn(`⚠️  Error details: ${error.message}`);
      logger.warn(`⚠️  Error stack: ${error.stack}`);
      // Continue without Firebase for development
      this.initialized = false;
    }
  }

  isInitialized() {
    return this.initialized;
  }

  getFirestore() {
    return this.firestore;
  }

  getDatabase() {
    return this.database;
  }
}

export const firebase = new FirebaseService();
