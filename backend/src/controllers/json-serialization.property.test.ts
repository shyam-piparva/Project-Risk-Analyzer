import fc from 'fast-check';
import request from 'supertest';
import dotenv from 'dotenv';
import app from '../index';
import { pool } from '../config/database';

// Load environment variables
dotenv.config();

/**
 * Property-Based Tests for JSON Serialization
 * Feature: ai-project-risk-analyzer, Property 30: JSON serialization round-trips correctly
 * Validates: Requirements 10.3
 */

describe('Property 30: JSON serialization round-trips correctly', () => {
  let testUserId: string;
  let testUserToken: string;

  beforeAll(async () => {
    // Create a test user and get authentication token
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: `test-json-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        name: 'JSON Test User',
      });

    testUserId = registerResponse.body.user.id;
    testUserToken = registerResponse.body.tokens.accessToken;
  });

  afterAll(async () => {
    // Clean up test user
    if (testUserId) {
      await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
    }
  });

  describe('User data serialization', () => {
    // Feature: ai-project-risk-analyzer, Property 30: JSON serialization round-trips correctly
    it('should serialize and deserialize user registration data correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            password: fc.string({ minLength: 8, maxLength: 50 }).filter(s => s.trim().length >= 8),
            name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          }),
          async (userData) => {
            // Serialize to JSON (happens automatically in HTTP request)
            const response = await request(app)
              .post('/api/auth/register')
              .send(userData);

            // Skip if email already exists or validation fails (expected for some random data)
            if (response.status === 500 && response.body.message?.includes('already registered')) {
              return true;
            }

            // Skip if password validation fails (expected for weak passwords)
            if (response.status === 400 && response.body.message?.includes('Password')) {
              return true;
            }

            // Should successfully deserialize and process
            if (response.status !== 201) {
              return false;
            }

            // Verify response is valid JSON
            if (!response.type.includes('json')) {
              return false;
            }

            // Verify user data round-tripped correctly
            const returnedUser = response.body.user;
            if (!returnedUser) {
              return false;
            }

            // Email should match (case-insensitive)
            if (returnedUser.email.toLowerCase() !== userData.email.toLowerCase()) {
              return false;
            }

            // Name should match (trimmed)
            if (returnedUser.name !== userData.name.trim()) {
              return false;
            }

            // Should have all expected fields
            if (!returnedUser.id || !returnedUser.createdAt || !returnedUser.updatedAt) {
              return false;
            }

            // Clean up created user
            await pool.query('DELETE FROM users WHERE id = $1', [returnedUser.id]);

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Project data serialization', () => {
    // Feature: ai-project-risk-analyzer, Property 30: JSON serialization round-trips correctly
    it('should serialize and deserialize project data with nested structures correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length >= 2),
            description: fc.string({ maxLength: 500 }),
            startDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
            endDate: fc.date({ min: new Date('2026-01-01'), max: new Date('2030-12-31') }),
            budget: fc.float({ min: 1000, max: 10000000, noNaN: true }),
            teamSize: fc.integer({ min: 1, max: 100 }),
            teamComposition: fc.array(
              fc.record({
                role: fc.constantFrom('Developer', 'Designer', 'Manager', 'QA', 'DevOps'),
                count: fc.integer({ min: 1, max: 10 }),
                experienceLevel: fc.constantFrom('Junior', 'Mid', 'Senior'),
              }),
              { minLength: 1, maxLength: 5 }
            ),
            technologyStack: fc.array(
              fc.record({
                name: fc.constantFrom('React', 'Node.js', 'PostgreSQL', 'Docker', 'TypeScript'),
                category: fc.constantFrom('Frontend', 'Backend', 'Database', 'DevOps', 'Other'),
                maturity: fc.constantFrom('Stable', 'Emerging', 'Experimental'),
              }),
              { minLength: 1, maxLength: 5 }
            ),
            scope: fc.string({ maxLength: 1000 }),
          }),
          async (projectData) => {
            // Create project (serialization happens in request)
            const createResponse = await request(app)
              .post('/api/projects')
              .set('Authorization', `Bearer ${testUserToken}`)
              .send(projectData);

            // Skip if validation fails (expected for some edge cases)
            if (createResponse.status === 400) {
              return true;
            }

            if (createResponse.status !== 201) {
              return false;
            }

            // Verify response is valid JSON
            if (!createResponse.type.includes('json')) {
              return false;
            }

            const createdProject = createResponse.body.project;
            if (!createdProject || !createdProject.id) {
              return false;
            }

            // Retrieve project (deserialization happens in response)
            const getResponse = await request(app)
              .get(`/api/projects/${createdProject.id}`)
              .set('Authorization', `Bearer ${testUserToken}`);

            if (getResponse.status !== 200) {
              return false;
            }

            const retrievedProject = getResponse.body.project;

            // Verify all fields round-tripped correctly
            if (retrievedProject.name !== projectData.name) {
              return false;
            }

            if (retrievedProject.description !== projectData.description) {
              return false;
            }

            // Dates should be serialized as ISO strings and deserialize correctly
            const originalStartDate = new Date(projectData.startDate).toISOString().split('T')[0];
            const retrievedStartDate = new Date(retrievedProject.startDate).toISOString().split('T')[0];
            if (originalStartDate !== retrievedStartDate) {
              return false;
            }

            const originalEndDate = new Date(projectData.endDate).toISOString().split('T')[0];
            const retrievedEndDate = new Date(retrievedProject.endDate).toISOString().split('T')[0];
            if (originalEndDate !== retrievedEndDate) {
              return false;
            }

            // Budget should round-trip correctly (allowing for floating point precision)
            if (Math.abs(retrievedProject.budget - projectData.budget) > 0.01) {
              return false;
            }

            if (retrievedProject.teamSize !== projectData.teamSize) {
              return false;
            }

            // Nested arrays should round-trip correctly
            if (!Array.isArray(retrievedProject.teamComposition)) {
              return false;
            }

            if (retrievedProject.teamComposition.length !== projectData.teamComposition.length) {
              return false;
            }

            // Verify team composition structure
            for (let i = 0; i < projectData.teamComposition.length; i++) {
              const original = projectData.teamComposition[i];
              const retrieved = retrievedProject.teamComposition[i];

              if (
                retrieved.role !== original.role ||
                retrieved.count !== original.count ||
                retrieved.experienceLevel !== original.experienceLevel
              ) {
                return false;
              }
            }

            // Verify technology stack structure
            if (!Array.isArray(retrievedProject.technologyStack)) {
              return false;
            }

            if (retrievedProject.technologyStack.length !== projectData.technologyStack.length) {
              return false;
            }

            for (let i = 0; i < projectData.technologyStack.length; i++) {
              const original = projectData.technologyStack[i];
              const retrieved = retrievedProject.technologyStack[i];

              if (
                retrieved.name !== original.name ||
                retrieved.category !== original.category ||
                retrieved.maturity !== original.maturity
              ) {
                return false;
              }
            }

            if (retrievedProject.scope !== projectData.scope) {
              return false;
            }

            // Clean up created project
            await request(app)
              .delete(`/api/projects/${createdProject.id}`)
              .set('Authorization', `Bearer ${testUserToken}`);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: ai-project-risk-analyzer, Property 30: JSON serialization round-trips correctly
    it('should handle special characters and unicode in JSON serialization', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2),
            description: fc.string({ maxLength: 200 }),
            scope: fc.string({ maxLength: 200 }),
          }),
          async (textData) => {
            const projectData = {
              ...textData,
              startDate: new Date('2024-01-01'),
              endDate: new Date('2024-12-31'),
              budget: 50000,
              teamSize: 5,
              teamComposition: [
                { role: 'Developer', count: 3, experienceLevel: 'Mid' as const },
              ],
              technologyStack: [
                { name: 'React', category: 'Frontend' as const, maturity: 'Stable' as const },
              ],
            };

            // Create project with unicode/special characters
            const createResponse = await request(app)
              .post('/api/projects')
              .set('Authorization', `Bearer ${testUserToken}`)
              .send(projectData);

            // Skip if validation fails (expected for some edge cases)
            if (createResponse.status === 400) {
              return true;
            }

            if (createResponse.status !== 201) {
              return false;
            }

            const createdProject = createResponse.body.project;

            // Retrieve and verify special characters preserved
            const getResponse = await request(app)
              .get(`/api/projects/${createdProject.id}`)
              .set('Authorization', `Bearer ${testUserToken}`);

            if (getResponse.status !== 200) {
              return false;
            }

            const retrievedProject = getResponse.body.project;

            // Verify text fields with special characters round-tripped correctly
            if (retrievedProject.name !== textData.name) {
              return false;
            }

            if (retrievedProject.description !== textData.description) {
              return false;
            }

            if (retrievedProject.scope !== textData.scope) {
              return false;
            }

            // Clean up
            await request(app)
              .delete(`/api/projects/${createdProject.id}`)
              .set('Authorization', `Bearer ${testUserToken}`);

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Date serialization', () => {
    // Feature: ai-project-risk-analyzer, Property 30: JSON serialization round-trips correctly
    it('should serialize and deserialize dates consistently across timezones', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
          fc.date({ min: new Date('2026-01-01'), max: new Date('2030-12-31') }),
          async (startDate, endDate) => {
            const projectData = {
              name: 'Date Test Project',
              description: 'Testing date serialization',
              startDate,
              endDate,
              budget: 50000,
              teamSize: 5,
              teamComposition: [
                { role: 'Developer', count: 3, experienceLevel: 'Mid' as const },
              ],
              technologyStack: [
                { name: 'React', category: 'Frontend' as const, maturity: 'Stable' as const },
              ],
              scope: 'Test scope',
            };

            // Create project
            const createResponse = await request(app)
              .post('/api/projects')
              .set('Authorization', `Bearer ${testUserToken}`)
              .send(projectData);

            // Skip if validation fails
            if (createResponse.status === 400) {
              return true;
            }

            if (createResponse.status !== 201) {
              return false;
            }

            const createdProject = createResponse.body.project;

            // Verify dates are serialized as ISO strings
            if (typeof createdProject.startDate !== 'string') {
              return false;
            }

            if (typeof createdProject.endDate !== 'string') {
              return false;
            }

            // Verify dates can be parsed back
            const parsedStartDate = new Date(createdProject.startDate);
            const parsedEndDate = new Date(createdProject.endDate);

            if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
              return false;
            }

            // Verify date values match (comparing date parts only, not time)
            const originalStartDateStr = startDate.toISOString().split('T')[0];
            const parsedStartDateStr = parsedStartDate.toISOString().split('T')[0];

            if (originalStartDateStr !== parsedStartDateStr) {
              return false;
            }

            const originalEndDateStr = endDate.toISOString().split('T')[0];
            const parsedEndDateStr = parsedEndDate.toISOString().split('T')[0];

            if (originalEndDateStr !== parsedEndDateStr) {
              return false;
            }

            // Clean up
            await request(app)
              .delete(`/api/projects/${createdProject.id}`)
              .set('Authorization', `Bearer ${testUserToken}`);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Numeric precision serialization', () => {
    // Feature: ai-project-risk-analyzer, Property 30: JSON serialization round-trips correctly
    it('should preserve numeric precision for budget values', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 999999999 }).map(n => n + Math.random()),
          async (budget) => {
            // Round to 2 decimal places to match database precision
            const roundedBudget = Math.round(budget * 100) / 100;

            const projectData = {
              name: 'Budget Test Project',
              description: 'Testing numeric precision',
              startDate: new Date('2024-01-01'),
              endDate: new Date('2024-12-31'),
              budget: roundedBudget,
              teamSize: 5,
              teamComposition: [
                { role: 'Developer', count: 3, experienceLevel: 'Mid' as const },
              ],
              technologyStack: [
                { name: 'React', category: 'Frontend' as const, maturity: 'Stable' as const },
              ],
              scope: 'Test scope',
            };

            // Create project
            const createResponse = await request(app)
              .post('/api/projects')
              .set('Authorization', `Bearer ${testUserToken}`)
              .send(projectData);

            if (createResponse.status !== 201) {
              return false;
            }

            const createdProject = createResponse.body.project;

            // Verify budget is a number
            if (typeof createdProject.budget !== 'number') {
              return false;
            }

            // Verify precision is preserved (within floating point tolerance)
            if (Math.abs(createdProject.budget - roundedBudget) > 0.01) {
              return false;
            }

            // Retrieve and verify again
            const getResponse = await request(app)
              .get(`/api/projects/${createdProject.id}`)
              .set('Authorization', `Bearer ${testUserToken}`);

            if (getResponse.status !== 200) {
              return false;
            }

            const retrievedProject = getResponse.body.project;

            // Verify budget round-tripped correctly
            if (Math.abs(retrievedProject.budget - roundedBudget) > 0.01) {
              return false;
            }

            // Clean up
            await request(app)
              .delete(`/api/projects/${createdProject.id}`)
              .set('Authorization', `Bearer ${testUserToken}`);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Null and optional field serialization', () => {
    // Feature: ai-project-risk-analyzer, Property 30: JSON serialization round-trips correctly
    it('should handle null and optional fields correctly in JSON serialization', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            includeDescription: fc.boolean(),
            includeScope: fc.boolean(),
          }),
          async ({ includeDescription, includeScope }) => {
            const projectData: any = {
              name: 'Optional Fields Test',
              startDate: new Date('2024-01-01'),
              endDate: new Date('2024-12-31'),
              budget: 50000,
              teamSize: 5,
              teamComposition: [
                { role: 'Developer', count: 3, experienceLevel: 'Mid' as const },
              ],
              technologyStack: [
                { name: 'React', category: 'Frontend' as const, maturity: 'Stable' as const },
              ],
            };

            if (includeDescription) {
              projectData.description = 'Test description';
            }

            if (includeScope) {
              projectData.scope = 'Test scope';
            }

            // Create project
            const createResponse = await request(app)
              .post('/api/projects')
              .set('Authorization', `Bearer ${testUserToken}`)
              .send(projectData);

            if (createResponse.status !== 201) {
              return false;
            }

            const createdProject = createResponse.body.project;

            // Retrieve project
            const getResponse = await request(app)
              .get(`/api/projects/${createdProject.id}`)
              .set('Authorization', `Bearer ${testUserToken}`);

            if (getResponse.status !== 200) {
              return false;
            }

            const retrievedProject = getResponse.body.project;

            // Verify optional fields are handled correctly
            if (includeDescription) {
              if (retrievedProject.description !== projectData.description) {
                return false;
              }
            } else {
              // Should be null or empty string
              if (retrievedProject.description !== null && retrievedProject.description !== '') {
                return false;
              }
            }

            if (includeScope) {
              if (retrievedProject.scope !== projectData.scope) {
                return false;
              }
            } else {
              // Should be null or empty string
              if (retrievedProject.scope !== null && retrievedProject.scope !== '') {
                return false;
              }
            }

            // Clean up
            await request(app)
              .delete(`/api/projects/${createdProject.id}`)
              .set('Authorization', `Bearer ${testUserToken}`);

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
