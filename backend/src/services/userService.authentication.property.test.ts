import fc from 'fast-check';
import dotenv from 'dotenv';
import { pool } from '../config/database';
import { registerUser, loginUser } from './userService';
import { verifyToken } from '../utils/jwt';

// Load environment variables
dotenv.config();

/**
 * Property-Based Tests for User Authentication
 * Feature: ai-project-risk-analyzer, Property 2: Valid credentials produce valid tokens
 * Validates: Requirements 1.2, 1.3
 */

// Pre-defined valid passwords to avoid slow generation
const VALID_PASSWORDS = [
  'ValidPass123!',
  'SecureP@ssw0rd',
  'MyP@ssword99',
  'Test123!Pass',
  'Strong#Pass1',
];

describe('Property 2: Valid credentials produce valid tokens', () => {
  afterEach(async () => {
    // Clean up test users after each test
    await pool.query("DELETE FROM users WHERE email LIKE 'test-auth-%@example.com'");
  });

  afterAll(async () => {
    // Close database connection
    await pool.end();
  });

  // Feature: ai-project-risk-analyzer, Property 2: Valid credentials produce valid tokens
  it('should produce valid JWT tokens for any registered user with valid credentials', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.integer().map(n => `test-auth-${Date.now()}-${n}@example.com`),
          password: fc.constantFrom(...VALID_PASSWORDS),
          name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        }),
        async (userData) => {
          try {
            // First, register the user
            const registerResult = await registerUser(userData);
            
            if (!registerResult.user || !registerResult.tokens) {
              return false;
            }

            // Now login with the same credentials
            const loginResult = await loginUser({
              email: userData.email,
              password: userData.password,
            });

            // Verify login returns user and tokens
            if (!loginResult.user || !loginResult.tokens) {
              return false;
            }

            // Verify user information matches
            if (loginResult.user.email !== userData.email.toLowerCase()) {
              return false;
            }

            if (loginResult.user.name !== userData.name.trim()) {
              return false;
            }

            // Verify tokens are present
            if (!loginResult.tokens.accessToken || !loginResult.tokens.refreshToken) {
              return false;
            }

            // Verify access token is valid and can be verified
            try {
              const decodedAccess = verifyToken(loginResult.tokens.accessToken);
              
              // Verify token contains correct user information
              if (decodedAccess.userId !== loginResult.user.id) {
                return false;
              }

              if (decodedAccess.email !== loginResult.user.email) {
                return false;
              }
            } catch (error) {
              // Token verification should not fail for valid tokens
              console.error('Access token verification failed:', error);
              return false;
            }

            // Verify refresh token is valid and can be verified
            try {
              const decodedRefresh = verifyToken(loginResult.tokens.refreshToken);
              
              // Verify token contains correct user information
              if (decodedRefresh.userId !== loginResult.user.id) {
                return false;
              }

              if (decodedRefresh.email !== loginResult.user.email) {
                return false;
              }
            } catch (error) {
              // Token verification should not fail for valid tokens
              console.error('Refresh token verification failed:', error);
              return false;
            }

            // Verify expiresIn is present
            if (!loginResult.tokens.expiresIn) {
              return false;
            }

            return true;
          } catch (error: any) {
            // Valid credentials should not throw errors
            console.error('Authentication failed:', error.message);
            return false;
          }
        }
      ),
      { numRuns: 100, timeout: 30000 }
    );
  }, 35000);

  // Feature: ai-project-risk-analyzer, Property 2: Valid credentials produce valid tokens
  it('should grant access to protected resources with valid tokens', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.integer().map(n => `test-auth-access-${Date.now()}-${n}@example.com`),
          password: fc.constantFrom(...VALID_PASSWORDS),
          name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        }),
        async (userData) => {
          try {
            // Register and login
            await registerUser(userData);
            const loginResult = await loginUser({
              email: userData.email,
              password: userData.password,
            });

            // Verify token grants access by verifying it
            const decoded = verifyToken(loginResult.tokens.accessToken);

            // Verify decoded token has required fields
            if (!decoded.userId || !decoded.email) {
              return false;
            }

            // Verify we can use the userId to fetch user data
            const userResult = await pool.query(
              'SELECT id, email, name FROM users WHERE id = $1',
              [decoded.userId]
            );

            if (userResult.rows.length !== 1) {
              return false;
            }

            const dbUser = userResult.rows[0];

            // Verify the user data matches
            if (dbUser.id !== decoded.userId) {
              return false;
            }

            if (dbUser.email !== decoded.email) {
              return false;
            }

            return true;
          } catch (error: any) {
            console.error('Access verification failed:', error.message);
            return false;
          }
        }
      ),
      { numRuns: 100, timeout: 30000 }
    );
  }, 35000);

  // Feature: ai-project-risk-analyzer, Property 2: Valid credentials produce valid tokens
  it('should reject invalid credentials and not produce tokens', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.integer().map(n => `test-auth-invalid-${Date.now()}-${n}@example.com`),
          password: fc.constantFrom(...VALID_PASSWORDS),
          wrongPassword: fc.constantFrom('WrongPass123!', 'BadPassword1!', 'Invalid@Pass9'),
          name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        }),
        async (userData) => {
          try {
            // Register user with correct password
            await registerUser({
              email: userData.email,
              password: userData.password,
              name: userData.name,
            });

            // Try to login with wrong password
            try {
              await loginUser({
                email: userData.email,
                password: userData.wrongPassword,
              });
              
              // Should not reach here - login should fail
              return false;
            } catch (error: any) {
              // Should throw error about invalid credentials
              return error.message.includes('Invalid email or password');
            }
          } catch (error: any) {
            console.error('Test setup failed:', error.message);
            return false;
          }
        }
      ),
      { numRuns: 50, timeout: 30000 }
    );
  }, 35000);

  // Feature: ai-project-reject-analyzer, Property 2: Valid credentials produce valid tokens
  it('should reject login attempts for non-existent users', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.integer().map(n => `nonexistent-${Date.now()}-${n}@example.com`),
          password: fc.constantFrom(...VALID_PASSWORDS),
        }),
        async (credentials) => {
          try {
            await loginUser(credentials);
            
            // Should not reach here - login should fail
            return false;
          } catch (error: any) {
            // Should throw error about invalid credentials
            return error.message.includes('Invalid email or password');
          }
        }
      ),
      { numRuns: 50, timeout: 30000 }
    );
  }, 35000);

  // Feature: ai-project-risk-analyzer, Property 2: Valid credentials produce valid tokens
  it('should handle case-insensitive email matching during login', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.integer().map(n => `test-auth-case-${Date.now()}-${n}@example.com`),
          password: fc.constantFrom(...VALID_PASSWORDS),
          name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        }),
        async (userData) => {
          try {
            // Register with lowercase email
            await registerUser(userData);

            // Try to login with different case variations
            const emailVariations = [
              userData.email.toUpperCase(),
              userData.email.toLowerCase(),
              userData.email.charAt(0).toUpperCase() + userData.email.slice(1),
            ];

            for (const emailVariation of emailVariations) {
              const loginResult = await loginUser({
                email: emailVariation,
                password: userData.password,
              });

              // All variations should work
              if (!loginResult.user || !loginResult.tokens) {
                return false;
              }

              // Email should be normalized to lowercase
              if (loginResult.user.email !== userData.email.toLowerCase()) {
                return false;
              }

              // Tokens should be valid
              try {
                verifyToken(loginResult.tokens.accessToken);
              } catch (error) {
                return false;
              }
            }

            return true;
          } catch (error: any) {
            console.error('Case-insensitive login failed:', error.message);
            return false;
          }
        }
      ),
      { numRuns: 50, timeout: 30000 }
    );
  }, 35000);

  // Feature: ai-project-risk-analyzer, Property 2: Valid credentials produce valid tokens
  it('should update last_login_at timestamp on successful authentication', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.integer().map(n => `test-auth-timestamp-${Date.now()}-${n}@example.com`),
          password: fc.constantFrom(...VALID_PASSWORDS),
          name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        }),
        async (userData) => {
          try {
            // Register user
            const registerResult = await registerUser(userData);
            const userId = registerResult.user.id;

            // Get initial last_login_at (should be null)
            const beforeLogin = await pool.query(
              'SELECT last_login_at FROM users WHERE id = $1',
              [userId]
            );

            const initialLoginAt = beforeLogin.rows[0].last_login_at;

            // Wait a small amount to ensure timestamp difference
            await new Promise(resolve => setTimeout(resolve, 10));

            // Login
            const loginResult = await loginUser({
              email: userData.email,
              password: userData.password,
            });

            // Get updated last_login_at
            const afterLogin = await pool.query(
              'SELECT last_login_at FROM users WHERE id = $1',
              [userId]
            );

            const updatedLoginAt = afterLogin.rows[0].last_login_at;

            // Verify last_login_at was updated
            if (!updatedLoginAt) {
              return false;
            }

            // Verify it's different from initial value (or initial was null)
            if (initialLoginAt && updatedLoginAt <= initialLoginAt) {
              return false;
            }

            // Verify the returned user object has the updated timestamp
            if (!loginResult.user.lastLoginAt) {
              return false;
            }

            return true;
          } catch (error: any) {
            console.error('Timestamp update test failed:', error.message);
            return false;
          }
        }
      ),
      { numRuns: 50, timeout: 30000 }
    );
  }, 35000);
});
