import fc from 'fast-check';
import request from 'supertest';
import dotenv from 'dotenv';
import app from '../index';

// Load environment variables
dotenv.config();

/**
 * Property-Based Tests for API Error Responses
 * Feature: ai-project-risk-analyzer, Property 31: Malformed requests return descriptive errors
 * Validates: Requirements 10.4, 10.5
 */

describe('Property 31: Malformed requests return descriptive errors', () => {
  describe('Invalid JSON payloads', () => {
    // Feature: ai-project-risk-analyzer, Property 31: Malformed requests return descriptive errors
    it('should return 400 with descriptive error for malformed JSON', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(
            '/api/auth/register',
            '/api/auth/login',
            '/api/auth/refresh',
            '/api/auth/forgot-password',
            '/api/auth/reset-password'
          ),
          fc.constantFrom(
            '{invalid json}',
            '{"unclosed": "object"',
            '{"trailing": "comma",}',
            'not json at all',
            '{"nested": {"broken": }',
            '["array", "with", "error"',
            '{key: "no quotes"}',
            '{"number": 123abc}',
            ''
          ),
          async (endpoint, malformedJson) => {
            const response = await request(app)
              .post(endpoint)
              .set('Content-Type', 'application/json')
              .send(malformedJson);

            // Should return 400 Bad Request
            if (response.status !== 400) {
              return false;
            }

            // Response should be JSON
            if (!response.type.includes('json')) {
              return false;
            }

            // Should have error field
            if (!response.body.error) {
              return false;
            }

            // Should have descriptive message
            if (!response.body.message || typeof response.body.message !== 'string') {
              return false;
            }

            // Should have timestamp
            if (!response.body.timestamp) {
              return false;
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Missing required fields', () => {
    // Feature: ai-project-risk-analyzer, Property 31: Malformed requests return descriptive errors
    it('should return 400 with field-specific error for missing email in registration', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 8, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          async (password, name) => {
            const response = await request(app)
              .post('/api/auth/register')
              .send({ password, name }); // Missing email

            // Should return 400 Bad Request
            if (response.status !== 400) {
              return false;
            }

            // Should have ValidationError
            if (response.body.error !== 'ValidationError') {
              return false;
            }

            // Should have descriptive message mentioning email
            if (!response.body.message || !response.body.message.toLowerCase().includes('email')) {
              return false;
            }

            // Should identify the field
            if (response.body.field !== 'email') {
              return false;
            }

            // Should have timestamp
            if (!response.body.timestamp) {
              return false;
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: ai-project-risk-analyzer, Property 31: Malformed requests return descriptive errors
    it('should return 400 with field-specific error for missing password in login', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          async (email) => {
            const response = await request(app)
              .post('/api/auth/login')
              .send({ email }); // Missing password

            // Should return 400 Bad Request
            if (response.status !== 400) {
              return false;
            }

            // Should have ValidationError
            if (response.body.error !== 'ValidationError') {
              return false;
            }

            // Should have descriptive message mentioning password
            if (!response.body.message || !response.body.message.toLowerCase().includes('password')) {
              return false;
            }

            // Should identify the field
            if (response.body.field !== 'password') {
              return false;
            }

            // Should have timestamp
            if (!response.body.timestamp) {
              return false;
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: ai-project-risk-analyzer, Property 31: Malformed requests return descriptive errors
    it('should return 400 with field-specific error for missing refresh token', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant({}), // Empty object
          async (emptyBody) => {
            const response = await request(app)
              .post('/api/auth/refresh')
              .send(emptyBody);

            // Should return 400 Bad Request
            if (response.status !== 400) {
              return false;
            }

            // Should have ValidationError
            if (response.body.error !== 'ValidationError') {
              return false;
            }

            // Should have descriptive message
            if (!response.body.message || typeof response.body.message !== 'string') {
              return false;
            }

            // Should identify the field
            if (response.body.field !== 'refreshToken') {
              return false;
            }

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Invalid field formats', () => {
    // Feature: ai-project-risk-analyzer, Property 31: Malformed requests return descriptive errors
    it('should return 400 with descriptive error for invalid email format', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('@') && !s.includes('.')),
          fc.string({ minLength: 8, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          async (invalidEmail, password, name) => {
            const response = await request(app)
              .post('/api/auth/register')
              .send({ email: invalidEmail, password, name });

            // Should return 400 Bad Request
            if (response.status !== 400) {
              return false;
            }

            // Should have ValidationError
            if (response.body.error !== 'ValidationError') {
              return false;
            }

            // Should have descriptive message about email
            if (!response.body.message || !response.body.message.toLowerCase().includes('email')) {
              return false;
            }

            // Should identify the email field
            if (response.body.field !== 'email') {
              return false;
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: ai-project-risk-analyzer, Property 31: Malformed requests return descriptive errors
    it('should return 400 with descriptive error for short password', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 1, maxLength: 7 }), // Too short
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          async (email, shortPassword, name) => {
            const response = await request(app)
              .post('/api/auth/register')
              .send({ email, password: shortPassword, name });

            // Should return 400 Bad Request
            if (response.status !== 400) {
              return false;
            }

            // Should have ValidationError
            if (response.body.error !== 'ValidationError') {
              return false;
            }

            // Should have descriptive message about password length
            if (!response.body.message || !response.body.message.toLowerCase().includes('password')) {
              return false;
            }

            // Should mention the minimum length requirement
            if (!response.body.message.includes('8')) {
              return false;
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: ai-project-risk-analyzer, Property 31: Malformed requests return descriptive errors
    it('should return 400 with descriptive error for empty or whitespace-only name', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 8, maxLength: 50 }),
          fc.constantFrom('', '   ', '\t', '\n', '  \t  '),
          async (email, password, emptyName) => {
            const response = await request(app)
              .post('/api/auth/register')
              .send({ email, password, name: emptyName });

            // Should return 400 Bad Request
            if (response.status !== 400) {
              return false;
            }

            // Should have ValidationError
            if (response.body.error !== 'ValidationError') {
              return false;
            }

            // Should have descriptive message about name
            if (!response.body.message || !response.body.message.toLowerCase().includes('name')) {
              return false;
            }

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Invalid authentication', () => {
    // Feature: ai-project-risk-analyzer, Property 31: Malformed requests return descriptive errors
    it('should return 401 with descriptive error for missing authentication header', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(null),
          async (_) => {
            const response = await request(app)
              .get('/api/auth/verify');
            // No Authorization header

            // Should return 401 Unauthorized
            if (response.status !== 401) {
              return false;
            }

            // Should have AuthenticationError
            if (response.body.error !== 'AuthenticationError') {
              return false;
            }

            // Should have descriptive message
            if (!response.body.message || typeof response.body.message !== 'string') {
              return false;
            }

            // Should have timestamp
            if (!response.body.timestamp) {
              return false;
            }

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    // Feature: ai-project-risk-analyzer, Property 31: Malformed requests return descriptive errors
    it('should return 401 with descriptive error for invalid token format', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(
            'invalid-token',
            'Bearer',
            'Bearer ',
            'NotBearer token123',
            'Bearer invalid.token.format',
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

            // Should have AuthenticationError
            if (response.body.error !== 'AuthenticationError') {
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
  });

  describe('Error response structure consistency', () => {
    // Feature: ai-project-risk-analyzer, Property 31: Malformed requests return descriptive errors
    it('should always return consistent error structure for any malformed request', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            endpoint: fc.constantFrom(
              '/api/auth/register',
              '/api/auth/login',
              '/api/auth/refresh',
              '/api/auth/forgot-password',
              '/api/auth/reset-password'
            ),
            body: fc.oneof(
              fc.constant({}), // Empty object
              fc.record({ email: fc.string() }), // Missing other fields
              fc.record({ password: fc.string() }), // Missing other fields
              fc.record({ 
                email: fc.string().filter(s => !s.includes('@')), 
                password: fc.string({ maxLength: 5 }),
                name: fc.string()
              }), // Invalid formats
            ),
          }),
          async ({ endpoint, body }) => {
            const response = await request(app)
              .post(endpoint)
              .send(body);

            // Should return 400 or 401
            if (response.status !== 400 && response.status !== 401) {
              return false;
            }

            // Must have error field
            if (!response.body.error || typeof response.body.error !== 'string') {
              return false;
            }

            // Must have message field
            if (!response.body.message || typeof response.body.message !== 'string') {
              return false;
            }

            // Must have timestamp field in ISO format
            if (!response.body.timestamp) {
              return false;
            }

            // Timestamp should be valid ISO 8601
            const timestamp = new Date(response.body.timestamp);
            if (isNaN(timestamp.getTime())) {
              return false;
            }

            // Error type should be one of the expected types
            const validErrorTypes = ['ValidationError', 'AuthenticationError', 'ServerError'];
            if (!validErrorTypes.includes(response.body.error)) {
              return false;
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
