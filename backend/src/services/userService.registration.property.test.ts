import fc from 'fast-check';
import dotenv from 'dotenv';
import { pool } from '../config/database';
import { registerUser } from './userService';
import * as passwordUtils from '../utils/password';

// Load environment variables
dotenv.config();

/**
 * Property-Based Tests for User Registration
 * Feature: ai-project-risk-analyzer, Property 1: User registration creates valid accounts
 * Validates: Requirements 1.1, 1.6
 */

// Pre-defined valid passwords to avoid slow generation
const VALID_PASSWORDS = [
  'ValidPass123!',
  'SecureP@ssw0rd',
  'MyP@ssword99',
  'Test123!Pass',
  'Strong#Pass1',
];

describe('Property 1: User registration creates valid accounts', () => {
  afterEach(async () => {
    // Clean up test users after each test
    await pool.query("DELETE FROM users WHERE email LIKE 'test-%@example.com'");
  });

  afterAll(async () => {
    // Close database connection
    await pool.end();
  });

  // Feature: ai-project-risk-analyzer, Property 1: User registration creates valid accounts
  it('should create valid user accounts with hashed passwords for any valid registration data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.integer().map(n => `test-${Date.now()}-${n}@example.com`),
          password: fc.constantFrom(...VALID_PASSWORDS),
          name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        }),
        async (userData) => {
          try {
            // Register the user
            const result = await registerUser(userData);

            // Verify user object is returned
            if (!result.user || !result.tokens) {
              return false;
            }

            // Verify user has required fields
            if (!result.user.id || !result.user.email || !result.user.name) {
              return false;
            }

            // Verify email is normalized to lowercase
            if (result.user.email !== userData.email.toLowerCase()) {
              return false;
            }

            // Verify name is trimmed
            if (result.user.name !== userData.name.trim()) {
              return false;
            }

            // Verify tokens are generated
            if (!result.tokens.accessToken || !result.tokens.refreshToken) {
              return false;
            }

            // Verify user is stored in database
            const dbResult = await pool.query(
              'SELECT id, email, password_hash, name, is_verified FROM users WHERE email = $1',
              [userData.email.toLowerCase()]
            );

            if (dbResult.rows.length !== 1) {
              return false;
            }

            const dbUser = dbResult.rows[0];

            // Verify password is hashed (not stored in plain text)
            if (dbUser.password_hash === userData.password) {
              return false;
            }

            // Verify password hash can be verified
            const isPasswordValid = await passwordUtils.comparePassword(
              userData.password,
              dbUser.password_hash
            );

            if (!isPasswordValid) {
              return false;
            }

            // Verify user is not verified by default
            if (dbUser.is_verified !== false) {
              return false;
            }

            return true;
          } catch (error: any) {
            // Valid registration data should not throw errors
            console.error('Registration failed:', error.message);
            return false;
          }
        }
      ),
      { numRuns: 100, timeout: 30000 }
    );
  }, 35000);

  // Feature: ai-project-risk-analyzer, Property 1: User registration creates valid accounts
  it('should reject duplicate email addresses', async () => {
    const testEmail = `test-duplicate-${Date.now()}@example.com`;
    
    // Register user first time
    await registerUser({
      email: testEmail,
      password: 'ValidPass123!',
      name: 'Test User',
    });

    // Try to register again with same email - should fail
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.constant(testEmail),
          password: fc.constant('ValidPass123!'),
          name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        }),
        async (userData) => {
          try {
            await registerUser(userData);
            // Should not reach here
            return false;
          } catch (error: any) {
            // Should throw error about duplicate email
            return error.message.includes('Email already registered');
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  // Feature: ai-project-risk-analyzer, Property 1: User registration creates valid accounts
  it('should reject invalid email formats', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.oneof(
            fc.constant('invalid-email'),
            fc.constant('missing@domain'),
            fc.constant('@nodomain.com'),
            fc.constant('no-at-sign.com'),
            fc.constant(''),
          ),
          password: fc.constant('ValidPass123!'),
          name: fc.constant('Test User'),
        }),
        async (userData) => {
          try {
            await registerUser(userData);
            // Should not reach here
            return false;
          } catch (error: any) {
            // Should throw error about invalid email
            return error.message.includes('Invalid email format');
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  // Feature: ai-project-risk-analyzer, Property 1: User registration creates valid accounts
  it('should reject weak passwords', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.integer().map(n => `test-weak-${Date.now()}-${n}@example.com`),
          password: fc.oneof(
            fc.constant('short'), // Too short
            fc.constant('nouppercase123!'), // No uppercase
            fc.constant('NOLOWERCASE123!'), // No lowercase
            fc.constant('NoNumbers!'), // No numbers
            fc.constant('NoSpecialChar123'), // No special characters
          ),
          name: fc.constant('Test User'),
        }),
        async (userData) => {
          try {
            await registerUser(userData);
            // Should not reach here
            return false;
          } catch (error: any) {
            // Should throw error about password validation
            return error.message.includes('Password validation failed');
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  // Feature: ai-project-risk-analyzer, Property 1: User registration creates valid accounts
  it('should reject empty or whitespace-only names', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.integer().map(n => `test-empty-${Date.now()}-${n}@example.com`),
          password: fc.constant('ValidPass123!'),
          name: fc.oneof(
            fc.constant(''),
            fc.constant('   '),
            fc.constant('\t\t'),
            fc.constant('\n\n'),
          ),
        }),
        async (userData) => {
          try {
            await registerUser(userData);
            // Should not reach here
            return false;
          } catch (error: any) {
            // Should throw error about name being required
            return error.message.includes('Name is required');
          }
        }
      ),
      { numRuns: 20 }
    );
  });
});
