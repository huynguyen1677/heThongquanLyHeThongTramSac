import { firebase } from './firebase.js';
import { logger } from '../utils/logger.js';

class ConnectorService {
  constructor() {
    this.connectors = new Map(); // Local cache
    this.COLLECTION_NAME = 'connectors';
  }

  /**
   * Initialize persistent 2 connectors for a station
   */
  async initializeConnectors(stationId) {
    try {
      logger.info(`🔌 Initializing connectors for station: ${stationId}`);
      
      // Always create exactly 2 connectors
      const connectors = [
        {
          connectorId: 1,
          stationId,
          status: 'Available',
          lastStatusUpdate: new Date().toISOString(),
          energyDelivered: 0,
          currentTransaction: null,
          createdAt: new Date().toISOString()
        },
        {
          connectorId: 2,
          stationId,
          status: 'Available',
          lastStatusUpdate: new Date().toISOString(),
          energyDelivered: 0,
          currentTransaction: null,
          createdAt: new Date().toISOString()
        }
      ];

      // Store in local cache
      connectors.forEach(connector => {
        const key = `${stationId}_${connector.connectorId}`;
        this.connectors.set(key, connector);
      });

      // Store in Firebase if available
      if (firebase.isInitialized()) {
        await this.saveConnectorsToFirebase(stationId, connectors);
      }

      logger.info(`✅ Initialized 2 persistent connectors for station ${stationId}`);
      return connectors;
    } catch (error) {
      logger.error(`❌ Failed to initialize connectors for ${stationId}:`, error);
      throw error;
    }
  }

  /**
   * Get connectors for a station (from cache or Firebase)
   */
  async getConnectors(stationId) {
    try {
      // Try to get from local cache first
      const cachedConnectors = Array.from(this.connectors.values())
        .filter(c => c.stationId === stationId);

      if (cachedConnectors.length > 0) {
        return cachedConnectors;
      }

      // If not in cache and Firebase is available, try to get from Firebase
      if (firebase.isInitialized()) {
        const firebaseConnectors = await this.getConnectorsFromFirebase(stationId);
        if (firebaseConnectors.length > 0) {
          // Update local cache
          firebaseConnectors.forEach(connector => {
            const key = `${stationId}_${connector.connectorId}`;
            this.connectors.set(key, connector);
          });
          return firebaseConnectors;
        }
      }

      // If no connectors found anywhere, initialize new ones
      return await this.initializeConnectors(stationId);
    } catch (error) {
      logger.error(`❌ Failed to get connectors for ${stationId}:`, error);
      throw error;
    }
  }

  /**
   * Update connector status
   */
  async updateConnectorStatus(stationId, connectorId, status, additionalData = {}) {
    try {
      const key = `${stationId}_${connectorId}`;
      const connector = this.connectors.get(key);

      if (!connector) {
        throw new Error(`Connector ${connectorId} not found for station ${stationId}`);
      }

      // Update connector data
      const updatedConnector = {
        ...connector,
        status,
        lastStatusUpdate: new Date().toISOString(),
        ...additionalData
      };

      // Update local cache
      this.connectors.set(key, updatedConnector);

      // Update Firebase if available
      if (firebase.isInitialized()) {
        await this.updateConnectorInFirebase(stationId, connectorId, updatedConnector);
      }

      logger.info(`🔄 Updated connector ${connectorId} for station ${stationId}: ${status}`);
      return updatedConnector;
    } catch (error) {
      logger.error(`❌ Failed to update connector status:`, error);
      throw error;
    }
  }

  /**
   * Save connectors to Firebase
   */
  async saveConnectorsToFirebase(stationId, connectors) {
    try {
      if (!firebase.isInitialized()) {
        logger.warn('Firebase not initialized - skipping connector save');
        return;
      }

      const firestore = firebase.getFirestore();
      const batch = firestore.batch();

      connectors.forEach(connector => {
        const docRef = firestore
          .collection(this.COLLECTION_NAME)
          .doc(`${stationId}_${connector.connectorId}`);
        batch.set(docRef, connector);
      });

      await batch.commit();
      logger.info(`💾 Saved ${connectors.length} connectors to Firebase for station ${stationId}`);
    } catch (error) {
      logger.error('❌ Failed to save connectors to Firebase:', error);
      throw error;
    }
  }

  /**
   * Get connectors from Firebase
   */
  async getConnectorsFromFirebase(stationId) {
    try {
      if (!firebase.isInitialized()) {
        return [];
      }

      const firestore = firebase.getFirestore();
      const snapshot = await firestore
        .collection(this.COLLECTION_NAME)
        .where('stationId', '==', stationId)
        .get();

      const connectors = [];
      snapshot.forEach(doc => {
        connectors.push({ id: doc.id, ...doc.data() });
      });

      logger.info(`📥 Retrieved ${connectors.length} connectors from Firebase for station ${stationId}`);
      return connectors;
    } catch (error) {
      logger.error('❌ Failed to get connectors from Firebase:', error);
      return [];
    }
  }

  /**
   * Update connector in Firebase
   */
  async updateConnectorInFirebase(stationId, connectorId, connectorData) {
    try {
      if (!firebase.isInitialized()) {
        return;
      }

      const firestore = firebase.getFirestore();
      const docRef = firestore
        .collection(this.COLLECTION_NAME)
        .doc(`${stationId}_${connectorId}`);

      await docRef.set(connectorData, { merge: true });
      logger.debug(`💾 Updated connector in Firebase: ${stationId}_${connectorId}`);
    } catch (error) {
      logger.error('❌ Failed to update connector in Firebase:', error);
      throw error;
    }
  }

  /**
   * Get all connectors for management
   */
  getAllConnectors() {
    return Array.from(this.connectors.values());
  }

  /**
   * Get connector by station and connector ID
   */
  getConnector(stationId, connectorId) {
    const key = `${stationId}_${connectorId}`;
    return this.connectors.get(key);
  }
}

export const connectorService = new ConnectorService();
