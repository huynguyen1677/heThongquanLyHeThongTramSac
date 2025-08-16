import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { logger } from './src/utils/logger.js';
import { ocppServer } from './src/ocpp/wsServer.js';

const app = express();
app.use(helmet());
app.use(cors());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

app.get('/', (req, res) => {
  res.json({ message: 'Step 1: Basic Express + CORS working!' });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
