import express from 'express';
import cors from 'cors';
import { logger } from './utils/logger';
import { config } from './config';
import { testConnection } from './config/database';
import { validateApiKey } from './middleware/apiKey';
import authRoutes from './routes/authRoutes';
import projectRoutes from './routes/projectRoutes';
import riskRoutes from './routes/riskRoutes';

const app = express();

// Middleware
app.use(cors({ origin: config.cors.origin }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Handle JSON parsing errors
app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    logger.error('JSON parsing error', { error: err.message });
    res.status(400).json({
      error: 'ValidationError',
      message: 'Invalid JSON format in request body',
      timestamp: new Date().toISOString(),
    });
    return;
  }
  next(err);
});

// Request logging middleware
app.use((_req, _res, next) => {
  logger.info(`${_req.method} ${_req.path}`, {
    ip: _req.ip,
    userAgent: _req.get('user-agent'),
  });
  next();
});

// Health check endpoint (no API key required)
app.get('/health', async (_req, res) => {
  const dbHealthy = await testConnection();
  res.json({
    status: dbHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    database: dbHealthy ? 'connected' : 'disconnected',
  });
});

// Apply API key validation to all API routes
app.use('/api', validateApiKey);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api', riskRoutes);

app.get('/api', (_req, res) => {
  res.json({
    message: 'Project Risk Analyzer API',
    version: config.apiVersion,
    environment: config.nodeEnv,
  });
});

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({
    error: 'ServerError',
    message: 'An unexpected error occurred',
    timestamp: new Date().toISOString(),
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      logger.warn('Starting server without database connection');
    }

    app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`API Version: ${config.apiVersion}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

// Start server only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
