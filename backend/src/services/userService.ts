import { pool } from '../config/database';
import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/password';
import { generateTokens, TokenResponse } from '../utils/jwt';
import { logger } from '../utils/logger';
import crypto from 'crypto';

/**
 * User Service
 * Handles user registration, authentication, and password management
 * Validates: Requirements 1.1, 1.2, 1.5
 */

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
  isVerified: boolean;
}

export interface RegisterDTO {
  email: string;
  password: string;
  name: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  tokens: TokenResponse;
}

/**
 * Register a new user
 * @param userData - User registration data
 * @returns User object and authentication tokens
 * @throws Error if email already exists or validation fails
 */
export async function registerUser(userData: RegisterDTO): Promise<AuthResponse> {
  const { email, password, name } = userData;

  // Validate email format
  if (!isValidEmail(email)) {
    throw new Error('Invalid email format');
  }

  // Validate password strength
  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.isValid) {
    throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
  }

  // Validate name
  if (!name || name.trim().length === 0) {
    throw new Error('Name is required');
  }

  try {
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('Email already registered');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Insert new user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, is_verified) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, email, name, created_at, updated_at, last_login_at, is_verified`,
      [email.toLowerCase(), passwordHash, name.trim(), false]
    );

    const user = mapRowToUser(result.rows[0]);

    // Generate tokens
    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
    });

    logger.info('User registered successfully', { userId: user.id, email: user.email });

    // TODO: Send verification email (implement email service)

    return { user, tokens };
  } catch (error: any) {
    logger.error('Error registering user', { error: error.message, email });
    throw error;
  }
}

/**
 * Authenticate a user with email and password
 * @param credentials - User login credentials
 * @returns User object and authentication tokens
 * @throws Error if credentials are invalid
 */
export async function loginUser(credentials: LoginDTO): Promise<AuthResponse> {
  const { email, password } = credentials;

  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  try {
    // Find user by email
    const result = await pool.query(
      `SELECT id, email, password_hash, name, created_at, updated_at, last_login_at, is_verified 
       FROM users 
       WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid email or password');
    }

    const userRow = result.rows[0];

    // Verify password
    const isPasswordValid = await comparePassword(password, userRow.password_hash);

    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login timestamp
    await pool.query(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
      [userRow.id]
    );

    const user = mapRowToUser(userRow);
    user.lastLoginAt = new Date(); // Update in-memory object

    // Generate tokens
    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
    });

    logger.info('User logged in successfully', { userId: user.id, email: user.email });

    return { user, tokens };
  } catch (error: any) {
    logger.error('Error logging in user', { error: error.message, email });
    throw error;
  }
}

/**
 * Get user by ID
 * @param userId - User ID
 * @returns User object
 * @throws Error if user not found
 */
export async function getUserById(userId: string): Promise<User> {
  try {
    const result = await pool.query(
      `SELECT id, email, name, created_at, updated_at, last_login_at, is_verified 
       FROM users 
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return mapRowToUser(result.rows[0]);
  } catch (error: any) {
    logger.error('Error getting user by ID', { error: error.message, userId });
    throw error;
  }
}

/**
 * Update user profile
 * @param userId - User ID
 * @param updates - Fields to update
 * @returns Updated user object
 */
export async function updateUser(
  userId: string,
  updates: { name?: string; email?: string }
): Promise<User> {
  const { name, email } = updates;

  if (!name && !email) {
    throw new Error('No fields to update');
  }

  try {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name) {
      updateFields.push(`name = $${paramIndex++}`);
      values.push(name.trim());
    }

    if (email) {
      if (!isValidEmail(email)) {
        throw new Error('Invalid email format');
      }

      // Check if email is already taken by another user
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email.toLowerCase(), userId]
      );

      if (existingUser.rows.length > 0) {
        throw new Error('Email already in use');
      }

      updateFields.push(`email = $${paramIndex++}`);
      values.push(email.toLowerCase());
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    const query = `
      UPDATE users 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramIndex}
      RETURNING id, email, name, created_at, updated_at, last_login_at, is_verified
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    logger.info('User updated successfully', { userId });

    return mapRowToUser(result.rows[0]);
  } catch (error: any) {
    logger.error('Error updating user', { error: error.message, userId });
    throw error;
  }
}

/**
 * Request password reset
 * Generates a reset token and stores it in the database
 * @param email - User email
 * @returns Reset token
 * @throws Error if user not found
 */
export async function requestPasswordReset(email: string): Promise<string> {
  if (!isValidEmail(email)) {
    throw new Error('Invalid email format');
  }

  try {
    // Find user by email
    const result = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      // Don't reveal if email exists or not for security
      logger.warn('Password reset requested for non-existent email', { email });
      // Still return success to prevent email enumeration
      return 'reset-token-placeholder';
    }

    const userId = result.rows[0].id;

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Store reset token
    await pool.query(
      `UPDATE users 
       SET reset_token = $1, reset_token_expiry = $2 
       WHERE id = $3`,
      [resetToken, resetTokenExpiry, userId]
    );

    logger.info('Password reset token generated', { userId, email });

    // TODO: Send reset email (implement email service)

    return resetToken;
  } catch (error: any) {
    logger.error('Error requesting password reset', { error: error.message, email });
    throw error;
  }
}

/**
 * Reset password using reset token
 * @param token - Reset token
 * @param newPassword - New password
 * @throws Error if token is invalid or expired
 */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  // Validate new password
  const passwordValidation = validatePasswordStrength(newPassword);
  if (!passwordValidation.isValid) {
    throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
  }

  try {
    // Find user with valid reset token
    const result = await pool.query(
      `SELECT id, email FROM users 
       WHERE reset_token = $1 AND reset_token_expiry > CURRENT_TIMESTAMP`,
      [token]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid or expired reset token');
    }

    const { id: userId, email } = result.rows[0];

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password and clear reset token
    await pool.query(
      `UPDATE users 
       SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2`,
      [passwordHash, userId]
    );

    logger.info('Password reset successfully', { userId, email });
  } catch (error: any) {
    logger.error('Error resetting password', { error: error.message });
    throw error;
  }
}

/**
 * Helper function to validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Helper function to map database row to User object
 */
function mapRowToUser(row: any): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastLoginAt: row.last_login_at,
    isVerified: row.is_verified,
  };
}
