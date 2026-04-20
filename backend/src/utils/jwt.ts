import jwt, { SignOptions } from 'jsonwebtoken';
import { logger } from './logger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN: string | number = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN: string | number = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export interface TokenPayload {
  userId: string;
  email: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

/**
 * Generate JWT access and refresh tokens for a user
 * @param payload - User information to encode in the token
 * @returns Object containing access token, refresh token, and expiration time
 */
export const generateTokens = (payload: TokenPayload): TokenResponse => {
  try {
    const accessOptions: SignOptions = {
      expiresIn: JWT_EXPIRES_IN as any,
    };

    const refreshOptions: SignOptions = {
      expiresIn: JWT_REFRESH_EXPIRES_IN as any,
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, accessOptions);
    const refreshToken = jwt.sign(payload, JWT_SECRET, refreshOptions);

    return {
      accessToken,
      refreshToken,
      expiresIn: JWT_EXPIRES_IN as string,
    };
  } catch (error) {
    logger.error('Error generating tokens', { error });
    throw new Error('Failed to generate authentication tokens');
  }
};

/**
 * Verify and decode a JWT token
 * @param token - JWT token to verify
 * @returns Decoded token payload
 * @throws Error if token is invalid or expired
 */
export const verifyToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn('Token expired', { error: error.message });
      throw new Error('Token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Invalid token', { error: error.message });
      throw new Error('Invalid token');
    } else {
      logger.error('Token verification error', { error });
      throw new Error('Token verification failed');
    }
  }
};

/**
 * Decode a JWT token without verifying its signature
 * Useful for extracting information from expired tokens
 * @param token - JWT token to decode
 * @returns Decoded token payload or null if invalid
 */
export const decodeToken = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.decode(token) as TokenPayload;
    return decoded;
  } catch (error) {
    logger.error('Error decoding token', { error });
    return null;
  }
};

/**
 * Check if a token is expired without throwing an error
 * @param token - JWT token to check
 * @returns true if token is expired, false otherwise
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    jwt.verify(token, JWT_SECRET);
    return false;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return true;
    }
    // For other errors (invalid token, etc.), consider it as expired
    return true;
  }
};

/**
 * Refresh an access token using a valid refresh token
 * @param refreshToken - Valid refresh token
 * @returns New access token
 * @throws Error if refresh token is invalid or expired
 */
export const refreshAccessToken = (refreshToken: string): string => {
  try {
    const payload = verifyToken(refreshToken);
    
    const options: SignOptions = {
      expiresIn: JWT_EXPIRES_IN as any,
    };

    // Generate new access token with the same payload
    const accessToken = jwt.sign(
      { userId: payload.userId, email: payload.email },
      JWT_SECRET,
      options
    );

    return accessToken;
  } catch (error) {
    logger.error('Error refreshing access token', { error });
    throw new Error('Failed to refresh access token');
  }
};
