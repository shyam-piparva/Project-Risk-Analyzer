import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt';
import { logger } from '../utils/logger';

/**
 * Authentication Middleware
 * Validates JWT tokens and attaches user information to requests
 * Validates: Requirements 1.3, 1.4
 */

// Extend Express Request type to include user information
export interface AuthRequest extends Request {
  user?: TokenPayload;
}

/**
 * Middleware to verify JWT token from Authorization header
 * Extracts token from "Bearer <token>" format
 * Attaches decoded user information to request object
 * 
 * @throws 401 if token is missing, invalid, or expired
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        error: 'AuthenticationError',
        message: 'No authorization token provided',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Check for Bearer token format
    if (!authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'AuthenticationError',
        message: 'Invalid authorization format. Expected "Bearer <token>"',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Extract token
    const token = authHeader.substring(7); // Remove "Bearer " prefix

    if (!token) {
      res.status(401).json({
        error: 'AuthenticationError',
        message: 'No token provided',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Verify token
    try {
      const decoded = verifyToken(token);
      
      // Attach user information to request
      req.user = decoded;
      
      logger.debug('Token verified successfully', { 
        userId: decoded.userId,
        email: decoded.email 
      });
      
      next();
    } catch (error: any) {
      // Handle specific token errors
      if (error.message === 'Token has expired') {
        res.status(401).json({
          error: 'AuthenticationError',
          message: 'Token has expired',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (error.message === 'Invalid token') {
        res.status(401).json({
          error: 'AuthenticationError',
          message: 'Invalid token',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Generic token verification failure
      res.status(401).json({
        error: 'AuthenticationError',
        message: 'Token verification failed',
        timestamp: new Date().toISOString(),
      });
      return;
    }
  } catch (error: any) {
    logger.error('Authentication middleware error', { 
      error: error.message,
      stack: error.stack 
    });
    
    res.status(500).json({
      error: 'ServerError',
      message: 'An error occurred during authentication',
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Optional authentication middleware
 * Attempts to verify token but doesn't fail if token is missing
 * Useful for endpoints that have different behavior for authenticated vs unauthenticated users
 */
export const optionalAuthenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      next();
      return;
    }

    const token = authHeader.substring(7);

    if (!token) {
      next();
      return;
    }

    try {
      const decoded = verifyToken(token);
      req.user = decoded;
      logger.debug('Optional token verified', { userId: decoded.userId });
    } catch (error) {
      // Token is invalid but we don't fail the request
      logger.debug('Optional token verification failed', { error });
    }

    next();
  } catch (error: any) {
    logger.error('Optional authentication middleware error', { error: error.message });
    // Don't fail the request, just continue
    next();
  }
};
