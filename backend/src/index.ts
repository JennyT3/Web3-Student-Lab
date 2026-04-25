import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import redisClient from './cache/RedisClient.js';
import cacheMetrics from './cache/CacheMetrics.js';
import prisma from './db/index.js';
import { requestLogger } from './middleware/requestLogger.js';
import routes from './routes/index.js';
import { validateEnvironment } from './utils/checkEnv.js';
import logger from './utils/logger.js';

// Load environment variables
dotenv.config();

// Validate environment variables before starting the application
// Skip validation in test environment as tests may override environment variables
if (process.env.NODE_ENV !== 'test') {
  validateEnvironment();
}

// Initialize Redis connection
if (process.env.NODE_ENV !== 'test') {
  redisClient.connect().catch((err) => {
    logger.warn('Redis connection failed, continuing without cache:', err);
  });
}

export const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

import { apiRateLimiter } from './middleware/rateLimiter.js';

// Global Rate Limiting - now using sliding window
app.use(apiRateLimiter);
app.use(requestLogger);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'Web3 Student Lab Backend is running',
    uptime: process.uptime(),
    version: '1.0.0',
    redis: redisClient.isHealthy() ? 'connected' : 'disconnected',
  });
});

// Cache metrics endpoint
app.use('/api/v1/cache', cacheMetrics);

// API Routes
app.use('/api/v1', routes);

// Start server only if not in test environment
let server: ReturnType<typeof app.listen> | null = null;

if (process.env.NODE_ENV !== 'test') {
  server = app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('Shutting down gracefully...');
    await redisClient.disconnect();
    await prisma.$disconnect();
    server?.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGTERM', async () => {
    logger.info('Shutting down gracefully...');
    await redisClient.disconnect();
    await prisma.$disconnect();
    server?.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });
}
