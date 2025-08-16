import { logger } from '../utils/logger.js';
import { getTimestamp } from '../utils/time.js';
import { realtimeService } from '../services/realtime.js';
import { CONNECTOR_STATUS, TRANSACTION_STATUS } from '../domain/constants.js';

class SessionManager {
  constructor() {
    this.stations = new Map(); // stationId -> StationSession
    this.transactions = new Map(); // transactionId -> Transaction
  }

  // Station management
  createStation(stationId, websocket) {
    const station = {
      id: stationId,
      websocket,
      status: 'Online',
      info: {
        vendor: null,
        model: null,
        firmware: null,
        serialNumber: null
      },
      connectors: new Map(), // connectorId -> ConnectorSession
      lastSeen: getTimestamp(),
      bootTime: getTimestamp(),
      heartbeatInterval: 300,
      transactions: new Set() // Set of transaction IDs
    };

    this.stations.set(stationId, station);
    // Ghi trạng thái ban đầu của trạm sạc lên Firebase
    realtimeService.updateStationStatus(stationId, {
      stationId: stationId,
      status: 'Online',
      bootTime: station.bootTime
    });
    logger.info(`Station session created: ${stationId}`);
    
    return station;
  }

  getStation(stationId) {
    return this.stations.get(stationId);
  }

  getAllStations() {
    const stations = [];
    for (const [stationId, station] of this.stations) {
      stations.push({
        stationId: stationId,
        status: station.status,
        info: station.info,
        lastSeen: station.lastSeen,
        bootTime: station.bootTime,
        connectorCount: station.connectors.size,
        activeTransactions: station.transactions.size
      });
    }
    return stations;
  }

  updateStationInfo(stationId, info) {
    const station = this.stations.get(stationId);
    if (station) {
      station.info = { ...station.info, ...info };
      logger.debug(`Station info updated: ${stationId}`, station.info);
      // Cập nhật thông tin trạm sạc (vendor, model) lên Firebase
      realtimeService.updateStationStatus(stationId, {
        info: station.info
      });
    }
  }

  updateLastSeen(stationId) {
    const station = this.stations.get(stationId);
    if (station) {
      station.lastSeen = getTimestamp();
    }
  }

  setStationStatus(stationId, status) {
    const station = this.stations.get(stationId);
    if (station) {
      station.status = status;
      // Cập nhật trạng thái Online/Offline của trạm sạc lên Firebase
      realtimeService.updateStationStatus(stationId, { status: status, lastSeen: getTimestamp() });
      logger.info(`Station ${stationId} status: ${status}`);
      
      // If going offline, mark all connectors as unavailable
      if (status === 'Offline') {
        for (const [connectorId, connector] of station.connectors) {
          this.updateConnectorStatus(stationId, connectorId, { status: CONNECTOR_STATUS.UNAVAILABLE });
        }
      }
    }
  }

  removeStation(stationId) {
    const station = this.stations.get(stationId);
    if (station) {
      // End all active transactions
      for (const transactionId of station.transactions) {
        this.forceStopTransaction(transactionId, 'StationDisconnected');
      }
      
      this.stations.delete(stationId);
      logger.info(`Station session removed: ${stationId}`);
    }
  }

  // Connector management
  getConnector(stationId, connectorId) {
    const station = this.stations.get(stationId);
    if (!station) return null;
    
    return station.connectors.get(connectorId);
  }

  ensureConnector(stationId, connectorId) {
    const station = this.stations.get(stationId);
    if (!station) return null;

    if (!station.connectors.has(connectorId)) {
      const connector = {
        id: connectorId,
        stationId,
        status: CONNECTOR_STATUS.AVAILABLE,
        errorCode: 'NoError',
        lastStatusUpdate: getTimestamp(),
        currentTransaction: null,
        reservationId: null,
        meterValues: []
      };
      
      station.connectors.set(connectorId, connector);
      logger.debug(`Connector created: ${stationId}/${connectorId}`);
    }

    return station.connectors.get(connectorId);
  }

