import { firebase } from './firebase.js';
import { logger } from '../utils/logger.js';
import { getTimestamp } from '../utils/time.js';

class RealtimeService {
  constructor() {
    this.db = null;
    this.listeners = new Map(); // path -> callback
  }

  initialize() {
    if (firebase.isInitialized()) {
      this.db = firebase.getDatabase();
      logger.info('Realtime Database service ready');
    } else {
      logger.warn('Realtime Database service not available - Firebase not initialized');
    }
  }

  isAvailable() {
    return this.db !== null;
  }

  // Station status updates
  async updateStationStatus(stationId, statusData) {
    if (!this.isAvailable()) return false;

    try {
      const stationRef = this.db.ref(`stations/${stationId}`);
      const data = {
        ...statusData,
        lastUpdate: getTimestamp()
      };
      
      await stationRef.update(data);
      logger.debug(`Station status updated in Realtime DB: ${stationId}`);
      return true;
    } catch (error) {
      logger.error('Error updating station status in Realtime DB:', error);
      return false;
    }
  }

  async updateConnectorStatus(stationId, connectorId, statusData) {
    if (!this.isAvailable()) return false;

    try {
      const connectorRef = this.db.ref(`stations/${stationId}/connectors/${connectorId}`);
      const data = {
        ...statusData,
        lastUpdate: getTimestamp()
      };
      
      await connectorRef.update(data);
      logger.debug(`Connector status updated in Realtime DB: ${stationId}/${connectorId}`);
      return true;
    } catch (error) {
      logger.error('Error updating connector status in Realtime DB:', error);
      return false;
    }
  }

  // Transaction updates
  async updateTransactionStatus(transactionId, statusData) {
    if (!this.isAvailable()) return false;

    try {
      const transactionRef = this.db.ref(`transactions/${transactionId}`);
      const data = {
        ...statusData,
        lastUpdate: getTimestamp()
      };
      
      await transactionRef.update(data);
      logger.debug(`Transaction status updated in Realtime DB: ${transactionId}`);
      return true;
    } catch (error) {
      logger.error('Error updating transaction status in Realtime DB:', error);
      return false;
    }
  }

  // Live meter values
  async updateMeterValues(stationId, connectorId, meterValues, transactionId = null) {
    if (!this.isAvailable()) return false;

    try {
      const path = `meterValues/${stationId}/${connectorId}`;
      const meterRef = this.db.ref(path);
      
      // Keep only the latest meter values (last 10)
      const data = {
        current: meterValues[meterValues.length - 1] || null,
        history: meterValues.slice(-10),
        transactionId,
        lastUpdate: getTimestamp()
      };
      
      await meterRef.set(data);
      logger.debug(`Meter values updated in Realtime DB: ${stationId}/${connectorId}`);
      return true;
    } catch (error) {
      logger.error('Error updating meter values in Realtime DB:', error);
      return false;
    }
  }

  // System statistics
  async updateSystemStats(stats) {
    if (!this.isAvailable()) return false;

    try {
      const statsRef = this.db.ref('systemStats');
      const data = {
        ...stats,
        lastUpdate: getTimestamp()
      };
      
      await statsRef.set(data);
      logger.debug('System stats updated in Realtime DB');
      return true;
    } catch (error) {
      logger.error('Error updating system stats in Realtime DB:', error);
      return false;
    }
  }

  // Real-time events
  async publishEvent(eventType, eventData) {
    if (!this.isAvailable()) return false;

    try {
      const eventsRef = this.db.ref('events');
      const newEventRef = eventsRef.push();
      
      const data = {
        type: eventType,
        ...eventData,
        timestamp: getTimestamp(),
        id: newEventRef.key
      };
      
      await newEventRef.set(data);
      logger.debug(`Event published to Realtime DB: ${eventType}`);
      return true;
    } catch (error) {
      logger.error('Error publishing event to Realtime DB:', error);
      return false;
    }
  }

  // Live notifications
  async sendNotification(type, message, targetStations = null) {
    if (!this.isAvailable()) return false;

    try {
      const notificationRef = this.db.ref('notifications').push();
      
      const data = {
        type,
        message,
        targetStations,
        timestamp: getTimestamp(),
        id: notificationRef.key,
        read: false
      };
      
      await notificationRef.set(data);
      logger.debug(`Notification sent via Realtime DB: ${type}`);
      return true;
    } catch (error) {
      logger.error('Error sending notification via Realtime DB:', error);
      return false;
    }
  }

  // Command queue for remote operations
  async sendCommand(stationId, command, parameters = {}) {
    if (!this.isAvailable()) return false;

    try {
      const commandRef = this.db.ref(`commands/${stationId}`).push();
      
      const data = {
        command,
        parameters,
        timestamp: getTimestamp(),
        id: commandRef.key,
        status: 'pending'
      };
      
      await commandRef.set(data);
      logger.debug(`Command sent to ${stationId}: ${command}`);
      return commandRef.key;
    } catch (error) {
      logger.error('Error sending command via Realtime DB:', error);
      return false;
    }
  }

