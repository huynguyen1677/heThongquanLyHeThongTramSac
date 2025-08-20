import { firestoreService } from './firestore.js';
import { realtimeService } from './realtime.js';
import { logger } from '../utils/logger.js';
import { getTimestamp } from '../utils/time.js';

class SyncService {
  constructor() {
    this.isRunning = false;
    this.syncInterval = null;
    this.syncIntervalTime = 5 * 60 * 1000; // 5 minutes
    this.lastSyncTime = null;
  }

  start() {
    if (this.isRunning) {
      logger.warn('SyncService is already running.');
      return;
    }
    this.isRunning = true;
    logger.info('SyncService started.');
    // Initial sync
    this.syncStationsToFirestore().catch(err => logger.error('Initial sync failed:', err));
    // Periodic sync
    this.syncInterval = setInterval(
      () => this.syncStationsToFirestore().catch(err => logger.error('Periodic sync failed:', err)),
      this.syncIntervalTime
    );
  }

  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.isRunning = false;
    logger.info('SyncService stopped.');
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      lastSync: this.lastSyncTime,
    };
  }

  /**
   * Syncs all stations from RealtimeDB to Firestore.
   * This is for general maintenance and ensuring data consistency.
   */
  async syncStationsToFirestore() {
    if (!firestoreService.isAvailable() || !realtimeService.isAvailable()) {
      logger.warn('Firestore or Realtime DB not available, skipping full sync.');
      return;
    }
    logger.info('🔄 Starting full sync from RealtimeDB to Firestore...');
    const realtimeStations = await realtimeService.getAllStationsLiveData();
    if (!realtimeStations) {
        logger.info('No stations in RealtimeDB to sync.');
        return;
    }

    let syncedCount = 0;
    let skippedCount = 0;

    for (const [stationId, realtimeData] of Object.entries(realtimeStations)) {
        try {
            await this.syncSingleStation(stationId, realtimeData);
            syncedCount++;
        } catch (error) {
            if (error.message.includes('already exists')) {
                skippedCount++;
            } else {
                logger.error({ err: error }, `Error during full sync for station ${stationId}`);
            }
        }
    }
    this.lastSyncTime = new Date().toISOString();
    logger.info(`🎉 Full sync completed. Synced: ${syncedCount}, Skipped: ${skippedCount}`);
  }

  /**
   * Syncs only stations belonging to a specific owner.
   * This is likely triggered from the owner-portal.
   */
  async syncStationsByOwner(ownerId) {
    if (!firestoreService.isAvailable() || !realtimeService.isAvailable()) {
      throw new Error('Firestore or Realtime DB not available');
    }
    logger.info(`🔄 Starting sync for owner: ${ownerId}`);
    const realtimeStations = await realtimeService.getAllStationsLiveData();
    if (!realtimeStations) {
      return { synced: 0, skipped: 0 };
    }

    let syncedCount = 0;
    let skippedCount = 0;

    for (const [stationId, realtimeData] of Object.entries(realtimeStations)) {
      if (realtimeData.ownerId === ownerId) {
        try {
          await this.syncSingleStation(stationId, realtimeData);
          syncedCount++;
        } catch (error) {
          if (error.message.includes('already exists')) {
            skippedCount++;
          } else {
            logger.error({ err: error }, `Error syncing station ${stationId} for owner ${ownerId}`);
          }
        }
      }
    }
    logger.info(`🎉 Sync for owner ${ownerId} completed. Synced: ${syncedCount}, Skipped: ${skippedCount}`);
    return { synced: syncedCount, skipped: skippedCount };
  }

  /**
   * Syncs a single station, typically on first connect.
   * This is called from wsServer.js
   */
  async syncOnStationConnect(stationId, realtimeData) {
    logger.info(`⚡ Station connected, triggering sync for ${stationId}`);
    try {
        await this.syncSingleStation(stationId, realtimeData);
    } catch (error) {
        if (error.message.includes('already exists')) {
            logger.info(` Station ${stationId} already in Firestore, skipping sync on connect.`);
        } else {
            logger.error({ err: error }, `Error syncing station ${stationId} on connect`);
        }
    }
  }

  /**
   * Syncs a single station from RealtimeDB to Firestore if it doesn't exist.
   */
  async syncSingleStation(stationId, realtimeData) {
    const existingStation = await firestoreService.getStation(stationId);
    if (existingStation) {
      throw new Error(`Station ${stationId} already exists in Firestore.`);
    }

    if (!realtimeData.ownerId) {
        logger.warn(`Station ${stationId} has no ownerId, skipping sync.`);
        return;
    }

    const firestoreData = { ...realtimeData };

    // The RealtimeDB SDK might convert an object with numeric keys into a
    // sparse array if the keys don't start from 0 (e.g. { "1": data }).
    // Firestore cannot handle `undefined` values that result from this conversion.
    // To fix this, we convert the `connectors` array (if it is one) back into
    // an object, which Firestore will store as a map. This preserves the
    // original connector IDs.
    if (realtimeData.connectors && Array.isArray(realtimeData.connectors)) {
      const connectorMap = {};
      realtimeData.connectors.forEach((connector, index) => {
        if (connector) { // Filter out sparse (undefined/null) entries
          connectorMap[index] = connector;
        }
      });
      firestoreData.connectors = connectorMap;
    }
    // Ensure basic fields for Firestore document are present
    firestoreData.stationId = stationId;
    firestoreData.createdAt = getTimestamp();
    firestoreData.updatedAt = getTimestamp();

    // The saveStation method in csms/firestore.js uses `stationData.id`
    await firestoreService.saveStation({ id: stationId, ...firestoreData });
    logger.info(`✅ Synced new station ${stationId} to Firestore.`);
  }
}

export const syncService = new SyncService();