  addConnector(stationId, connectorId, connectorInfo = {}) {
    const station = this.stations.get(stationId);
    if (!station) return null;

    const connector = {
      id: connectorId,
      stationId,
      status: CONNECTOR_STATUS.AVAILABLE,
      errorCode: 'NoError',
      lastStatusUpdate: getTimestamp(),
      currentTransaction: null,
      reservationId: null,
      meterValues: [],
      // Additional connector info
      type: connectorInfo.type || 'Type2',
      maxPower: connectorInfo.maxPower || 22000,
      ...connectorInfo
    };
    
    station.connectors.set(connectorId, connector);
    logger.info(`Connector added: ${stationId}/${connectorId} (${connector.type}, ${connector.maxPower}W)`);
    
    return connector;
  }

  updateConnectorStatus(stationId, connectorId, statusData) {
    const connector = this.ensureConnector(stationId, connectorId);
    if (!connector) return;

    connector.status = statusData.status;
    connector.errorCode = statusData.errorCode || 'NoError';
    connector.lastStatusUpdate = statusData.timestamp || getTimestamp();
    connector.info = statusData.info;

    logger.info(`Connector ${stationId}/${connectorId} status: ${statusData.status}`);
    realtimeService.updateConnectorStatus(stationId, connectorId, { status: statusData.status });
  }

  getStationConnectors(stationId) {
    const station = this.stations.get(stationId);
    if (!station) return [];

    const connectors = [];
    for (const [connectorId, connector] of station.connectors) {
      connectors.push({
        id: connectorId,
        stationId,
        status: connector.status,
        errorCode: connector.errorCode,
        lastStatusUpdate: connector.lastStatusUpdate,
        currentTransaction: connector.currentTransaction,
        reservationId: connector.reservationId
      });
    }
    
    return connectors.sort((a, b) => a.id - b.id);
  }

  // Transaction management
  startTransaction(stationId, connectorId, transactionData) {
    const station = this.stations.get(stationId);
    const connector = this.ensureConnector(stationId, connectorId);
    
    if (!station || !connector) {
      logger.error(`Cannot start transaction: Station or connector not found ${stationId}/${connectorId}`);
      return null;
    }

    // Check if connector is available
    if (connector.currentTransaction) {
      logger.error(`Cannot start transaction: Connector ${stationId}/${connectorId} already has active transaction`);
      return null;
    }

    const transaction = {
      id: transactionData.transactionId,
      stationId,
      connectorId,
      idTag: transactionData.idTag,
      startTime: transactionData.startTime || getTimestamp(),
      meterStart: transactionData.meterStart,
      meterStop: null,
      stopTime: null,
      reason: null,
      status: TRANSACTION_STATUS.ACTIVE,
      reservationId: transactionData.reservationId,
      meterValues: [],
      duration: 0,
      energyConsumed: 0
    };

    // Update state
    this.transactions.set(transaction.id, transaction);
    station.transactions.add(transaction.id);
    connector.currentTransaction = transaction.id;
    connector.status = CONNECTOR_STATUS.CHARGING;

    logger.info(`Transaction started: ${transaction.id} on ${stationId}/${connectorId}`);
    return transaction;
  }

  stopTransaction(stationId, transactionId, stopData) {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      logger.error(`Transaction not found: ${transactionId}`);
      return null;
    }

    const station = this.stations.get(stationId);
    const connector = station?.connectors.get(transaction.connectorId);

    if (!station || !connector) {
      logger.error(`Cannot stop transaction: Station or connector not found`);
      return null;
    }

    // Update transaction
    transaction.meterStop = stopData.meterStop;
    transaction.stopTime = stopData.stopTime || getTimestamp();
    transaction.reason = stopData.reason || 'Local';
    transaction.status = TRANSACTION_STATUS.COMPLETED;
    transaction.energyConsumed = transaction.meterStop - transaction.meterStart;
    
    // Calculate duration
    const startTime = new Date(transaction.startTime);
    const stopTime = new Date(transaction.stopTime);
    transaction.duration = Math.floor((stopTime - startTime) / 1000); // seconds

    // Update state
    station.transactions.delete(transactionId);
    connector.currentTransaction = null;
    connector.status = CONNECTOR_STATUS.AVAILABLE;

