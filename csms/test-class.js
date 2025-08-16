import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { logger } from './src/utils/logger.js';
import { ocppServer } from './src/ocpp/wsServer.js';

// Test CSMSServer class structure
class CSMSServer {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.ocppPort = process.env.OCPP_WS_PORT || 3001;
  }

  async initialize() {
    try {
      logger.info('Initializing CSMS services...');
      this.setupMiddleware();
      this.setupRoutes();
      logger.info('CSMS server initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize CSMS server:', error.message, error.stack);
      throw error;
    }
  }

  setupMiddleware() {
    this.app.use(helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false
    }));

    this.app.use(cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    }));

    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: {
        success: false,
        error: 'Too many requests'
      }
    });
    this.app.use('/api/', limiter);

    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  }

  setupRoutes() {
    this.app.get('/health', (req, res) => {
      res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString()
      });
    });

    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        message: 'OCPP 1.6-J Central System Management Server (CSMS)',
        version: '1.0.0'
      });
    });
  }

  async start() {
    try {
      this.server = this.app.listen(this.port, () => {
        logger.info(`CSMS HTTP API server started on port ${this.port}`);
      });
      logger.info('CSMS server startup complete');
    } catch (error) {
      logger.error('Failed to start CSMS server:', error);
      throw error;
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

main();
