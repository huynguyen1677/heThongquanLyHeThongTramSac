import express from 'express';
import { sessions } from '../ocpp/sessions.js';
import { ocppServer } from '../ocpp/wsServer.js';
// import { firestoreService } from '../services/firestore.js';
// import { realtimeService } from '../services/realtime.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Get all stations
router.get('/', async (req, res) => {
  try {
    const stations = sessions.getAllStations();
    res.json({
      success: true,
      data: stations,
      count: stations.length
    });
  } catch (error) {
    logger.error('Error getting stations:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get station by ID
router.get('/:stationId', async (req, res) => {
  try {
    const { stationId } = req.params;
    const station = sessions.getStation(stationId);
    
    if (!station) {
      return res.status(404).json({
        success: false,
        error: 'Station not found'
      });
    }

    // Get connectors
    const connectors = sessions.getStationConnectors(stationId);
    
    // Get active transactions
    const activeTransactions = sessions.getActiveTransactions(stationId);
    
    // Get station stats
    const stats = sessions.getStationStats(stationId);

    res.json({
      success: true,
      data: {
        station: {
          id: station.id,
          status: station.status,
          info: station.info,
          lastSeen: station.lastSeen,
          bootTime: station.bootTime,
          heartbeatInterval: station.heartbeatInterval
        },
        connectors,
        activeTransactions,
        stats
      }
    });
  } catch (error) {
    logger.error('Error getting station:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get station connectors
router.get('/:stationId/connectors', async (req, res) => {
  try {
    const { stationId } = req.params;
    const connectors = sessions.getStationConnectors(stationId);
    
    res.json({
      success: true,
      data: connectors,
      count: connectors.length
    });
  } catch (error) {
    logger.error('Error getting station connectors:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get specific connector
router.get('/:stationId/connectors/:connectorId', async (req, res) => {
  try {
    const { stationId, connectorId } = req.params;
    const connector = sessions.getConnector(stationId, parseInt(connectorId));
    
    if (!connector) {
      return res.status(404).json({
        success: false,
        error: 'Connector not found'
      });
    }

    res.json({
      success: true,
      data: connector
    });
  } catch (error) {
    logger.error('Error getting connector:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get station transactions
router.get('/:stationId/transactions', async (req, res) => {
  try {
    const { stationId } = req.params;
    const { limit = 50, status } = req.query;
    
    let transactions;
    if (status === 'active') {
      transactions = sessions.getActiveTransactions(stationId);
    } else {
      transactions = sessions.getAllTransactions(stationId, parseInt(limit));
      if (status && status !== 'all') {
        transactions = transactions.filter(tx => tx.status === status);
      }
    }
    
    res.json({
      success: true,
      data: transactions,
      count: transactions.length
    });
  } catch (error) {
    logger.error('Error getting station transactions:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Station statistics
router.get('/:stationId/stats', async (req, res) => {
  try {
    const { stationId } = req.params;
    const stats = sessions.getStationStats(stationId);
    
    if (!stats) {
      return res.status(404).json({
        success: false,
        error: 'Station not found'
      });
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error getting station stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Remote start transaction
router.post('/:stationId/start', async (req, res) => {
  try {
    const { stationId } = req.params;
    const { idTag, connectorId } = req.body;
    
    if (!idTag) {
      return res.status(400).json({
        success: false,
        error: 'idTag is required'
      });
    }

    if (!ocppServer.isStationConnected(stationId)) {
      return res.status(404).json({
        success: false,
        error: 'Station not connected'
      });
    }

    const messageId = ocppServer.sendRemoteStartTransaction(stationId, idTag, connectorId);
    
    res.json({
      success: true,
      data: {
        messageId,
        message: 'Remote start command sent'
      }
    });
  } catch (error) {
    logger.error('Error sending remote start:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Remote stop transaction
router.post('/:stationId/stop', async (req, res) => {
  try {
    const { stationId } = req.params;
    const { transactionId } = req.body;
    
    if (!transactionId) {
      return res.status(400).json({
        success: false,
        error: 'transactionId is required'
      });
    }

    if (!ocppServer.isStationConnected(stationId)) {
      return res.status(404).json({
        success: false,
        error: 'Station not connected'
      });
    }

    const messageId = ocppServer.sendRemoteStopTransaction(stationId, transactionId);
    
    res.json({
      success: true,
      data: {
        messageId,
        message: 'Remote stop command sent'
      }
    });
  } catch (error) {
    logger.error('Error sending remote stop:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Change availability
router.post('/:stationId/availability', async (req, res) => {
  try {
    const { stationId } = req.params;
    const { connectorId, type } = req.body;
    
    if (connectorId === undefined || !type) {
      return res.status(400).json({
        success: false,
        error: 'connectorId and type are required'
      });
    }

    if (!['Inoperative', 'Operative'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'type must be Inoperative or Operative'
      });
    }

    if (!ocppServer.isStationConnected(stationId)) {
      return res.status(404).json({
        success: false,
        error: 'Station not connected'
      });
    }

    const messageId = ocppServer.sendChangeAvailability(stationId, parseInt(connectorId), type);
    
    res.json({
      success: true,
      data: {
        messageId,
        message: 'Change availability command sent'
      }
    });
  } catch (error) {
    logger.error('Error sending change availability:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Reset station
router.post('/:stationId/reset', async (req, res) => {
  try {
    const { stationId } = req.params;
    const { type = 'Soft' } = req.body;
    
    if (!['Hard', 'Soft'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'type must be Hard or Soft'
      });
    }

    if (!ocppServer.isStationConnected(stationId)) {
      return res.status(404).json({
        success: false,
        error: 'Station not connected'
      });
    }

    const messageId = ocppServer.sendReset(stationId, type);
    
    res.json({
      success: true,
      data: {
        messageId,
        message: 'Reset command sent'
      }
    });
  } catch (error) {
    logger.error('Error sending reset:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Unlock connector
router.post('/:stationId/unlock', async (req, res) => {
  try {
    const { stationId } = req.params;
    const { connectorId } = req.body;
    
    if (connectorId === undefined) {
      return res.status(400).json({
        success: false,
        error: 'connectorId is required'
      });
    }

    if (!ocppServer.isStationConnected(stationId)) {
      return res.status(404).json({
        success: false,
        error: 'Station not connected'
      });
    }

    const messageId = ocppServer.sendUnlockConnector(stationId, parseInt(connectorId));
    
    res.json({
      success: true,
      data: {
        messageId,
        message: 'Unlock connector command sent'
      }
    });
  } catch (error) {
    logger.error('Error sending unlock connector:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update station info
router.patch('/:stationId', async (req, res) => {
  try {
    const { stationId } = req.params;
    const updateData = req.body;
    
    const station = sessions.getStation(stationId);
    if (!station) {
      return res.status(404).json({
        success: false,
        error: 'Station not found'
      });
    }

    sessions.updateStationInfo(stationId, updateData);
    
    // Save to Firestore if available
    /*
    if (firestoreService.isAvailable()) {
      await firestoreService.saveStation({
        id: stationId,
        ...updateData
      });
    }
    */

    res.json({
      success: true,
      data: {
        message: 'Station updated successfully'
      }
    });
  } catch (error) {
    logger.error('Error updating station:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete station (remove from session)
router.delete('/:stationId', async (req, res) => {
  try {
    const { stationId } = req.params;
    
    const station = sessions.getStation(stationId);
    if (!station) {
      return res.status(404).json({
        success: false,
        error: 'Station not found'
      });
    }

    sessions.removeStation(stationId);
    
    res.json({
      success: true,
      data: {
        message: 'Station removed successfully'
      }
    });
  } catch (error) {
    logger.error('Error removing station:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
