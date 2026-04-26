import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

/**
 * Middleware to validate API key for external requests
 * This ensures only authorized clients (like Vercel frontend) can access the API
 * API key validation is disabled in development mode
 */
export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  // Skip API key validation in development mode
  if (config.nodeEnv === 'development') {
    return next();
  }

  // Skip API key validation for health check
  if (req.path === '/health') {
    return next();
  }

  const apiKey = req.headers['x-api-key'] as string;
  const expectedApiKey = process.env.API_KEY || config.apiKey;

  if (!apiKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'API key is required',
      timestamp: new Date().toISOString(),
    });
  }

  if (apiKey !== expectedApiKey) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid API key',
      timestamp: new Date().toISOString(),
    });
  }

  next();
};
