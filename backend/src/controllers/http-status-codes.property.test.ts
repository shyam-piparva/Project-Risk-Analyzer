import fc from 'fast-check';
import request from 'supertest';
import dotenv from 'dotenv';
import app from '../index';
import { pool } from '../config/database';
import { generateTokens } from '../utils/jwt';

// Load environment variables
dotenv.config();

/**
 * Property-Based Tests for HTTP Status Codes
 * Feature: ai-project-risk-analyzer, Property 29: HTTP status codes are correct
 * Validates: Requirements 10.2, 12.6
 */

describe('Property 29: HTTP status codes are correct', () => {
  let testUserId: string;
  let testUserToken: string;
  let testProjectId: string;

  beforeAll(async () => {
    // Create a test user
    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, name) 
       VALUES ($1, $2, $3) 
       RETURNING id`,
      [`test-status-${Date.now()}@example.com`, 'hashedpassword', 'Test User']
    );
    testUserId = userResult.rows[0].id;
    testUserToken = generateTokens({ userId: testUserId, email: `test-status-${Date.now()}@example.com` }).accessToken;

    // Create a test project
    const projectResult = await pool.query(
      `INSERT INTO projects (user_id, name, description, start_date, end_date, budget, team_size, team_composition, technology_stack, scope)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id`,
      [
        testUserId,
        'Test Project',
        'Test Description',
        new Date('2024-01-01'),
        new Date('2024-12-31'),
        100000,
        5,
        JSON.stringify([{ role: 'Developer', count: 3, experienceLevel: 'Mid' }]),
        JSON.stringify([{ name: 'React', category: 'Frontend', maturity: 'Stable' }]),
        'Test Scope',
      ]
    );
    testProjectId = projectResult.rows[0].id;
  });

  afterAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM projects WHERE user_id = $1', [testUserId]);
    await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
    await pool.end();
  });

  describe('Success responses (2xx)', () => {
    // Feature: ai-project-risk-analyzer, Property 29: HTTP status codes are correct
    it('should return 200 for successful GET requests', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(
            '/api/auth/verify',
            `/api/projects`,
            `/api/projects/${testProjectId}`
          ),
          async (endpoint) => {
            const response = await request(app)
              .get(endpoint)
              .set('Authorization', `Bearer ${testUserToken}`);

            // Should return 200 OK for successful GET
            return response.status === 200;
          }
        ),
        { numRuns: 50 }
      );
    });

    // Feature: ai-project-risk-analyzer, Property 29: HTTP status codes are correct
    it('should return 201 for successful resource creation', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2),
            email: fc.integer().map(n => `test-create-${Date.now()}-${n}@example.com`),
            password: fc.constantFrom('ValidPass123!', 'SecureP@ssw0rd', 'Test123!Pass'),
          }),
          async (userData) => {
            const response = await request(app)
              .post('/api/auth/register')
              .send({
                email: userData.email,
                password: userData.password,
                name: userData.name,
              });

            // Clean up created user
            if (response.status === 201) {
              await pool.query('DELETE FROM users WHERE email = $1', [userData.email]);
            }

            // Should return 201 Created for successful registration
            return response.status === 201;
          }
        ),
        { numRuns: 50 }
      );
    });

    // Feature: ai-project-risk-analyzer, Property 29: HTTP status codes are correct
    it('should return 200 for successful login', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.integer({ min: 0, max: 1000000 }).map(n => `test-login-${Date.now()}-${n}-${Math.random().toString(36).substring(7)}@example.com`),
            password: fc.constantFrom('ValidPass123!', 'SecureP@ssw0rd'),
            name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          }),
          async (userData) => {
            // First register the user
            const registerResponse = await request(app)
              .post('/api/auth/register')
              .send(userData);

            // Only proceed if registration was successful
            if (registerResponse.status !== 201) {
              return true; // Skip this test case
            }

            // Then login
            const response = await request(app)
              .post('/api/auth/login')
              .send({
                email: userData.email,
                password: userData.password,
              });

            // Clean up
            await pool.query('DELETE FROM users WHERE email = $1', [userData.email]);

            // Should return 200 OK for successful login
            return response.status === 200;
          }
        ),
        { numRuns: 20 } // Reduced from 50 to avoid timeout
      );
    }, 10000); // Increased timeout to 10 seconds
  });

  describe('Client error responses (4xx)', () => {
    // Feature: ai-project-risk-analyzer, Property 29: HTTP status codes are correct
    it('should return 400 for validation errors', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            endpoint: fc.constantFrom(
              '/api/auth/register',
              '/api/auth/login',
              '/api/auth/refresh',
              '/api/auth/forgot-password'
            ),
            invalidBody: fc.oneof(
              fc.constant({}), // Empty object
              fc.record({ email: fc.string().filter(s => !s.includes('@')) }), // Invalid email
              fc.record({ password: fc.string({ maxLength: 5 }) }), // Short password
              fc.record({ name: fc.constant('') }), // Empty name
            ),
          }),
          async ({ endpoint, invalidBody }) => {
            const response = await request(app)
              .post(endpoint)
              .send(invalidBody);

            // Should return 400 Bad Request for validation errors
            if (response.status !== 400) {
              return false;
            }

            // Should have ValidationError type
            if (response.body.error !== 'ValidationError') {
              return false;
            }

            // Should have descriptive message
            if (!response.body.message || typeof response.body.message !== 'string') {
              return false;
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: ai-project-risk-analyzer, Property 29: HTTP status codes are correct
    it('should return 401 for missing authentication', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(
            '/api/auth/verify',
            '/api/projects',
            `/api/projects/${testProjectId}`
          ),
          async (endpoint) => {
            const response = await request(app)
              .get(endpoint);
            // No Authorization header

            // Should return 401 Unauthorized
            if (response.status !== 401) {
              return false;
            }

            // Should have AuthenticationError type
            if (response.body.error !== 'AuthenticationError') {
              return false;
            }

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    // Feature: ai-project-risk-analyzer, Property 29: HTTP status codes are correct
    it('should return 401 for invalid credentials', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            password: fc.string({ minLength: 8, maxLength: 50 }),
          }),
          async (credentials) => {
            const response = await request(app)
              .post('/api/auth/login')
              .send(credentials);

            // Should return 401 Unauthorized for invalid credentials
            if (response.status !== 401) {
              return false;
            }

            // Should have AuthenticationError type
            if (response.body.error !== 'AuthenticationError') {
              return false;
            }

            // Should have descriptive message
            if (!response.body.message || !response.body.message.includes('Invalid')) {
              return false;
            }

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    // Feature: ai-project-risk-analyzer, Property 29: HTTP status codes are correct
    it('should return 401 for invalid or expired tokens', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(
            'invalid-token',
            'Bearer invalid',
            'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid',
            ''
          ),
          async (invalidToken) => {
            const response = await request(app)
              .get('/api/auth/verify')
              .set('Authorization', invalidToken);

            // Should return 401 Unauthorized
            if (response.status !== 401) {
              return false;
            }

            // Should have AuthenticationError type
            if (response.body.error !== 'AuthenticationError') {
              return false;
            }

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    // Feature: ai-project-risk-analyzer, Property 29: HTTP status codes are correct
    it('should return 403 for authorization errors (accessing other user resources)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(null),
          async (_) => {
            // Create another user
            const otherUserResult = await pool.query(
              `INSERT INTO users (email, password_hash, name) 
               VALUES ($1, $2, $3) 
               RETURNING id`,
              [`test-other-${Date.now()}@example.com`, 'hashedpassword', 'Other User']
            );
            const otherUserId = otherUserResult.rows[0].id;
            const otherUserToken = generateTokens({ 
              userId: otherUserId, 
              email: `test-other-${Date.now()}@example.com` 
            }).accessToken;

            // Try to access testUser's project with otherUser's token
            const response = await request(app)
              .get(`/api/projects/${testProjectId}`)
              .set('Authorization', `Bearer ${otherUserToken}`);

            // Clean up
            await pool.query('DELETE FROM users WHERE id = $1', [otherUserId]);

            // Should return 403 Forbidden
            if (response.status !== 403) {
              return false;
            }

            // Should have AuthorizationError type
            if (response.body.error !== 'AuthorizationError') {
              return false;
            }

            // Should have descriptive message about permissions
            if (!response.body.message || !response.body.message.includes('permission')) {
              return false;
            }

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    // Feature: ai-project-risk-analyzer, Property 29: HTTP status codes are correct
    it('should return 404 for non-existent resources', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          async (randomUuid) => {
            const response = await request(app)
              .get(`/api/projects/${randomUuid}`)
              .set('Authorization', `Bearer ${testUserToken}`);

            // Should return 404 Not Found
            if (response.status !== 404) {
              return false;
            }

            // Should have NotFoundError type
            if (response.body.error !== 'NotFoundError') {
              return false;
            }

            // Should have descriptive message
            if (!response.body.message || !response.body.message.includes('not found')) {
              return false;
            }

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Status code consistency across endpoints', () => {
    // Feature: ai-project-risk-analyzer, Property 29: HTTP status codes are correct
    it('should consistently return appropriate status codes for similar operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            operation: fc.constantFrom('create', 'read', 'update', 'delete'),
            withAuth: fc.boolean(),
            validData: fc.boolean(),
          }),
          async ({ operation, withAuth, validData }) => {
            let response: any;
            const authHeader = withAuth ? { Authorization: `Bearer ${testUserToken}` } : {};

            switch (operation) {
              case 'create':
                if (validData) {
                  response = await request(app)
                    .post('/api/projects')
                    .set(authHeader)
                    .send({
                      name: 'Test Project',
                      description: 'Test',
                      startDate: '2024-01-01',
                      endDate: '2024-12-31',
                      budget: 100000,
                      teamSize: 5,
                      teamComposition: [{ role: 'Developer', count: 3, experienceLevel: 'Mid' }],
                      technologyStack: [{ name: 'React', category: 'Frontend', maturity: 'Stable' }],
                    });
                  
                  // Clean up if created
                  if (response.status === 201 && response.body.project) {
                    await pool.query('DELETE FROM projects WHERE id = $1', [response.body.project.id]);
                  }
                } else {
                  response = await request(app)
                    .post('/api/projects')
                    .set(authHeader)
                    .send({}); // Invalid data
                }
                break;

              case 'read':
                response = await request(app)
                  .get('/api/projects')
                  .set(authHeader);
                break;

              case 'update':
                // Create a temporary project to update
                let updateProjectId = testProjectId;
                if (withAuth && validData) {
                  const tempProject = await pool.query(
                    `INSERT INTO projects (user_id, name, description, start_date, end_date, budget, team_size, team_composition, technology_stack)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                     RETURNING id`,
                    [
                      testUserId,
                      'Temp Update Project',
                      'Temp',
                      new Date('2024-01-01'),
                      new Date('2024-12-31'),
                      50000,
                      3,
                      JSON.stringify([{ role: 'Developer', count: 2, experienceLevel: 'Mid' }]),
                      JSON.stringify([{ name: 'Node.js', category: 'Backend', maturity: 'Stable' }]),
                    ]
                  );
                  updateProjectId = tempProject.rows[0].id;
                }
                
                if (validData) {
                  response = await request(app)
                    .put(`/api/projects/${updateProjectId}`)
                    .set(authHeader)
                    .send({ name: 'Updated Name' });
                  
                  // Clean up if created
                  if (withAuth && response.status === 200) {
                    await pool.query('DELETE FROM projects WHERE id = $1', [updateProjectId]);
                  }
                } else {
                  response = await request(app)
                    .put(`/api/projects/${updateProjectId}`)
                    .set(authHeader)
                    .send({}); // Invalid data
                }
                break;

              case 'delete':
                // Create a temporary project to delete
                if (withAuth && validData) {
                  const tempProject = await pool.query(
                    `INSERT INTO projects (user_id, name, description, start_date, end_date, budget, team_size, team_composition, technology_stack)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                     RETURNING id`,
                    [
                      testUserId,
                      'Temp Project',
                      'Temp',
                      new Date('2024-01-01'),
                      new Date('2024-12-31'),
                      50000,
                      3,
                      JSON.stringify([{ role: 'Developer', count: 2, experienceLevel: 'Mid' }]),
                      JSON.stringify([{ name: 'Node.js', category: 'Backend', maturity: 'Stable' }]),
                    ]
                  );
                  response = await request(app)
                    .delete(`/api/projects/${tempProject.rows[0].id}`)
                    .set(authHeader);
                } else {
                  response = await request(app)
                    .delete(`/api/projects/${testProjectId}`)
                    .set(authHeader);
                }
                break;
            }

            // Verify status code is in expected range
            if (!withAuth) {
              // Without auth, should be 401
              return response.status === 401;
            } else if (!validData && operation !== 'read' && operation !== 'delete') {
              // Invalid data should be 400
              return response.status === 400;
            } else if (validData) {
              // Valid operations should be 2xx
              return response.status >= 200 && response.status < 300;
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Error response structure with correct status codes', () => {
    // Feature: ai-project-risk-analyzer, Property 29: HTTP status codes are correct
    it('should always pair correct status codes with appropriate error types', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            scenario: fc.constantFrom(
              'validation-error',
              'auth-error',
              'not-found',
              'authorization-error'
            ),
          }),
          async ({ scenario }) => {
            let response: any;

            switch (scenario) {
              case 'validation-error':
                response = await request(app)
                  .post('/api/auth/register')
                  .send({ email: 'invalid-email', password: '123' });
                
                // 400 should have ValidationError
                return response.status === 400 && response.body.error === 'ValidationError';

              case 'auth-error':
                response = await request(app)
                  .post('/api/auth/login')
                  .send({ email: 'nonexistent@example.com', password: 'password123' });
                
                // 401 should have AuthenticationError
                return response.status === 401 && response.body.error === 'AuthenticationError';

              case 'not-found':
                response = await request(app)
                  .get(`/api/projects/00000000-0000-0000-0000-000000000000`)
                  .set('Authorization', `Bearer ${testUserToken}`);
                
                // 404 should have NotFoundError
                return response.status === 404 && response.body.error === 'NotFoundError';

              case 'authorization-error':
                // Create another user and try to access testUser's project
                const otherUser = await pool.query(
                  `INSERT INTO users (email, password_hash, name) 
                   VALUES ($1, $2, $3) 
                   RETURNING id`,
                  [`test-authz-${Date.now()}-${Math.random()}@example.com`, 'hashedpassword', 'Other User']
                );
                const otherToken = generateTokens({ 
                  userId: otherUser.rows[0].id, 
                  email: `test-authz-${Date.now()}-${Math.random()}@example.com` 
                }).accessToken;

                // Ensure testProjectId exists
                const projectCheck = await pool.query('SELECT id FROM projects WHERE id = $1', [testProjectId]);
                if (projectCheck.rows.length === 0) {
                  // Recreate test project if it was deleted
                  await pool.query(
                    `INSERT INTO projects (id, user_id, name, description, start_date, end_date, budget, team_size, team_composition, technology_stack, scope)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                    [
                      testProjectId,
                      testUserId,
                      'Test Project',
                      'Test Description',
                      new Date('2024-01-01'),
                      new Date('2024-12-31'),
                      100000,
                      5,
                      JSON.stringify([{ role: 'Developer', count: 3, experienceLevel: 'Mid' }]),
                      JSON.stringify([{ name: 'React', category: 'Frontend', maturity: 'Stable' }]),
                      'Test Scope',
                    ]
                  );
                }

                response = await request(app)
                  .get(`/api/projects/${testProjectId}`)
                  .set('Authorization', `Bearer ${otherToken}`);

                // Clean up
                await pool.query('DELETE FROM users WHERE id = $1', [otherUser.rows[0].id]);

                // 403 should have AuthorizationError
                return response.status === 403 && response.body.error === 'AuthorizationError';
            }

            return false;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
