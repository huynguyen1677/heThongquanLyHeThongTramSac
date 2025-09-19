import { Router } from 'express';
import { firestoreService } from '../services/firestore.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Get charging sessions by user ID
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;
    
    const sessions = await firestoreService.getChargingSessionsByUser(userId, parseInt(limit));
    
    res.json({
      success: true,
      data: sessions,
      total: sessions.length
    });
  } catch (error) {
    logger.error('Error getting user charging sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get charging sessions'
    });
  }
});

// Get charging sessions by station ID
router.get('/station/:stationId', async (req, res) => {
  try {
    const { stationId } = req.params;
    const { limit = 50 } = req.query;
    
    const sessions = await firestoreService.getChargingSessionsByStation(stationId, parseInt(limit));
    
    res.json({
      success: true,
      data: sessions,
      total: sessions.length
    });
  } catch (error) {
    logger.error('Error getting station charging sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get charging sessions'
    });
  }
});

// Get charging sessions by owner ID (for owner portal)
router.get('/owner/:ownerId', async (req, res) => {
  try {
    const { ownerId } = req.params;
    const { limit = 100 } = req.query;
    
    const sessions = await firestoreService.getChargingSessionsByOwner(ownerId, parseInt(limit));
    
    res.json({
      success: true,
      data: sessions,
      total: sessions.length
    });
  } catch (error) {
    logger.error('Error getting owner charging sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get charging sessions'
    });
  }
});

// Get single charging session by ID
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await firestoreService.getChargingSession(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Charging session not found'
      });
    }
    
    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    logger.error('Error getting charging session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get charging session'
    });
  }
});

// Get charging sessions summary for dashboard
router.get('/summary/stats', async (req, res) => {
  try {
    // This would need additional implementation in firestoreService
    // For now, return a placeholder
    res.json({
      success: true,
      data: {
        totalSessions: 0,
        totalEnergyConsumed: 0,
        totalRevenue: 0,
        activeSessions: 0
      }
    });
  } catch (error) {
    logger.error('Error getting charging sessions summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sessions summary'
    });
  }
});

export default router;
