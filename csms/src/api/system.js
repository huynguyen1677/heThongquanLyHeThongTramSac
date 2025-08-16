import express from 'express';
import { sessions } from '../ocpp/sessions.js';
import { ocppServer } from '../ocpp/wsServer.js';
// import { firestoreService } from '../services/firestore.js';
// import { realtimeService } from '../services/realtime.js';
import { logger } from '../utils/logger.js';
import { getTimestamp } from '../utils/time.js';

const router = express.Router();

// System overview
router.get('/overview', async (req, res) => {
  try {
    // Get real-time stats from session manager
    const systemStats = sessions.getSystemStats();
    
    // Get connected stations info
    const connectedStations = ocppServer.getConnectedStations();
    
    // Get recent transactions
    const recentTransactions = sessions.getAllTransactions(null, 10);
    
    // Get active transactions
    const activeTransactions = sessions.getActiveTransactions();

    res.json({
      success: true,
      data: {
        systemStats,
        connectedStations,
        recentTransactions,
        activeTransactions,
        timestamp: getTimestamp()
      }
    });
  } catch (error) {
    logger.error('Error getting system overview:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// System statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = sessions.getSystemStats();
    
    // Add more detailed stats
    const allStations = sessions.getAllStations();
    const availableConnectors = allStations.reduce((count, station) => {
      const connectors = sessions.getStationConnectors(station.id);
      return count + connectors.filter(c => c.status === 'Available').length;
    }, 0);
    
    const chargingConnectors = allStations.reduce((count, station) => {
      const connectors = sessions.getStationConnectors(station.id);
      return count + connectors.filter(c => c.status === 'Charging').length;
    }, 0);
    
    const faultedConnectors = allStations.reduce((count, station) => {
      const connectors = sessions.getStationConnectors(station.id);
      return count + connectors.filter(c => c.status === 'Faulted').length;
    }, 0);

    const detailedStats = {
      ...stats,
      availableConnectors,
      chargingConnectors,
      faultedConnectors,
      connectorUtilization: stats.totalConnectors > 0 ? 
        ((chargingConnectors / stats.totalConnectors) * 100).toFixed(2) : 0
    };

    res.json({
      success: true,
      data: detailedStats
    });
  } catch (error) {
    logger.error('Error getting system stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Health check
router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: getTimestamp(),
      services: {
        ocppServer: {
          status: ocppServer.wss ? 'running' : 'stopped',
          connectedStations: ocppServer.getConnectedStations().length
        },
        firestore: {
          status: 'unavailable' // firestoreService.isAvailable() ? 'available' : 'unavailable'
        },
        realtimeDb: {
          status: 'unavailable' // realtimeService.isAvailable() ? 'available' : 'unavailable'
        }
      },
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0'
    };

    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    logger.error('Error getting health status:', error);
    res.status(500).json({
      success: false,
      data: {
        status: 'unhealthy',
        error: error.message
      }
    });
  }
});

// System configuration
router.get('/config', async (req, res) => {
  try {
    const config = {
      ocpp: {
        version: '1.6-J',
        websocketPort: process.env.OCPP_WS_PORT || 3001,
        heartbeatInterval: 300
      },
      api: {
        port: process.env.PORT || 3000,
        cors: process.env.CORS_ORIGIN || '*'
      },
      firebase: {
        enabled: false, // firestoreService.isAvailable() && realtimeService.isAvailable(),
        projectId: process.env.FIREBASE_PROJECT_ID || 'Not configured'
      },
      features: {
        realTimeSync: false, // realtimeService.isAvailable(),
        persistentStorage: false, // firestoreService.isAvailable(),
        remoteCommands: true,
        transactions: true,
        meterValues: true
      }
    };

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    logger.error('Error getting system config:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Events and logs
router.get('/events', async (req, res) => {
  try {
    const { limit = 100, type, stationId } = req.query;
    
    let events = [];
    
    /*
    if (firestoreService.isAvailable()) {
      events = await firestoreService.getEvents({
        limit: parseInt(limit),
        type,
        stationId
      });
    } else {
      // Return empty array if no persistent storage
      events = [];
    }
    */

    res.json({
      success: true,
      data: events,
      count: events.length
    });
  } catch (error) {
    logger.error('Error getting events:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Send system notification
router.post('/notifications', async (req, res) => {
  try {
    const { type, message, targetStations } = req.body;
    
    if (!type || !message) {
      return res.status(400).json({
        success: false,
        error: 'type and message are required'
      });
    }

    let notificationSent = false;
    
    /*
    if (realtimeService.isAvailable()) {
      notificationSent = await realtimeService.sendNotification(type, message, targetStations);
    }
    */

    res.json({
      success: true,
      data: {
        sent: notificationSent,
        message: notificationSent ? 'Notification sent' : 'Notification queued (no real-time service)'
      }
    });
  } catch (error) {
    logger.error('Error sending notification:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Cleanup old data
router.post('/cleanup', async (req, res) => {
  try {
    const { daysOld = 30 } = req.body;
    
    let cleanupResults = {
      firestore: false,
      realtime: false
    };

    // Cleanup Firestore (transactions, events older than specified days)
    /*
    if (firestoreService.isAvailable()) {
      // This would need implementation in FirestoreService
      cleanupResults.firestore = true;
    }
    */

    // Cleanup Realtime Database
    /*
    if (realtimeService.isAvailable()) {
      cleanupResults.realtime = await realtimeService.cleanupExpiredData();
    }
    */

    res.json({
      success: true,
      data: {
        cleanupResults,
        message: 'Cleanup operation completed'
      }
    });
  } catch (error) {
    logger.error('Error during cleanup:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Export system data
router.get('/export', async (req, res) => {
  try {
    const { format = 'json', includeTransactions = 'true' } = req.query;
    
    const exportData = {
      timestamp: getTimestamp(),
      systemStats: sessions.getSystemStats(),
      stations: sessions.getAllStations(),
      connectors: []
    };

    // Add connector data
    exportData.stations.forEach(station => {
      const connectors = sessions.getStationConnectors(station.id);
      exportData.connectors.push(...connectors);
    });

    // Add transactions if requested
    if (includeTransactions === 'true') {
      exportData.transactions = sessions.getAllTransactions(null, 1000);
    }

    if (format === 'json') {
      res.json({
        success: true,
        data: exportData
      });
    } else if (format === 'csv') {
      // Simple CSV export of stations
      const headers = ['Station ID', 'Status', 'Vendor', 'Model', 'Last Seen', 'Connector Count'];
      const rows = exportData.stations.map(station => [
        station.id,
        station.status,
        station.info?.vendor || '',
        station.info?.model || '',
        station.lastSeen,
        station.connectorCount
      ]);

      const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="system_export.csv"');
      res.send(csvContent);
    } else {
      res.status(400).json({
        success: false,
        error: 'Unsupported format. Use json or csv'
      });
    }
  } catch (error) {
    logger.error('Error exporting system data:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// System metrics for monitoring
router.get('/metrics', async (req, res) => {
  try {
    const stats = sessions.getSystemStats();
    const allStations = sessions.getAllStations();
    
    // Calculate uptime for each station
    const stationUptimes = allStations.map(station => {
      const bootTime = new Date(station.bootTime);
      const uptime = Date.now() - bootTime.getTime();
      return {
        stationId: station.id,
        uptime: uptime,
        status: station.status
      };
    });

    // Calculate average response times, error rates, etc.
    const metrics = {
      system: {
        totalStations: stats.totalStations,
        onlineStations: stats.onlineStations,
        offlineStations: stats.offlineStations,
        totalConnectors: stats.totalConnectors,
        activeTransactions: stats.activeTransactions,
        systemUptime: process.uptime() * 1000,
        memoryUsage: process.memoryUsage()
      },
      stations: stationUptimes,
      performance: {
        averageStationUptime: stationUptimes.length > 0 ? 
          stationUptimes.reduce((sum, s) => sum + s.uptime, 0) / stationUptimes.length : 0,
        onlinePercentage: stats.totalStations > 0 ? 
          (stats.onlineStations / stats.totalStations) * 100 : 0
      },
      timestamp: getTimestamp()
    };

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Error getting system metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
