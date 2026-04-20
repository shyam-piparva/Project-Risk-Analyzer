import { Request, Response } from 'express';
import Joi from 'joi';
import {
  registerUser,
  loginUser,
  requestPasswordReset,
  resetPassword,
  getUserById,
} from '../services/userService';
import { refreshAccessToken } from '../utils/jwt';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';

/**
 * Authentication Controllers
 * Handles HTTP requests for user authentication and authorization
 * Validates: Requirements 1.1, 1.2, 1.5
 */

// Validation schemas using Joi
const registerSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'any.required': 'Password is required',
  }),
  name: Joi.string().trim().min(1).max(255).required().messages({
    'string.empty': 'Name cannot be empty',
    'string.min': 'Name cannot be empty',
    'string.max': 'Name must be less than 255 characters',
    'any.required': 'Name is required',
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'Reset token is required',
  }),
  newPassword: Joi.string().min(8).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'any.required': 'New password is required',
  }),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'any.required': 'Refresh token is required',
  }),
});

/**
 * POST /api/auth/register
 * Register a new user account
 * Validates: Requirement 1.1
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const { error, value } = registerSchema.validate(req.body);

    if (error) {
      res.status(400).json({
        error: 'ValidationError',
        message: error.details[0].message,
        field: error.details[0].path[0],
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Register user
    const result = await registerUser(value);

    logger.info('User registered via API', { userId: result.user.id });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        isVerified: result.user.isVerified,
      },
      tokens: result.tokens,
    });
  } catch (error: any) {
    logger.error('Registration error', { error: error.message });

    if (error.message === 'Email already registered') {
      res.status(400).json({
        error: 'ValidationError',
        message: error.message,
        field: 'email',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (error.message.includes('Password validation failed')) {
      res.status(400).json({
        error: 'ValidationError',
        message: error.message,
        field: 'password',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(500).json({
      error: 'ServerError',
      message: 'An error occurred during registration',
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * POST /api/auth/login
 * Authenticate user and return JWT tokens
 * Validates: Requirement 1.2
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const { error, value } = loginSchema.validate(req.body);

    if (error) {
      res.status(400).json({
        error: 'ValidationError',
        message: error.details[0].message,
        field: error.details[0].path[0],
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Authenticate user
    const result = await loginUser(value);

    logger.info('User logged in via API', { userId: result.user.id });

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        isVerified: result.user.isVerified,
        lastLoginAt: result.user.lastLoginAt,
      },
      tokens: result.tokens,
    });
  } catch (error: any) {
    logger.error('Login error', { error: error.message });

    if (error.message === 'Invalid email or password') {
      res.status(401).json({
        error: 'AuthenticationError',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(500).json({
      error: 'ServerError',
      message: 'An error occurred during login',
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 * Validates: Requirement 1.3, 1.4
 */
export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const { error, value } = refreshTokenSchema.validate(req.body);

    if (error) {
      res.status(400).json({
        error: 'ValidationError',
        message: error.details[0].message,
        field: error.details[0].path[0],
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Refresh access token
    const newAccessToken = refreshAccessToken(value.refreshToken);

    logger.info('Access token refreshed');

    res.status(200).json({
      message: 'Token refreshed successfully',
      accessToken: newAccessToken,
    });
  } catch (error: any) {
    logger.error('Token refresh error', { error: error.message });

    if (
      error.message === 'Token has expired' ||
      error.message === 'Invalid token' ||
      error.message === 'Failed to refresh access token'
    ) {
      res.status(401).json({
        error: 'AuthenticationError',
        message: 'Invalid or expired refresh token',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(500).json({
      error: 'ServerError',
      message: 'An error occurred during token refresh',
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * POST /api/auth/forgot-password
 * Request password reset token
 * Validates: Requirement 1.5
 */
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const { error, value } = forgotPasswordSchema.validate(req.body);

    if (error) {
      res.status(400).json({
        error: 'ValidationError',
        message: error.details[0].message,
        field: error.details[0].path[0],
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Request password reset
    await requestPasswordReset(value.email);

    logger.info('Password reset requested', { email: value.email });

    // Always return success to prevent email enumeration
    res.status(200).json({
      message: 'If the email exists, a password reset link has been sent',
    });
  } catch (error: any) {
    logger.error('Forgot password error', { error: error.message });

    res.status(500).json({
      error: 'ServerError',
      message: 'An error occurred while processing your request',
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * POST /api/auth/reset-password
 * Reset password using reset token
 * Validates: Requirement 1.5
 */
export const resetPasswordHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const { error, value } = resetPasswordSchema.validate(req.body);

    if (error) {
      res.status(400).json({
        error: 'ValidationError',
        message: error.details[0].message,
        field: error.details[0].path[0],
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Reset password
    await resetPassword(value.token, value.newPassword);

    logger.info('Password reset successfully');

    res.status(200).json({
      message: 'Password reset successfully',
    });
  } catch (error: any) {
    logger.error('Reset password error', { error: error.message });

    if (error.message === 'Invalid or expired reset token') {
      res.status(400).json({
        error: 'ValidationError',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (error.message.includes('Password validation failed')) {
      res.status(400).json({
        error: 'ValidationError',
        message: error.message,
        field: 'newPassword',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(500).json({
      error: 'ServerError',
      message: 'An error occurred while resetting your password',
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * GET /api/auth/verify
 * Verify JWT token and return user information
 * Validates: Requirement 1.3
 */
export const verify = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // User information is already attached by authenticate middleware
    if (!req.user) {
      res.status(401).json({
        error: 'AuthenticationError',
        message: 'No user information found',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Fetch full user details
    const user = await getUserById(req.user.userId);

    logger.info('Token verified via API', { userId: user.id });

    res.status(200).json({
      message: 'Token is valid',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    logger.error('Token verification error', { error: error.message });

    if (error.message === 'User not found') {
      res.status(404).json({
        error: 'NotFoundError',
        message: 'User not found',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(500).json({
      error: 'ServerError',
      message: 'An error occurred during token verification',
      timestamp: new Date().toISOString(),
    });
  }
};
