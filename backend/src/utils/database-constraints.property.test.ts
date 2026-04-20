import fc from 'fast-check';
import dotenv from 'dotenv';
import { pool } from '../config/database';

// Load environment variables
dotenv.config();

/**
 * Property-Based Tests for Database Constraints
 * Feature: ai-project-risk-analyzer, Property 8: Input validation rejects invalid data
 * Validates: Requirements 2.5, 2.6, 9.2
 */

describe('Property 8: Input validation rejects invalid data', () => {
  let testUserId: string;

  beforeAll(async () => {
    // Create a test user for foreign key constraints
    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, name) 
       VALUES ($1, $2, $3) 
       RETURNING id`,
      ['test@example.com', 'hashedpassword', 'Test User']
    );
    testUserId = userResult.rows[0].id;
  });

  afterAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM users WHERE email = $1', ['test@example.com']);
    await pool.end();
  });

  afterEach(async () => {
    // Clean up projects after each test
    await pool.query('DELETE FROM projects WHERE user_id = $1', [testUserId]);
  });

  describe('Date constraint validation', () => {
    // Feature: ai-project-risk-analyzer, Property 8: Input validation rejects invalid data
    it('should reject projects where end_date is before or equal to start_date', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).filter(d => !isNaN(d.getTime())),
          fc.integer({ min: -365, max: 0 }), // Days offset (negative or zero)
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          fc.double({ min: 1000, max: 1000000, noNaN: true }),
          async (startDate, daysOffset, projectName, budget) => {
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + daysOffset);

            // Attempt to insert project with invalid dates
            try {
              await pool.query(
                `INSERT INTO projects 
                 (user_id, name, description, start_date, end_date, budget, team_size, team_composition, technology_stack) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [
                  testUserId,
                  projectName,
                  'Test project',
                  startDate.toISOString().split('T')[0],
                  endDate.toISOString().split('T')[0],
                  budget,
                  5,
                  JSON.stringify([{ role: 'Developer', count: 3, experienceLevel: 'Mid' }]),
                  JSON.stringify([{ name: 'React', category: 'Frontend', maturity: 'Stable' }])
                ]
              );

              // If we reach here, the insert succeeded when it should have failed
              return false;
            } catch (error: any) {
              // Verify that the error is due to the date constraint
              return error.message.includes('valid_dates') || 
                     error.message.includes('violates check constraint');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: ai-project-risk-analyzer, Property 8: Input validation rejects invalid data
    it('should accept projects where end_date is after start_date', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2029-12-31') }).filter(d => !isNaN(d.getTime())),
          fc.integer({ min: 1, max: 365 }), // Days offset (positive)
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          fc.double({ min: 1000, max: 1000000, noNaN: true }),
          async (startDate, daysOffset, projectName, budget) => {
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + daysOffset);

            try {
              const result = await pool.query(
                `INSERT INTO projects 
                 (user_id, name, description, start_date, end_date, budget, team_size, team_composition, technology_stack) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 RETURNING id`,
                [
                  testUserId,
                  projectName,
                  'Test project',
                  startDate.toISOString().split('T')[0],
                  endDate.toISOString().split('T')[0],
                  budget,
                  5,
                  JSON.stringify([{ role: 'Developer', count: 3, experienceLevel: 'Mid' }]),
                  JSON.stringify([{ name: 'React', category: 'Frontend', maturity: 'Stable' }])
                ]
              );

              // Clean up
              await pool.query('DELETE FROM projects WHERE id = $1', [result.rows[0].id]);
              
              return true;
            } catch (error) {
              // Valid dates should not throw an error
              return false;
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Budget constraint validation', () => {
    // Feature: ai-project-risk-analyzer, Property 8: Input validation rejects invalid data
    it('should reject projects with non-positive budget', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.constant(0),
            fc.double({ min: -1000000, max: -0.01, noNaN: true }),
            fc.constant(-0)
          ),
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          fc.date({ min: new Date('2020-01-01'), max: new Date('2029-12-31') }).filter(d => !isNaN(d.getTime())),
          async (invalidBudget, projectName, startDate) => {
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 30);

            // Normalize -0 to 0 for consistent comparison
            const normalizedBudget = Object.is(invalidBudget, -0) ? 0 : invalidBudget;

            try {
              await pool.query(
                `INSERT INTO projects 
                 (user_id, name, description, start_date, end_date, budget, team_size, team_composition, technology_stack) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [
                  testUserId,
                  projectName,
                  'Test project',
                  startDate.toISOString().split('T')[0],
                  endDate.toISOString().split('T')[0],
                  normalizedBudget,
                  5,
                  JSON.stringify([{ role: 'Developer', count: 3, experienceLevel: 'Mid' }]),
                  JSON.stringify([{ name: 'React', category: 'Frontend', maturity: 'Stable' }])
                ]
              );

              // If we reach here, the insert succeeded when it should have failed
              return false;
            } catch (error: any) {
              // Verify that the error is due to the budget constraint
              return error.message.includes('positive_budget') || 
                     error.message.includes('violates check constraint');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: ai-project-risk-analyzer, Property 8: Input validation rejects invalid data
    it('should accept projects with positive budget', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.double({ min: 0.01, max: 1000000, noNaN: true }),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.date({ min: new Date('2020-01-01'), max: new Date('2029-12-31') }),
          async (validBudget, projectName, startDate) => {
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 30);

            try {
              const result = await pool.query(
                `INSERT INTO projects 
                 (user_id, name, description, start_date, end_date, budget, team_size, team_composition, technology_stack) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 RETURNING id`,
                [
                  testUserId,
                  projectName,
                  'Test project',
                  startDate.toISOString().split('T')[0],
                  endDate.toISOString().split('T')[0],
                  validBudget,
                  5,
                  JSON.stringify([{ role: 'Developer', count: 3, experienceLevel: 'Mid' }]),
                  JSON.stringify([{ name: 'React', category: 'Frontend', maturity: 'Stable' }])
                ]
              );

              // Clean up
              await pool.query('DELETE FROM projects WHERE id = $1', [result.rows[0].id]);
              
              return true;
            } catch (error) {
              // Valid budget should not throw an error
              return false;
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Combined constraint validation', () => {
    // Feature: ai-project-risk-analyzer, Property 8: Input validation rejects invalid data
    it('should reject projects with any invalid constraint', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
            startDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2029-12-31') }).filter(d => !isNaN(d.getTime())),
            daysOffset: fc.integer({ min: -365, max: 365 }),
            budget: fc.double({ min: -100000, max: 1000000, noNaN: true }).filter(b => {
              // Filter out very small positive numbers that are effectively zero
              // PostgreSQL's decimal type has precision limits
              return Math.abs(b) > 0.01 || b === 0 || b < 0;
            }),
          }),
          async (projectData) => {
            const endDate = new Date(projectData.startDate);
            endDate.setDate(endDate.getDate() + projectData.daysOffset);

            const hasInvalidDates = projectData.daysOffset <= 0;
            const hasInvalidBudget = projectData.budget <= 0;
            const shouldFail = hasInvalidDates || hasInvalidBudget;

            try {
              const result = await pool.query(
                `INSERT INTO projects 
                 (user_id, name, description, start_date, end_date, budget, team_size, team_composition, technology_stack) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 RETURNING id`,
                [
                  testUserId,
                  projectData.name,
                  'Test project',
                  projectData.startDate.toISOString().split('T')[0],
                  endDate.toISOString().split('T')[0],
                  projectData.budget,
                  5,
                  JSON.stringify([{ role: 'Developer', count: 3, experienceLevel: 'Mid' }]),
                  JSON.stringify([{ name: 'React', category: 'Frontend', maturity: 'Stable' }])
                ]
              );

              // Clean up if insert succeeded
              await pool.query('DELETE FROM projects WHERE id = $1', [result.rows[0].id]);

              // If we expected failure but succeeded, return false
              return !shouldFail;
            } catch (error: any) {
              // If we expected failure and got an error, verify it's a constraint error
              if (shouldFail) {
                return error.message.includes('violates check constraint') ||
                       error.message.includes('valid_dates') ||
                       error.message.includes('positive_budget');
              }
              // If we didn't expect failure but got an error, return false
              return false;
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
