/**
 * Demo cách sử dụng Realtime Service trong các API endpoints
 */

import { realtimeService } from '../services/realtime.js';
import { RealtimeHelper } from '../utils/realtimeHelper.js';
import { logger } from '../utils/logger.js';

// API cho Admin Dashboard
export async function getAdminDashboard(req, res) {
  try {
    // Lấy snapshot hiện tại
    const liveData = await RealtimeHelper.getAllLiveDataSnapshot();
    
    if (!liveData) {
      return res.json({
        success: true,
        data: {
          totalStations: 0,
          onlineStations: 0,
          totalConnectors: 0,
          chargingConnectors: 0,
          stations: []
        }
      });
    }

    // Xử lý data để hiển thị dashboard
    const summary = {
      totalStations: 0,
      onlineStations: 0,
      totalConnectors: 0,
      chargingConnectors: 0,
      availableConnectors: 0,
      faultedConnectors: 0,
      totalActiveTransactions: 0,
      totalCurrentPower: 0,
      stations: []
    };

    for (const [stationId, stationData] of Object.entries(liveData)) {
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
            costEstimate: connectorData.costEstimate || 0,
            lastUpdate: connectorData.lastUpdate
          });
        }
      }

      summary.stations.push(stationInfo);
    }

    res.json({
      success: true,
      data: summary
    });

  } catch (error) {
    logger.error('Error in getAdminDashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

// API cho Owner Dashboard
export async function getOwnerDashboard(req, res) {
  try {
    const { ownerId } = req.params;

    const ownerStations = await RealtimeHelper.getOwnerStationsSnapshot(ownerId);
    
    if (!ownerStations) {
      return res.json({
        success: true,
        data: {
          ownerId,
          totalStations: 0,
          onlineStations: 0,
          totalRevenue: 0,
          totalActiveTransactions: 0,
          stations: []
        }
      });
    }

    const ownerSummary = {
      ownerId,
      totalStations: 0,
      onlineStations: 0,
      totalRevenue: 0,
      totalActiveTransactions: 0,
      stations: []
    };

    for (const [stationId, stationData] of Object.entries(ownerStations)) {
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

    res.json({
      success: true,
      data: ownerSummary
    });

  } catch (error) {
    logger.error('Error in getOwnerDashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

// API cho User App - tìm stations available
export async function getAvailableStations(req, res) {
  try {
    const { lat, lng, radius = 5 } = req.query; // GPS coordinates và bán kính

    const liveData = await RealtimeHelper.getAllLiveDataSnapshot();
    
    if (!liveData) {
      return res.json({
        success: true,
        data: []
      });
    }

    const availableStations = [];

    for (const [stationId, stationData] of Object.entries(liveData)) {
      // Chỉ hiển thị station online
      if (!stationData.online) continue;

      const stationInfo = {
        stationId,
        stationName: stationData.stationName || `Station ${stationId}`,
        vendor: stationData.vendor,
        model: stationData.model,
        lastHeartbeat: stationData.lastHeartbeat,
        availableConnectors: 0,
        totalConnectors: 0,
        connectors: []
      };

      if (stationData.connectors) {
        for (const [connectorId, connectorData] of Object.entries(stationData.connectors)) {
          stationInfo.totalConnectors++;
          
          if (connectorData.status === 'Available') {
            stationInfo.availableConnectors++;
          }

          stationInfo.connectors.push({
            connectorId,
            status: connectorData.status,
            available: connectorData.status === 'Available',
            errorCode: connectorData.errorCode
          });
        }
      }

      // Chỉ hiển thị station có ít nhất 1 connector available
      if (stationInfo.availableConnectors > 0) {
        availableStations.push(stationInfo);
      }
    }

    res.json({
      success: true,
      data: availableStations
    });

  } catch (error) {
    logger.error('Error in getAvailableStations:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

// API cho User App - get station detail
export async function getStationDetail(req, res) {
  try {
    const { stationId } = req.params;

    const stationData = await realtimeService.getStationLiveData(stationId);
    
    if (!stationData) {
      return res.status(404).json({
        success: false,
        error: 'Station not found'
      });
    }

    const stationDetail = {
      stationId,
      online: stationData.online,
      stationName: stationData.stationName || `Station ${stationId}`,
      vendor: stationData.vendor,
      model: stationData.model,
      firmwareVersion: stationData.firmwareVersion,
      lastHeartbeat: stationData.lastHeartbeat,
      connectors: []
    };

    if (stationData.connectors) {
      for (const [connectorId, connectorData] of Object.entries(stationData.connectors)) {
        const connectorInfo = {
          connectorId,
          status: connectorData.status,
          errorCode: connectorData.errorCode,
          available: connectorData.status === 'Available',
          charging: connectorData.status === 'Charging',
          faulted: connectorData.status === 'Faulted',
          lastUpdate: connectorData.lastUpdate,
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

        stationDetail.connectors.push(connectorInfo);
      }
    }

    res.json({
      success: true,
      data: stationDetail
    });

  } catch (error) {
    logger.error('Error in getStationDetail:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

// API theo dõi charging session realtime
export async function getChargingSession(req, res) {
  try {
    const { stationId, connectorId } = req.params;

    const connectorData = await realtimeService.getConnectorLiveData(stationId, connectorId);
    
    if (!connectorData || !connectorData.txId) {
      return res.status(404).json({
        success: false,
        error: 'No active charging session found'
      });
    }

    const sessionInfo = {
      stationId,
      connectorId,
      transactionId: connectorData.txId,
      status: connectorData.status,
      energyDelivered: connectorData.kwh || 0,
      totalEnergyWh: connectorData.Wh_total || 0,
      currentPower: connectorData.W_now || 0,
      estimatedCost: connectorData.costEstimate || 0,
      pricePerKwh: realtimeService.getPricePerKwh(),
      lastUpdate: connectorData.lastUpdate,
      isActive: connectorData.status === 'Charging'
    };

    res.json({
      success: true,
      data: sessionInfo
    });

  } catch (error) {
    logger.error('Error in getChargingSession:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

// WebSocket endpoint cho realtime updates
export function setupRealtimeWebSocket(io) {
  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Admin dashboard subscription
    socket.on('subscribe-admin-dashboard', () => {
      logger.info(`Admin dashboard subscription: ${socket.id}`);
      
      const listener = RealtimeHelper.listenForAdminDashboard((summary) => {
        socket.emit('admin-dashboard-update', summary);
      });

      socket.on('disconnect', () => {
        if (listener) {
          realtimeService.stopListening('live/stations');
        }
      });
    });

    // Owner dashboard subscription
    socket.on('subscribe-owner-dashboard', (ownerId) => {
      logger.info(`Owner dashboard subscription: ${socket.id}, owner: ${ownerId}`);
      
      const listener = RealtimeHelper.listenForOwnerDashboard(ownerId, (summary) => {
        socket.emit('owner-dashboard-update', summary);
      });

      socket.on('disconnect', () => {
        if (listener) {
          realtimeService.stopListening(`live/stations_by_owner/${ownerId}`);
        }
      });
    });

    // Station detail subscription
    socket.on('subscribe-station', (stationId) => {
      logger.info(`Station subscription: ${socket.id}, station: ${stationId}`);
      
      const listener = RealtimeHelper.listenToStationForUser(stationId, (stationInfo) => {
        socket.emit('station-update', stationInfo);
      });

      socket.on('disconnect', () => {
        if (listener) {
          realtimeService.stopListening(`live/stations/${stationId}`);
        }
      });
    });

    // Charging session subscription
    socket.on('subscribe-charging-session', ({ stationId, connectorId }) => {
      logger.info(`Charging session subscription: ${socket.id}, ${stationId}/${connectorId}`);
      
      const listener = RealtimeHelper.listenToActiveTransaction(stationId, connectorId, (sessionInfo) => {
        socket.emit('charging-session-update', sessionInfo);
      });

      socket.on('disconnect', () => {
        if (listener) {
          realtimeService.stopListening(`live/stations/${stationId}/connectors/${connectorId}`);
        }
      });
    });

    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });
}