    logger.info(`Transaction stopped: ${transactionId} on ${stationId}/${transaction.connectorId}`);
    return transaction;
  }

  forceStopTransaction(transactionId, reason = 'Other') {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) return null;

    return this.stopTransaction(transaction.stationId, transactionId, {
      meterStop: transaction.meterStart, // No energy consumed
      stopTime: getTimestamp(),
      reason
    });
  }

  getTransaction(transactionId) {
    return this.transactions.get(transactionId);
  }

  getActiveTransactions(stationId = null) {
    const activeTransactions = [];
    
    for (const [transactionId, transaction] of this.transactions) {
      if (transaction.status === TRANSACTION_STATUS.ACTIVE) {
        if (!stationId || transaction.stationId === stationId) {
          activeTransactions.push(transaction);
        }
      }
    }
    
    return activeTransactions;
  }

  getAllTransactions(stationId = null, limit = 100) {
    const transactions = [];
    
    for (const [transactionId, transaction] of this.transactions) {
      if (!stationId || transaction.stationId === stationId) {
        transactions.push(transaction);
      }
    }
    
    // Sort by start time (newest first) and limit
    return transactions
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
      .slice(0, limit);
  }

  // Meter values
  addMeterValues(stationId, connectorId, meterValues, transactionId = null) {
    const connector = this.getConnector(stationId, connectorId);
    if (!connector) return;

    // Add to connector
    connector.meterValues.push(...meterValues);
    
    // Keep only last 100 meter values per connector
    if (connector.meterValues.length > 100) {
      connector.meterValues = connector.meterValues.slice(-100);
    }

    // Add to transaction if specified
    if (transactionId) {
      const transaction = this.transactions.get(transactionId);
      if (transaction) {
        transaction.meterValues.push(...meterValues);
        
        // Update energy consumed from latest meter value
        const latestValue = meterValues[meterValues.length - 1];
        if (latestValue && latestValue.sampledValue) {
          const energyValue = latestValue.sampledValue.find(
            sv => sv.measurand === 'Energy.Active.Import.Register'
          );
          if (energyValue) {
            const currentMeter = parseFloat(energyValue.value);
            transaction.energyConsumed = currentMeter - transaction.meterStart;
          }
        }
      }
    }
    realtimeService.updateMeterValues(stationId, connectorId, meterValues, transactionId);

    logger.debug(`Meter values added: ${stationId}/${connectorId}, count: ${meterValues.length}`);
  }

  // Reservations
  setReservation(stationId, connectorId, reservationId, idTag, expiryDate) {
    const connector = this.ensureConnector(stationId, connectorId);
    if (!connector) return false;

    connector.reservationId = reservationId;
    connector.reservationTag = idTag;
    connector.reservationExpiry = expiryDate;
    connector.status = CONNECTOR_STATUS.RESERVED;

    logger.info(`Reservation set: ${stationId}/${connectorId} for ${idTag}`);
    return true;
  }

  cancelReservation(stationId, connectorId) {
    const connector = this.getConnector(stationId, connectorId);
    if (!connector) return false;

    connector.reservationId = null;
    connector.reservationTag = null;
    connector.reservationExpiry = null;
    connector.status = CONNECTOR_STATUS.AVAILABLE;

    logger.info(`Reservation cancelled: ${stationId}/${connectorId}`);
    return true;
  }

  // Statistics
  getStationStats(stationId) {
    const station = this.stations.get(stationId);
    if (!station) return null;

    const transactions = this.getAllTransactions(stationId);
    const activeTransactions = this.getActiveTransactions(stationId);
    
    const totalEnergy = transactions.reduce((sum, tx) => sum + (tx.energyConsumed || 0), 0);
    const totalDuration = transactions.reduce((sum, tx) => sum + (tx.duration || 0), 0);

    return {
      stationId,
      status: station.status,
      lastSeen: station.lastSeen,
      connectorCount: station.connectors.size,
      totalTransactions: transactions.length,
      activeTransactions: activeTransactions.length,
      totalEnergyDelivered: totalEnergy,
      totalChargingTime: totalDuration,
      uptime: Date.now() - new Date(station.bootTime).getTime()
    };
  }

  // System stats
  getSystemStats() {
    const totalStations = this.stations.size;
    const onlineStations = Array.from(this.stations.values()).filter(s => s.status === 'Online').length;
    const totalConnectors = Array.from(this.stations.values()).reduce((sum, s) => sum + s.connectors.size, 0);
    const activeTransactions = this.getActiveTransactions().length;
    const totalTransactions = this.transactions.size;

    return {
      totalStations,
      onlineStations,
      offlineStations: totalStations - onlineStations,
      totalConnectors,
      activeTransactions,
      totalTransactions,
      timestamp: getTimestamp()
    };
  }
}

export const sessions = new SessionManager();
