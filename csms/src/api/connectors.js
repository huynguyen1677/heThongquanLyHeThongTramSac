import express from 'express';
import { connectorService } from '../services/connectorService.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/connectors
 * Get all connectors from all stations
 */
router.get('/', async (req, res) => {
  try {
    const connectors = connectorService.getAllConnectors();
    
    logger.info(`📊 API: Retrieved ${connectors.length} connectors`);
    
    res.json({
      success: true,
      data: connectors,
      count: connectors.length
    });
  } catch (error) {
    logger.error('❌ API Error getting connectors:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/connectors/:stationId
 * Get connectors for a specific station
 */
router.get('/:stationId', async (req, res) => {
  try {
    const { stationId } = req.params;
    const connectors = await connectorService.getConnectors(stationId);
    
    logger.info(`📊 API: Retrieved ${connectors.length} connectors for station ${stationId}`);
    
    res.json({
      success: true,
      data: connectors,
      stationId,
      count: connectors.length
    });
  } catch (error) {
    logger.error(`❌ API Error getting connectors for station ${req.params.stationId}:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/connectors/:stationId/:connectorId/status
 * Update connector status
 */
router.put('/:stationId/:connectorId/status', async (req, res) => {
  try {
    const { stationId, connectorId } = req.params;
    const { status, ...additionalData } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }
    
    const updatedConnector = await connectorService.updateConnectorStatus(
      stationId, 
      parseInt(connectorId), 
      status, 
      additionalData
    );
    
    logger.info(`📊 API: Updated connector ${connectorId} for station ${stationId} to ${status}`);
    
    res.json({
      success: true,
      data: updatedConnector
    });
  } catch (error) {
    logger.error(`❌ API Error updating connector status:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/connectors/:stationId/:connectorId
 * Get a specific connector
 */
router.get('/:stationId/:connectorId', async (req, res) => {
  try {
    const { stationId, connectorId } = req.params;
    const connector = connectorService.getConnector(stationId, parseInt(connectorId));
    
    if (!connector) {
      return res.status(404).json({
        success: false,
        error: `Connector ${connectorId} not found for station ${stationId}`
      });
    }
    
    logger.info(`📊 API: Retrieved connector ${connectorId} for station ${stationId}`);
    
    res.json({
      success: true,
      data: connector
    });
  } catch (error) {
    logger.error(`❌ API Error getting connector:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
