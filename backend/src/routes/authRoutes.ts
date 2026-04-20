import { Router } from 'express';
import {
  register,
  login,
  refresh,
  forgotPassword,
  resetPasswordHandler,
  verify,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';

/**
 * Authentication Routes
 * Defines all authentication-related API endpoints
 * Validates: Requirements 1.1, 1.2, 1.5
 */

const router = Router();

// Public routes (no authentication required)
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPasswordHandler);

// Protected routes (authentication required)
router.get('/verify', authenticate, verify);

export default router;
