import {
  registerUser,
  loginUser,
  getUserById,
  updateUser,
  requestPasswordReset,
  resetPassword,
} from './userService';
import { pool } from '../config/database';
import * as passwordUtils from '../utils/password';
import * as jwtUtils from '../utils/jwt';

// Mock dependencies
jest.mock('../config/database');
jest.mock('../utils/password');
jest.mock('../utils/jwt');
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('User Service', () => {
  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    name: 'Test User',
    password_hash: 'hashed_password',
    created_at: new Date(),
    updated_at: new Date(),
    last_login_at: null,
    is_verified: false,
  };

  const mockTokens = {
    accessToken: 'mock_access_token',
    refreshToken: 'mock_refresh_token',
    expiresIn: '24h',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      const registerData = {
        email: 'newuser@example.com',
        password: 'Password123!',
        name: 'New User',
      };

      (passwordUtils.validatePasswordStrength as jest.Mock).mockReturnValue({
        isValid: true,
        errors: [],
      });
      (passwordUtils.hashPassword as jest.Mock).mockResolvedValue('hashed_password');
      (jwtUtils.generateTokens as jest.Mock).mockReturnValue(mockTokens);

      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] }) // Check existing user
        .mockResolvedValueOnce({ rows: [mockUser] }); // Insert new user

      const result = await registerUser(registerData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.user.email).toBe(mockUser.email);
      expect(result.tokens).toEqual(mockTokens);
      expect(passwordUtils.hashPassword).toHaveBeenCalledWith(registerData.password);
    });

    it('should throw error if email already exists', async () => {
      const registerData = {
        email: 'existing@example.com',
        password: 'Password123!',
        name: 'Existing User',
      };

      (passwordUtils.validatePasswordStrength as jest.Mock).mockReturnValue({
        isValid: true,
        errors: [],
      });

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ id: 'existing-id' }],
      });

      await expect(registerUser(registerData)).rejects.toThrow('Email already registered');
    });

    it('should throw error for invalid email format', async () => {
      const registerData = {
        email: 'invalid-email',
        password: 'Password123!',
        name: 'Test User',
      };

      await expect(registerUser(registerData)).rejects.toThrow('Invalid email format');
    });

    it('should throw error for weak password', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'weak',
        name: 'Test User',
      };

      (passwordUtils.validatePasswordStrength as jest.Mock).mockReturnValue({
        isValid: false,
        errors: ['Password too short'],
      });

      await expect(registerUser(registerData)).rejects.toThrow('Password validation failed');
    });

    it('should throw error for empty name', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'Password123!',
        name: '   ',
      };

      (passwordUtils.validatePasswordStrength as jest.Mock).mockReturnValue({
        isValid: true,
        errors: [],
      });

      await expect(registerUser(registerData)).rejects.toThrow('Name is required');
    });
  });

  describe('loginUser', () => {
    it('should login user with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockUser] }) // Find user
        .mockResolvedValueOnce({ rows: [] }); // Update last login

      (passwordUtils.comparePassword as jest.Mock).mockResolvedValue(true);
      (jwtUtils.generateTokens as jest.Mock).mockReturnValue(mockTokens);

      const result = await loginUser(loginData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.user.email).toBe(mockUser.email);
      expect(passwordUtils.comparePassword).toHaveBeenCalledWith(
        loginData.password,
        mockUser.password_hash
      );
    });

    it('should throw error for non-existent user', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'Password123!',
      };

      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      await expect(loginUser(loginData)).rejects.toThrow('Invalid email or password');
    });

    it('should throw error for incorrect password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'WrongPassword123!',
      };

      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockUser] });
      (passwordUtils.comparePassword as jest.Mock).mockResolvedValue(false);

      await expect(loginUser(loginData)).rejects.toThrow('Invalid email or password');
    });

    it('should throw error for missing credentials', async () => {
      await expect(loginUser({ email: '', password: 'test' })).rejects.toThrow(
        'Email and password are required'
      );
      await expect(loginUser({ email: 'test@example.com', password: '' })).rejects.toThrow(
        'Email and password are required'
      );
    });
  });

  describe('getUserById', () => {
    it('should return user by ID', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockUser] });

      const result = await getUserById(mockUser.id);

      expect(result.id).toBe(mockUser.id);
      expect(result.email).toBe(mockUser.email);
      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        [mockUser.id]
      );
    });

    it('should throw error if user not found', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      await expect(getUserById('non-existent-id')).rejects.toThrow('User not found');
    });
  });

  describe('updateUser', () => {
    it('should update user name', async () => {
      const updates = { name: 'Updated Name' };

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ ...mockUser, name: updates.name }],
      });

      const result = await updateUser(mockUser.id, updates);

      expect(result.name).toBe(updates.name);
    });

    it('should update user email', async () => {
      const updates = { email: 'newemail@example.com' };

      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] }) // Check email availability
        .mockResolvedValueOnce({ rows: [{ ...mockUser, email: updates.email }] }); // Update

      const result = await updateUser(mockUser.id, updates);

      expect(result.email).toBe(updates.email);
    });

    it('should throw error if email already in use', async () => {
      const updates = { email: 'existing@example.com' };

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ id: 'another-user-id' }],
      });

      await expect(updateUser(mockUser.id, updates)).rejects.toThrow('Email already in use');
    });

    it('should throw error for invalid email format', async () => {
      const updates = { email: 'invalid-email' };

      await expect(updateUser(mockUser.id, updates)).rejects.toThrow('Invalid email format');
    });

    it('should throw error if no fields to update', async () => {
      await expect(updateUser(mockUser.id, {})).rejects.toThrow('No fields to update');
    });
  });

  describe('requestPasswordReset', () => {
    it('should generate reset token for valid email', async () => {
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ id: mockUser.id }] }) // Find user
        .mockResolvedValueOnce({ rows: [] }); // Update token

      const token = await requestPasswordReset('test@example.com');

      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should generate a unique reset token', async () => {
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ id: mockUser.id }] })
        .mockResolvedValueOnce({ rows: [] });

      const token1 = await requestPasswordReset('test@example.com');

      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ id: mockUser.id }] })
        .mockResolvedValueOnce({ rows: [] });

      const token2 = await requestPasswordReset('test@example.com');

      expect(token1).not.toBe(token2);
      expect(token1.length).toBe(64); // 32 bytes as hex = 64 characters
      expect(token2.length).toBe(64);
    });

    it('should store reset token with expiry time in database', async () => {
      const mockQuery = jest.fn()
        .mockResolvedValueOnce({ rows: [{ id: mockUser.id }] })
        .mockResolvedValueOnce({ rows: [] });
      
      (pool.query as jest.Mock) = mockQuery;

      await requestPasswordReset('test@example.com');

      // Check that the update query was called with token and expiry
      expect(mockQuery).toHaveBeenCalledTimes(2);
      const updateCall = mockQuery.mock.calls[1];
      expect(updateCall[0]).toContain('UPDATE users');
      expect(updateCall[0]).toContain('reset_token');
      expect(updateCall[0]).toContain('reset_token_expiry');
      expect(updateCall[1]).toHaveLength(3); // token, expiry, userId
      expect(typeof updateCall[1][0]).toBe('string'); // token
      expect(updateCall[1][1]).toBeInstanceOf(Date); // expiry
      expect(updateCall[1][2]).toBe(mockUser.id); // userId
    });

    it('should set token expiry to 1 hour from now', async () => {
      const beforeTime = Date.now();
      const mockQuery = jest.fn()
        .mockResolvedValueOnce({ rows: [{ id: mockUser.id }] })
        .mockResolvedValueOnce({ rows: [] });
      
      (pool.query as jest.Mock) = mockQuery;

      await requestPasswordReset('test@example.com');
      const afterTime = Date.now();

      const updateCall = mockQuery.mock.calls[1];
      const expiryDate = updateCall[1][1] as Date;
      const expiryTime = expiryDate.getTime();

      // Token should expire approximately 1 hour (3600000ms) from now
      const expectedExpiry = beforeTime + 3600000;
      const tolerance = 1000; // 1 second tolerance

      expect(expiryTime).toBeGreaterThanOrEqual(expectedExpiry - tolerance);
      expect(expiryTime).toBeLessThanOrEqual(afterTime + 3600000 + tolerance);
    });

    it('should not reveal if email does not exist', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const token = await requestPasswordReset('nonexistent@example.com');

      // Should still return a token to prevent email enumeration
      expect(typeof token).toBe('string');
    });

    it('should throw error for invalid email format', async () => {
      await expect(requestPasswordReset('invalid-email')).rejects.toThrow(
        'Invalid email format'
      );
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      const token = 'valid-reset-token';
      const newPassword = 'NewPassword123!';

      (passwordUtils.validatePasswordStrength as jest.Mock).mockReturnValue({
        isValid: true,
        errors: [],
      });
      (passwordUtils.hashPassword as jest.Mock).mockResolvedValue('new_hashed_password');

      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ id: mockUser.id, email: mockUser.email }] }) // Find user with token
        .mockResolvedValueOnce({ rows: [] }); // Update password

      await resetPassword(token, newPassword);

      expect(passwordUtils.hashPassword).toHaveBeenCalledWith(newPassword);
    });

    it('should update password hash in database', async () => {
      const token = 'valid-reset-token';
      const newPassword = 'NewPassword123!';
      const newHashedPassword = 'new_hashed_password_123';

      (passwordUtils.validatePasswordStrength as jest.Mock).mockReturnValue({
        isValid: true,
        errors: [],
      });
      (passwordUtils.hashPassword as jest.Mock).mockResolvedValue(newHashedPassword);

      const mockQuery = jest.fn()
        .mockResolvedValueOnce({ rows: [{ id: mockUser.id, email: mockUser.email }] })
        .mockResolvedValueOnce({ rows: [] });
      
      (pool.query as jest.Mock) = mockQuery;

      await resetPassword(token, newPassword);

      // Verify the update query was called with the new hashed password
      expect(mockQuery).toHaveBeenCalledTimes(2);
      const updateCall = mockQuery.mock.calls[1];
      expect(updateCall[0]).toContain('UPDATE users');
      expect(updateCall[0]).toContain('password_hash');
      expect(updateCall[1][0]).toBe(newHashedPassword);
      expect(updateCall[1][1]).toBe(mockUser.id);
    });

    it('should clear reset token after successful password reset', async () => {
      const token = 'valid-reset-token';
      const newPassword = 'NewPassword123!';

      (passwordUtils.validatePasswordStrength as jest.Mock).mockReturnValue({
        isValid: true,
        errors: [],
      });
      (passwordUtils.hashPassword as jest.Mock).mockResolvedValue('new_hashed_password');

      const mockQuery = jest.fn()
        .mockResolvedValueOnce({ rows: [{ id: mockUser.id, email: mockUser.email }] })
        .mockResolvedValueOnce({ rows: [] });
      
      (pool.query as jest.Mock) = mockQuery;

      await resetPassword(token, newPassword);

      // Verify that reset_token and reset_token_expiry are set to NULL
      const updateCall = mockQuery.mock.calls[1];
      expect(updateCall[0]).toContain('reset_token = NULL');
      expect(updateCall[0]).toContain('reset_token_expiry = NULL');
    });

    it('should throw error for expired token', async () => {
      const token = 'expired-token';
      const newPassword = 'NewPassword123!';

      (passwordUtils.validatePasswordStrength as jest.Mock).mockReturnValue({
        isValid: true,
        errors: [],
      });

      // Mock query returns no rows because token is expired (expiry < CURRENT_TIMESTAMP)
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      await expect(resetPassword(token, newPassword)).rejects.toThrow(
        'Invalid or expired reset token'
      );
    });

    it('should throw error for invalid token', async () => {
      const token = 'invalid-token';
      const newPassword = 'NewPassword123!';

      (passwordUtils.validatePasswordStrength as jest.Mock).mockReturnValue({
        isValid: true,
        errors: [],
      });

      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      await expect(resetPassword(token, newPassword)).rejects.toThrow(
        'Invalid or expired reset token'
      );
    });

    it('should verify token expiry using database timestamp comparison', async () => {
      const token = 'valid-token';
      const newPassword = 'NewPassword123!';

      (passwordUtils.validatePasswordStrength as jest.Mock).mockReturnValue({
        isValid: true,
        errors: [],
      });
      (passwordUtils.hashPassword as jest.Mock).mockResolvedValue('new_hashed_password');

      const mockQuery = jest.fn()
        .mockResolvedValueOnce({ rows: [{ id: mockUser.id, email: mockUser.email }] })
        .mockResolvedValueOnce({ rows: [] });
      
      (pool.query as jest.Mock) = mockQuery;

      await resetPassword(token, newPassword);

      // Verify the query checks token expiry against CURRENT_TIMESTAMP
      const findUserCall = mockQuery.mock.calls[0];
      expect(findUserCall[0]).toContain('reset_token = $1');
      expect(findUserCall[0]).toContain('reset_token_expiry > CURRENT_TIMESTAMP');
      expect(findUserCall[1][0]).toBe(token);
    });

    it('should throw error for weak new password', async () => {
      const token = 'valid-token';
      const newPassword = 'weak';

      (passwordUtils.validatePasswordStrength as jest.Mock).mockReturnValue({
        isValid: false,
        errors: ['Password too short'],
      });

      await expect(resetPassword(token, newPassword)).rejects.toThrow(
        'Password validation failed'
      );
    });

    it('should validate new password before checking token', async () => {
      const token = 'valid-token';
      const newPassword = 'weak';

      (passwordUtils.validatePasswordStrength as jest.Mock).mockReturnValue({
        isValid: false,
        errors: ['Password too short', 'No uppercase letters'],
      });

      const mockQuery = jest.fn();
      (pool.query as jest.Mock) = mockQuery;

      await expect(resetPassword(token, newPassword)).rejects.toThrow(
        'Password validation failed: Password too short, No uppercase letters'
      );

      // Database should not be queried if password validation fails
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('should update the updated_at timestamp', async () => {
      const token = 'valid-reset-token';
      const newPassword = 'NewPassword123!';

      (passwordUtils.validatePasswordStrength as jest.Mock).mockReturnValue({
        isValid: true,
        errors: [],
      });
      (passwordUtils.hashPassword as jest.Mock).mockResolvedValue('new_hashed_password');

      const mockQuery = jest.fn()
        .mockResolvedValueOnce({ rows: [{ id: mockUser.id, email: mockUser.email }] })
        .mockResolvedValueOnce({ rows: [] });
      
      (pool.query as jest.Mock) = mockQuery;

      await resetPassword(token, newPassword);

      // Verify updated_at is set to CURRENT_TIMESTAMP
      const updateCall = mockQuery.mock.calls[1];
      expect(updateCall[0]).toContain('updated_at = CURRENT_TIMESTAMP');
    });
  });
});