  async updateCommandStatus(stationId, commandId, status, result = null) {
    if (!this.isAvailable()) return false;

    try {
      const commandRef = this.db.ref(`commands/${stationId}/${commandId}`);
      const updateData = {
        status,
        completedAt: getTimestamp()
      };
      
      if (result) {
        updateData.result = result;
      }
      
      await commandRef.update(updateData);
      logger.debug(`Command status updated: ${stationId}/${commandId} -> ${status}`);
      return true;
    } catch (error) {
      logger.error('Error updating command status in Realtime DB:', error);
      return false;
    }
  }

  // Data listeners
  listenToStationStatus(stationId, callback) {
    if (!this.isAvailable()) return null;

    const path = `stations/${stationId}`;
    const ref = this.db.ref(path);
    
    ref.on('value', (snapshot) => {
      const data = snapshot.val();
      callback(data);
    });
    
    this.listeners.set(path, ref);
    logger.debug(`Listening to station status: ${stationId}`);
    return ref;
  }

  listenToConnectorStatus(stationId, connectorId, callback) {
    if (!this.isAvailable()) return null;

    const path = `stations/${stationId}/connectors/${connectorId}`;
    const ref = this.db.ref(path);
    
    ref.on('value', (snapshot) => {
      const data = snapshot.val();
      callback(data);
    });
    
    this.listeners.set(path, ref);
    logger.debug(`Listening to connector status: ${stationId}/${connectorId}`);
    return ref;
  }

  listenToSystemStats(callback) {
    if (!this.isAvailable()) return null;

    const path = 'systemStats';
    const ref = this.db.ref(path);
    
    ref.on('value', (snapshot) => {
      const data = snapshot.val();
      callback(data);
    });
    
    this.listeners.set(path, ref);
    logger.debug('Listening to system stats');
    return ref;
  }

  listenToEvents(callback, eventType = null) {
    if (!this.isAvailable()) return null;

    let ref;
    if (eventType) {
      ref = this.db.ref('events').orderByChild('type').equalTo(eventType);
    } else {
      ref = this.db.ref('events').orderByChild('timestamp').limitToLast(50);
    }
    
    ref.on('child_added', (snapshot) => {
      const data = snapshot.val();
      callback(data);
    });
    
    const path = `events${eventType ? `_${eventType}` : ''}`;
    this.listeners.set(path, ref);
    logger.debug(`Listening to events${eventType ? ` (${eventType})` : ''}`);
    return ref;
  }

  listenToCommands(stationId, callback) {
    if (!this.isAvailable()) return null;

    const path = `commands/${stationId}`;
    const ref = this.db.ref(path);
    
    ref.on('child_added', (snapshot) => {
      const data = snapshot.val();
      if (data.status === 'pending') {
        callback(data);
      }
    });
    
    this.listeners.set(path, ref);
    logger.debug(`Listening to commands for station: ${stationId}`);
    return ref;
  }

  // Stop listening
  stopListening(path) {
    const ref = this.listeners.get(path);
    if (ref) {
      ref.off();
      this.listeners.delete(path);
      logger.debug(`Stopped listening to: ${path}`);
    }
  }

  stopAllListeners() {
    for (const [path, ref] of this.listeners) {
      ref.off();
    }
    this.listeners.clear();
    logger.info('Stopped all Realtime DB listeners');
  }

  // Data retrieval
  async getStationStatus(stationId) {
    if (!this.isAvailable()) return null;

    try {
      const snapshot = await this.db.ref(`stations/${stationId}`).once('value');
      return snapshot.val();
    } catch (error) {
      logger.error('Error getting station status from Realtime DB:', error);
      return null;
    }
  }

  async getSystemStats() {
    if (!this.isAvailable()) return null;

    try {
      const snapshot = await this.db.ref('systemStats').once('value');
      return snapshot.val();
    } catch (error) {
      logger.error('Error getting system stats from Realtime DB:', error);
      return null;
    }
  }

  // Cleanup expired data
  async cleanupExpiredData() {
    if (!this.isAvailable()) return false;

    try {
      const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 24 hours ago
      
      // Clean up old events
      const eventsRef = this.db.ref('events');
      const oldEvents = await eventsRef.orderByChild('timestamp').endAt(cutoffTime).once('value');
      
      if (oldEvents.exists()) {
        await oldEvents.ref.remove();
        logger.info('Cleaned up expired events from Realtime DB');
      }
      
      // Clean up completed commands older than 1 hour
      const commandsCutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const commandsRef = this.db.ref('commands');
      const stationsSnapshot = await commandsRef.once('value');
      
      if (stationsSnapshot.exists()) {
        const stations = stationsSnapshot.val();
        for (const stationId in stations) {
          const stationCommands = stations[stationId];
          for (const commandId in stationCommands) {
            const command = stationCommands[commandId];
            if (command.status !== 'pending' && command.completedAt && command.completedAt < commandsCutoff) {
              await commandsRef.child(`${stationId}/${commandId}`).remove();
            }
          }
        }
        logger.info('Cleaned up expired commands from Realtime DB');
      }
      
      return true;
    } catch (error) {
      logger.error('Error cleaning up expired data from Realtime DB:', error);
      return false;
    }
  }
}

export const realtimeService = new RealtimeService();
