import { realtimeService } from '../services/realtime.js';
import { logger } from './logger.js';

/**
 * Helper functions để sử dụng Realtime Service theo cấu trúc mới
 * Cấu trúc Firebase Realtime Database:
 * 
 * /live/
 *   stations/
 *     {stationId}/
 *       online: boolean
 *       lastHeartbeat: number (epoch millis)
 *       ownerId: string
 *       stationName: string
 *       vendor: string
 *       model: string
 *       firmwareVersion: string
 *       connectors/
 *         {connectorId}/
 *           status: "Available"|"Preparing"|"Charging"|"Finishing"|"Unavailable"|"Faulted"
 *           errorCode: string
 *           txId: number|null
 *           Wh_total: number (tổng Wh lũy kế)
 *           W_now: number (công suất hiện tại W)
 *           lastUpdate: number (epoch millis)
 *           kwh: number (Wh_total quy đổi kWh cho UI)
 *           costEstimate: number (kwh * price, cho UI)
 */

export class RealtimeHelper {
  
  /**
   * Demo: Theo dõi tất cả stations cho Admin
   */
  static listenForAdminDashboard(callback) {
    return realtimeService.listenToAllStationsLiveData((allStationsData) => {
      if (!allStationsData) return;

      const summary = {
        totalStations: 0,
        onlineStations: 0,
        totalConnectors: 0,
        chargingConnectors: 0,
        availableConnectors: 0,
        faultedConnectors: 0,
        totalActiveTransactions: 0,
        totalCurrentPower: 0, // tổng công suất hiện tại của tất cả trạm
        stations: []
      };

      for (const [stationId, stationData] of Object.entries(allStationsData)) {
        summary.totalStations++;
        if (stationData.online) summary.onlineStations++;

        const stationInfo = {
          stationId,
          online: stationData.online,
          lastHeartbeat: stationData.lastHeartbeat,
          ownerId: stationData.ownerId,
          stationName: stationData.stationName || `Station ${stationId}`,
          vendor: stationData.vendor,
          model: stationData.model,
          connectors: []
        };

        if (stationData.connectors) {
          for (const [connectorId, connectorData] of Object.entries(stationData.connectors)) {
            summary.totalConnectors++;
            
            switch (connectorData.status) {
              case 'Charging':
                summary.chargingConnectors++;
                if (connectorData.txId) summary.totalActiveTransactions++;
                break;
              case 'Available':
                summary.availableConnectors++;
                break;
              case 'Faulted':
                summary.faultedConnectors++;
                break;
            }

            if (connectorData.W_now) {
              summary.totalCurrentPower += connectorData.W_now;
            }

            stationInfo.connectors.push({
              connectorId,
              status: connectorData.status,
              errorCode: connectorData.errorCode,
              txId: connectorData.txId,
              kwh: connectorData.kwh || 0,
              currentPower: connectorData.W_now || 0,
              costEstimate: connectorData.costEstimate || 0
            });
          }
        }

        summary.stations.push(stationInfo);
      }

      callback(summary);
    });
  }

  /**
   * Demo: Theo dõi stations của một Owner cụ thể
   */
  static listenForOwnerDashboard(ownerId, callback) {
    return realtimeService.listenToOwnerStations(ownerId, (ownerStationsData) => {
      if (!ownerStationsData) return;

      const ownerSummary = {
        ownerId,
        totalStations: 0,
        onlineStations: 0,
        totalRevenue: 0, // tổng doanh thu từ các session đang chạy
        totalActiveTransactions: 0,
        stations: []
      };

      for (const [stationId, stationData] of Object.entries(ownerStationsData)) {
        ownerSummary.totalStations++;
        if (stationData.online) ownerSummary.onlineStations++;

        const stationInfo = {
          stationId,
          online: stationData.online,
          stationName: stationData.stationName || `Station ${stationId}`,
          vendor: stationData.vendor,
          model: stationData.model,
          connectors: []
        };

        if (stationData.connectors) {
          for (const [connectorId, connectorData] of Object.entries(stationData.connectors)) {
            if (connectorData.txId) {
              ownerSummary.totalActiveTransactions++;
              ownerSummary.totalRevenue += connectorData.costEstimate || 0;
            }

            stationInfo.connectors.push({
              connectorId,
              status: connectorData.status,
              txId: connectorData.txId,
              kwh: connectorData.kwh || 0,
              currentPower: connectorData.W_now || 0,
              costEstimate: connectorData.costEstimate || 0,
              lastUpdate: connectorData.lastUpdate
            });
          }
        }

        ownerSummary.stations.push(stationInfo);
      }

      callback(ownerSummary);
    });
  }

