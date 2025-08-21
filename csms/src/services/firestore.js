import { firebase } from './firebase.js';
import { logger } from '../utils/logger.js';
import { getTimestamp } from '../utils/time.js';

class FirestoreService {
  constructor() {
    this.db = null;
  }

  initialize() {
    if (firebase.isInitialized()) {
      this.db = firebase.getFirestore();
      logger.info('Firestore service ready');
    } else {
      logger.warn('Firestore service not available - Firebase not initialized');
    }
  }

  isAvailable() {
    return this.db !== null;
  }

  // Station management
  async saveStation(stationData) {
    if (!this.isAvailable()) return null;

    try {
      const stationRef = this.db.collection('stations').doc(stationData.id);
      const data = {
        ...stationData,
        lastUpdated: getTimestamp()
      };
      
      await stationRef.set(data, { merge: true });
      logger.debug(`Station saved to Firestore: ${stationData.id}`);
      return data;
    } catch (error) {
      // Log the full error object for better debugging
      logger.error({ err: error }, `Error saving station ${stationData.id} to Firestore`);
      throw error; // Re-throw the error so the caller can handle it
    }
  }

  async getStation(stationId) {
    if (!this.isAvailable()) return null;

    try {
      const stationRef = this.db.collection('stations').doc(stationId);
      const doc = await stationRef.get();
      
      if (doc.exists) {
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (error) {
      logger.error('Error getting station from Firestore:', error);
      return null;
    }
  }

  async getAllStations() {
    if (!this.isAvailable()) return [];

    try {
      const snapshot = await this.db.collection('stations').get();
      const stations = [];
      
      snapshot.forEach(doc => {
        stations.push({ id: doc.id, ...doc.data() });
      });
      
      return stations;
    } catch (error) {
      logger.error('Error getting stations from Firestore:', error);
      return [];
    }
  }

  async updateStationStatus(stationId, status) {
    if (!this.isAvailable()) return false;

    try {
      const stationRef = this.db.collection('stations').doc(stationId);
      await stationRef.update({
        status,
        lastStatusUpdate: getTimestamp()
      });
      
      logger.debug(`Station status updated in Firestore: ${stationId} -> ${status}`);
      return true;
    } catch (error) {
      logger.error('Error updating station status in Firestore:', error);
      return false;
    }
  }

  // Transaction management
  async saveTransaction(transactionData) {
    if (!this.isAvailable()) return null;

    try {
      const transactionRef = this.db.collection('transactions').doc(transactionData.id.toString());
      const data = {
        ...transactionData,
        createdAt: getTimestamp(),
        lastUpdated: getTimestamp()
      };
      
      await transactionRef.set(data, { merge: true });
      logger.debug(`Transaction saved to Firestore: ${transactionData.id}`);
      return data;
    } catch (error) {
      logger.error('Error saving transaction to Firestore:', error);
      return null;
    }
  }

  async updateTransaction(transactionId, updateData) {
    if (!this.isAvailable()) return false;

    try {
      const transactionRef = this.db.collection('transactions').doc(transactionId.toString());
      const data = {
        ...updateData,
        lastUpdated: getTimestamp()
      };
      
      await transactionRef.update(data);
      logger.debug(`Transaction updated in Firestore: ${transactionId}`);
      return true;
    } catch (error) {
      logger.error('Error updating transaction in Firestore:', error);
      return false;
    }
  }

  async getTransaction(transactionId) {
    if (!this.isAvailable()) return null;

    try {
      const transactionRef = this.db.collection('transactions').doc(transactionId.toString());
      const doc = await transactionRef.get();
      
      if (doc.exists) {
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (error) {
      logger.error('Error getting transaction from Firestore:', error);
      return null;
    }
  }

  async getTransactions(options = {}) {
    if (!this.isAvailable()) return [];

    try {
      let query = this.db.collection('transactions');
      
      // Apply filters
      if (options.stationId) {
        query = query.where('stationId', '==', options.stationId);
      }
      
      if (options.status) {
        query = query.where('status', '==', options.status);
      }
      
      if (options.startDate) {
        query = query.where('startTime', '>=', options.startDate);
      }
      
      if (options.endDate) {
        query = query.where('startTime', '<=', options.endDate);
      }
      
      // Apply ordering
      query = query.orderBy('startTime', 'desc');
      
      // Apply limit
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      const snapshot = await query.get();
      const transactions = [];
      
      snapshot.forEach(doc => {
        transactions.push({ id: doc.id, ...doc.data() });
      });
      
      return transactions;
    } catch (error) {
      logger.error('Error getting transactions from Firestore:', error);
      return [];
    }
  }

  // Events/Logs
  async saveEvent(eventData) {
    if (!this.isAvailable()) return null;

    try {
      const eventRef = this.db.collection('events').doc();
      const data = {
        ...eventData,
        timestamp: getTimestamp(),
        id: eventRef.id
      };
      
      await eventRef.set(data);
      logger.debug(`Event saved to Firestore: ${eventData.type}`);
      return data;
    } catch (error) {
      logger.error('Error saving event to Firestore:', error);
      return null;
    }
  }

  async getEvents(options = {}) {
    if (!this.isAvailable()) return [];

    try {
      let query = this.db.collection('events');
      
      // Apply filters
      if (options.stationId) {
        query = query.where('stationId', '==', options.stationId);
      }
      
      if (options.type) {
        query = query.where('type', '==', options.type);
      }
      
      if (options.startDate) {
        query = query.where('timestamp', '>=', options.startDate);
      }
      
      if (options.endDate) {
        query = query.where('timestamp', '<=', options.endDate);
      }
      
      // Apply ordering
      query = query.orderBy('timestamp', 'desc');
      
      // Apply limit
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      const snapshot = await query.get();
      const events = [];
      
      snapshot.forEach(doc => {
        events.push({ id: doc.id, ...doc.data() });
      });
      
      return events;
    } catch (error) {
      logger.error('Error getting events from Firestore:', error);
      return [];
    }
  }

  // Meter values
  async saveMeterValues(stationId, connectorId, meterValues, transactionId = null) {
    if (!this.isAvailable()) return null;

    try {
      const batch = this.db.batch();
      const timestamp = getTimestamp();
      
      meterValues.forEach((meterValue, index) => {
        const meterRef = this.db.collection('meterValues').doc();
        const data = {
          stationId,
          connectorId,
          transactionId,
          ...meterValue,
          savedAt: timestamp,
          id: meterRef.id
        };
        
        batch.set(meterRef, data);
      });
      
      await batch.commit();
      logger.debug(`Meter values saved to Firestore: ${stationId}/${connectorId}, count: ${meterValues.length}`);
      return true;
    } catch (error) {
      logger.error('Error saving meter values to Firestore:', error);
      return false;
    }
  }

  // Statistics and reports
  async getStationStatistics(stationId, startDate, endDate) {
    if (!this.isAvailable()) return null;

    try {
      // Get transactions for the period
      const transactions = await this.getTransactions({
        stationId,
        startDate,
        endDate,
        limit: 1000
      });

      // Calculate statistics
      const totalTransactions = transactions.length;
      const completedTransactions = transactions.filter(tx => tx.status === 'Completed');
      const totalEnergy = completedTransactions.reduce((sum, tx) => sum + (tx.energyConsumed || 0), 0);
      const totalDuration = completedTransactions.reduce((sum, tx) => sum + (tx.duration || 0), 0);
      const averageSession = completedTransactions.length > 0 ? totalDuration / completedTransactions.length : 0;

      return {
        stationId,
        period: { startDate, endDate },
        totalTransactions,
        completedTransactions: completedTransactions.length,
        totalEnergyDelivered: totalEnergy,
        totalChargingTime: totalDuration,
        averageSessionDuration: averageSession,
        generatedAt: getTimestamp()
      };
    } catch (error) {
      logger.error('Error getting station statistics from Firestore:', error);
      return null;
    }
  }

  // Configuration
  async getConfiguration(key) {
    if (!this.isAvailable()) return null;

    try {
      const configRef = this.db.collection('configuration').doc(key);
      const doc = await configRef.get();
      
      if (doc.exists) {
        return doc.data();
      }
      return null;
    } catch (error) {
      logger.error('Error getting configuration from Firestore:', error);
      return null;
    }
  }

  async setConfiguration(key, value) {
    if (!this.isAvailable()) return false;

    try {
      const configRef = this.db.collection('configuration').doc(key);
      await configRef.set({
        value,
        lastUpdated: getTimestamp()
      });
      
      logger.debug(`Configuration saved to Firestore: ${key}`);
      return true;
    } catch (error) {
      logger.error('Error saving configuration to Firestore:', error);
      return false;
    }
  }

  // Giá điện (price per kWh) - lưu vào collection 'configuration', document 'pricePerKwh'
  async getPricePerKwh() {
    if (!this.isAvailable()) return null;

    try {
      const configRef = this.db.collection('setting').doc('pricePerKwh');
      const doc = await configRef.get();
      if (doc.exists) {
        return doc.data().value;
      }
      return null;
    } catch (error) {
      logger.error('Error getting pricePerKwh from Firestore:', error);
      return null;
    }
  }

  async setPricePerKwh(newPrice) {
    if (!this.isAvailable()) return false;

    try {
      const configRef = this.db.collection('setting').doc('pricePerKwh');
      await configRef.set({
        value: newPrice,
        lastUpdated: getTimestamp()
      });
      logger.info(`Price per kWh updated in Firestore: ${newPrice}`);
      return true;
    } catch (error) {
      logger.error('Error setting pricePerKwh in Firestore:', error);
      return false;
    }
  }

  listenPricePerKwh(callback) {
    if (!this.isAvailable()) return;
    this.db.collection('setting').doc('pricePerKwh')
      .onSnapshot((doc) => {
        if (doc.exists && typeof callback === 'function') {
          callback(doc.data().value);
        }
      });
  }

  // Transaction Sessions Management
  async saveChargingSession(sessionData) {
    if (!this.isAvailable()) return null;

    try {
      const sessionRef = this.db.collection('chargingSessions').doc(sessionData.id.toString());
      const data = {
        ...sessionData,
        lastUpdated: getTimestamp()
      };
      
      await sessionRef.set(data, { merge: true });
      logger.info(`Charging session saved to Firestore: ${sessionData.id}`);
      return data;
    } catch (error) {
      logger.error(`Error saving charging session ${sessionData.id} to Firestore:`, error);
      throw error;
    }
  }

  async updateChargingSession(sessionId, updateData) {
    if (!this.isAvailable()) return null;

    try {
      const sessionRef = this.db.collection('chargingSessions').doc(sessionId.toString());
      const data = {
        ...updateData,
        lastUpdated: getTimestamp()
      };
      
      await sessionRef.update(data);
      logger.debug(`Charging session updated in Firestore: ${sessionId}`);
      return data;
    } catch (error) {
      logger.error(`Error updating charging session ${sessionId} in Firestore:`, error);
      throw error;
    }
  }

  async getChargingSession(sessionId) {
    if (!this.isAvailable()) return null;

    try {
      const sessionRef = this.db.collection('chargingSessions').doc(sessionId.toString());
      const doc = await sessionRef.get();
      
      if (doc.exists) {
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (error) {
      logger.error(`Error getting charging session ${sessionId} from Firestore:`, error);
      return null;
    }
  }

  async getChargingSessionsByUser(userId, limit = 50) {
    if (!this.isAvailable()) return [];

    try {
      const sessionsRef = this.db.collection('chargingSessions')
        .where('userId', '==', userId)
        .orderBy('startTime', 'desc')
        .limit(limit);
      
      const snapshot = await sessionsRef.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      logger.error(`Error getting charging sessions for user ${userId}:`, error);
      return [];
    }
  }

  async getChargingSessionsByStation(stationId, limit = 50) {
    if (!this.isAvailable()) return [];

    try {
      const sessionsRef = this.db.collection('chargingSessions')
        .where('stationId', '==', stationId)
        .orderBy('startTime', 'desc')
        .limit(limit);
      
      const snapshot = await sessionsRef.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      logger.error(`Error getting charging sessions for station ${stationId}:`, error);
      return [];
    }
  }

  async getChargingSessionsByOwner(ownerId, limit = 100) {
    if (!this.isAvailable()) return [];

    try {
      const sessionsRef = this.db.collection('chargingSessions')
        .where('ownerId', '==', ownerId)
        .orderBy('startTime', 'desc')
        .limit(limit);
      
      const snapshot = await sessionsRef.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      logger.error(`Error getting charging sessions for owner ${ownerId}:`, error);
      return [];
    }
  }

  async addMeterValueToSession(sessionId, meterValue) {
    if (!this.isAvailable()) return null;

    try {
      const sessionRef = this.db.collection('chargingSessions').doc(sessionId.toString());
      
      // Use arrayUnion to add meter value to the array
      await sessionRef.update({
        meterValues: this.db.FieldValue.arrayUnion(meterValue),
        lastUpdated: getTimestamp()
      });
      
      logger.debug(`Meter value added to session ${sessionId}`);
      return true;
    } catch (error) {
      logger.error(`Error adding meter value to session ${sessionId}:`, error);
      return false;
    }
  }
}

export const firestoreService = new FirestoreService();
