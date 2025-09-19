import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { logger } from './utils/logger.js';
import { firebase } from './services/firebase.js';
import { firestoreService } from './services/firestore.js';
import { realtimeService } from './services/realtime.js';
import { syncService } from './services/syncService.js';
import { ocppServer } from './ocpp/wsServer.js';

// Import API routes 
import stationsRouter from './api/stations.js';
import transactionsRouter from './api/transactions.js';
import systemRouter from './api/system.js';
import connectorsRouter from './api/connectors.js';
import settingsRouter from './api/settings.js';
import chargingSessionsRouter from './api/chargingSessions.js';

class CSMSServer {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.ocppPort = process.env.OCPP_WS_PORT || 3001;
  }

  async initialize() {
    try {
      // Initialize Firebase services
      logger.info('Initializing CSMS services...');
      
      try {
        await firebase.initialize();
        
        if (firebase.isInitialized()) {
          firestoreService.initialize();
          realtimeService.initialize();
          
          // Khởi động sync service sau khi Firebase đã sẵn sàng
          setTimeout(() => {
            syncService.start();
            logger.info('🔄 Auto sync service started');
          }, 2000); // Đợi 2 giây để Firebase ổn định
          
          logger.info('🔥 Firebase services initialized successfully');
        } else {
          logger.warn('⚠️  Firebase services not available - running in standalone mode');
        }
      } catch (firebaseError) {
        logger.warn('⚠️  Firebase initialization failed - running in standalone mode:', firebaseError.message);
      }

      // Setup Express middleware
      this.setupMiddleware();
      
      // Setup API routes
      this.setupRoutes();
      
      // Setup error handling
      this.setupErrorHandling();
      
      logger.info('CSMS server initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize CSMS server:', error.message, error.stack);
      throw error;
    }
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: false, // Disable for API server
      crossOriginEmbedderPolicy: false
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Limit each IP
      message: {
        success: false,
        error: 'Too many requests from this IP, please try again later'
      },
      standardHeaders: true,
      legacyHeaders: false
    });
    this.app.use('/api/', limiter);

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use((req, res, next) => {
      logger.debug(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        query: req.query
      });
      next();
    });
  }

  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0'
      });
    });

    // API routes
    this.app.use('/api/stations', stationsRouter);
    this.app.use('/api/transactions', transactionsRouter);
    this.app.use('/api/system', systemRouter);
    this.app.use('/api/connectors', connectorsRouter);
    this.app.use('/api/settings', settingsRouter);
    this.app.use('/api/charging-sessions', chargingSessionsRouter);

    // Sync endpoint
    this.app.post('/api/sync/stations', async (req, res) => {
      try {
        const { ownerId } = req.body;
        
        if (ownerId) {
          // Sync stations cho owner cụ thể
          const result = await syncService.syncStationsByOwner(ownerId);
          res.json({
            success: true,
            message: `Sync completed for owner: ${ownerId}`,
            result
          });
        } else {
          // Sync tất cả stations
          await syncService.syncStationsToFirestore();
          res.json({
            success: true,
            message: 'Full sync completed'
          });
        }
      } catch (error) {
        logger.error('Sync API error:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Sync status endpoint
    this.app.get('/api/sync/status', (req, res) => {
      const status = syncService.getStatus();
      res.json({
        success: true,
        status
      });
    });

    // Root endpoint with API info
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        message: 'OCPP 1.6-J Central System Management Server (CSMS)',
        version: process.env.npm_package_version || '1.0.0',
        endpoints: {
          health: '/health',
          stations: '/api/stations',
          transactions: '/api/transactions',
          system: '/api/system',
          connectors: '/api/connectors'
        },
        ocpp: {
          version: '1.6-J',
          websocketUrl: `ws://localhost:${this.ocppPort}/ocpp/{stationId}`,
          port: this.ocppPort
        },
        documentation: 'https://github.com/your-repo/csms-api-docs',
        timestamp: new Date().toISOString()
      });
    });

    // 404 handler for unknown routes
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        message: `The requested endpoint ${req.method} ${req.originalUrl} was not found`,
        availableEndpoints: [
          'GET /',
          'GET /health',
          'GET /api/stations',
          'GET /api/transactions',
          'GET /api/system'
        ]
      });
    });
  }

  setupErrorHandling() {
    // Error handling middleware
    this.app.use((error, req, res, next) => {
      logger.error('Express error:', error);

      // Handle specific error types
      if (error.type === 'entity.parse.failed') {
        return res.status(400).json({
          success: false,
          error: 'Invalid JSON in request body'
        });
      }

      if (error.type === 'entity.too.large') {
        return res.status(413).json({
          success: false,
          error: 'Request body too large'
        });
      }

      // Generic error response
      const isDevelopment = process.env.NODE_ENV === 'development';
      res.status(error.status || 500).json({
        success: false,
        error: isDevelopment ? error.message : 'Internal server error',
        ...(isDevelopment && { stack: error.stack })
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      this.gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      this.gracefulShutdown('unhandledRejection');
    });

    // Handle process termination signals
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received');
      this.gracefulShutdown('SIGTERM');
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received');
      this.gracefulShutdown('SIGINT');
    });
  }

  async start() {
    try {
      // Start OCPP WebSocket server
      logger.info(`Starting OCPP WebSocket server on port ${this.ocppPort}...`);
      ocppServer.start();

      // Start HTTP API server
      this.server = this.app.listen(this.port, () => {
        logger.info(`CSMS HTTP API server started on port ${this.port}`);
        logger.info(`API Documentation: http://localhost:${this.port}/`);
        logger.info(`OCPP WebSocket: ws://localhost:${this.ocppPort}/ocpp/{stationId}`);
      });

      // Setup periodic tasks - commented for debugging
      this.setupPeriodicTasks();

      logger.info('CSMS server startup complete');
    } catch (error) {
      logger.error('Failed to start CSMS server:', error);
      throw error;
    }
  }

  setupPeriodicTasks() {
    // Commented out for debugging - requires realtimeService
    /*
    // Sync system stats to real-time database every 30 seconds
    if (realtimeService.isAvailable()) {
      setInterval(async () => {
        try {
          const stats = await import('./ocpp/sessions.js').then(m => m.sessions.getSystemStats());
          await realtimeService.updateSystemStats(stats);
        } catch (error) {
          logger.error('Error syncing system stats:', error);
        }
      }, 30000);
    }

    // Cleanup expired data every hour
    if (realtimeService.isAvailable()) {
      setInterval(async () => {
        try {
          await realtimeService.cleanupExpiredData();
          logger.debug('Periodic cleanup completed');
        } catch (error) {
          logger.error('Error during periodic cleanup:', error);
        }
      }, 60 * 60 * 1000);
    }

    // Log system status every 5 minutes
    setInterval(async () => {
      try {
        const stats = await import('./ocpp/sessions.js').then(m => m.sessions.getSystemStats());
        logger.info('System Status:', {
          stations: `${stats.onlineStations}/${stats.totalStations} online`,
          connectors: stats.totalConnectors,
          activeTransactions: stats.activeTransactions,
          memory: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
          uptime: `${Math.round(process.uptime() / 60)}min`
        });
      } catch (error) {
        logger.error('Error logging system status:', error);
      }
    }, 5 * 60 * 1000);
    */
  }

  async gracefulShutdown(signal) {
    logger.info(`Graceful shutdown initiated by ${signal}`);

    try {
      // Stop accepting new connections
      if (this.server) {
        this.server.close(() => {
          logger.info('HTTP server closed');
        });
      }

      // Stop OCPP server
      if (ocppServer) {
        ocppServer.stop();
      }

      // Stop sync service
      if (syncService) {
        syncService.stop();
      }

      // Stop real-time listeners - commented out for debugging
      /*
      if (realtimeService.isAvailable()) {
        realtimeService.stopAllListeners();
      }
      */

      // Wait a bit for cleanup
      setTimeout(() => {
        logger.info('Graceful shutdown complete');
        process.exit(0);
      }, 5000);

    } catch (error) {
      logger.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  }
}

// Create and start server
const csmsServer = new CSMSServer();

async function main() {
  try {
    await csmsServer.initialize();
    await csmsServer.start();
  } catch (error) {
    logger.error('Failed to start CSMS:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Start the server
main();

export default csmsServer;