  /**
   * Demo: Theo dõi một station cụ thể cho User app
   */
  static listenToStationForUser(stationId, callback) {
    return realtimeService.listenToStationLiveData(stationId, (stationData) => {
      if (!stationData) return;

      const userView = {
        stationId,
        online: stationData.online,
        stationName: stationData.stationName || `Station ${stationId}`,
        vendor: stationData.vendor,
        model: stationData.model,
        lastHeartbeat: stationData.lastHeartbeat,
        connectors: []
      };

      if (stationData.connectors) {
        for (const [connectorId, connectorData] of Object.entries(stationData.connectors)) {
          // Chỉ hiển thị connector Available hoặc đang có transaction của user
          const connectorInfo = {
            connectorId,
            status: connectorData.status,
            available: connectorData.status === 'Available',
            charging: connectorData.status === 'Charging',
            faulted: connectorData.status === 'Faulted',
            currentSession: null
          };

          // Nếu đang có transaction, hiển thị thông tin session
          if (connectorData.txId && connectorData.status === 'Charging') {
            connectorInfo.currentSession = {
              transactionId: connectorData.txId,
              energyDelivered: connectorData.kwh || 0,
              currentPower: connectorData.W_now || 0,
              estimatedCost: connectorData.costEstimate || 0,
              lastUpdate: connectorData.lastUpdate
            };
          }

          userView.connectors.push(connectorInfo);
        }
      }

      callback(userView);
    });
  }

  /**
   * Demo: Theo dõi một connector cụ thể trong transaction
   */
  static listenToActiveTransaction(stationId, connectorId, callback) {
    return realtimeService.listenToConnectorLiveData(stationId, connectorId, (connectorData) => {
      if (!connectorData || !connectorData.txId) return;

      const transactionView = {
        stationId,
        connectorId,
        transactionId: connectorData.txId,
        status: connectorData.status,
        energyDelivered: connectorData.kwh || 0,
        currentPower: connectorData.W_now || 0,
        estimatedCost: connectorData.costEstimate || 0,
        lastUpdate: connectorData.lastUpdate,
        isActive: connectorData.status === 'Charging'
      };

      callback(transactionView);
    });
  }

  /**
   * Utility: Get snapshot of all live data
   */
  static async getAllLiveDataSnapshot() {
    try {
      const allData = await realtimeService.getAllStationsLiveData();
      return allData;
    } catch (error) {
      logger.error('Error getting live data snapshot:', error);
      return null;
    }
  }

  /**
   * Utility: Get stations for specific owner
   */
  static async getOwnerStationsSnapshot(ownerId) {
    try {
      const allData = await realtimeService.getAllStationsLiveData();
      if (!allData) return null;

      const ownerStations = {};
      for (const [stationId, stationData] of Object.entries(allData)) {
        if (stationData.ownerId === ownerId) {
          ownerStations[stationId] = stationData;
        }
      }
      return ownerStations;
    } catch (error) {
      logger.error('Error getting owner stations snapshot:', error);
      return null;
    }
  }

  /**
   * Utility: Check if station is online and has available connectors
   */
  static async checkStationAvailability(stationId) {
    try {
      const stationData = await realtimeService.getStationLiveData(stationId);
      if (!stationData || !stationData.online) {
        return { available: false, reason: 'Station offline' };
      }

      if (!stationData.connectors) {
        return { available: false, reason: 'No connectors' };
      }

      const availableConnectors = [];
      for (const [connectorId, connectorData] of Object.entries(stationData.connectors)) {
        if (connectorData.status === 'Available') {
          availableConnectors.push(connectorId);
        }
      }

      return {
        available: availableConnectors.length > 0,
        availableConnectors,
        totalConnectors: Object.keys(stationData.connectors).length
      };
    } catch (error) {
      logger.error('Error checking station availability:', error);
      return { available: false, reason: 'Error checking availability' };
    }
  }
}

export default RealtimeHelper;
