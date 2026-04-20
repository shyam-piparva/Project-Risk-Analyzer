import fc from 'fast-check';
import dotenv from 'dotenv';
import { pool } from '../config/database';
import { createProject, getProjectById, CreateProjectDTO } from './projectService';

// Load environment variables
dotenv.config();

/**
 * Property-Based Tests for Project Data Persistence
 * Feature: ai-project-risk-analyzer, Property 6: Project data round-trips correctly
 * Validates: Requirements 2.1, 2.7, 2.8, 9.1
 */

describe('Property 6: Project data round-trips correctly', () => {
  let testUserId: string;

  beforeAll(async () => {
    // Create a test user for project ownership
    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, name) 
       VALUES ($1, $2, $3) 
       RETURNING id`,
      [`test-persistence-${Date.now()}@example.com`, 'hashedpassword', 'Test User']
    );
    testUserId = userResult.rows[0].id;
  });

  afterAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM projects WHERE user_id = $1', [testUserId]);
    await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
    await pool.end();
  });

  afterEach(async () => {
    // Clean up projects after each test
    await pool.query('DELETE FROM projects WHERE user_id = $1', [testUserId]);
  });

  // Generators for valid project data
  const validTeamMemberGen = fc.record({
    role: fc.constantFrom('Developer', 'Designer', 'QA Engineer', 'DevOps', 'Product Manager'),
    count: fc.integer({ min: 1, max: 10 }),
    experienceLevel: fc.constantFrom('Junior', 'Mid', 'Senior') as fc.Arbitrary<'Junior' | 'Mid' | 'Senior'>,
  });

  const validTechnologyGen = fc.record({
    name: fc.constantFrom('React', 'Node.js', 'PostgreSQL', 'Docker', 'TypeScript', 'Python', 'Java', 'Go'),
    category: fc.constantFrom('Frontend', 'Backend', 'Database', 'DevOps', 'Other') as fc.Arbitrary<'Frontend' | 'Backend' | 'Database' | 'DevOps' | 'Other'>,
    maturity: fc.constantFrom('Stable', 'Emerging', 'Experimental') as fc.Arbitrary<'Stable' | 'Emerging' | 'Experimental'>,
  });

  const validProjectDataGen = fc.record({
    name: fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length >= 2),
    description: fc.option(fc.string({ minLength: 0, maxLength: 500 }), { nil: undefined }),
    startDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2029-12-31') }).filter(d => !isNaN(d.getTime())),
    daysToEnd: fc.integer({ min: 1, max: 365 }),
    budget: fc.double({ min: 1000, max: 1000000, noNaN: true }),
    teamSize: fc.integer({ min: 1, max: 50 }),
    teamComposition: fc.array(validTeamMemberGen, { minLength: 1, maxLength: 5 }),
    technologyStack: fc.array(validTechnologyGen, { minLength: 1, maxLength: 10 }),
    scope: fc.option(fc.string({ minLength: 0, maxLength: 1000 }), { nil: undefined }),
  });

  // Feature: ai-project-risk-analyzer, Property 6: Project data round-trips correctly
  it('should preserve all project data through create and retrieve', async () => {
    await fc.assert(
      fc.asyncProperty(
        validProjectDataGen,
        async (projectData) => {
          // Calculate end date
          const endDate = new Date(projectData.startDate);
          endDate.setDate(endDate.getDate() + projectData.daysToEnd);

          const createData: CreateProjectDTO = {
            name: projectData.name,
            description: projectData.description,
            startDate: projectData.startDate,
            endDate: endDate,
            budget: projectData.budget,
            teamSize: projectData.teamSize,
            teamComposition: projectData.teamComposition,
            technologyStack: projectData.technologyStack,
            scope: projectData.scope,
          };

          // Create the project
          const created = await createProject(testUserId, createData);

          // Retrieve the project
          const retrieved = await getProjectById(created.id, testUserId);

          // Verify all fields are preserved
          expect(retrieved.name).toBe(projectData.name.trim());
          expect(retrieved.description).toBe(projectData.description?.trim() || null);
          // Use toBeCloseTo for floating point comparison (budget is stored as DECIMAL in DB)
          expect(retrieved.budget).toBeCloseTo(projectData.budget, 2);
          expect(retrieved.teamSize).toBe(projectData.teamSize);
          expect(retrieved.scope).toBe(projectData.scope?.trim() || null);
          expect(retrieved.userId).toBe(testUserId);

          // Verify dates are preserved (normalize to UTC for comparison)
          const retrievedStartUTC = new Date(Date.UTC(
            retrieved.startDate.getFullYear(),
            retrieved.startDate.getMonth(),
            retrieved.startDate.getDate()
          ));
          const expectedStartUTC = new Date(Date.UTC(
            projectData.startDate.getFullYear(),
            projectData.startDate.getMonth(),
            projectData.startDate.getDate()
          ));
          const retrievedEndUTC = new Date(Date.UTC(
            retrieved.endDate.getFullYear(),
            retrieved.endDate.getMonth(),
            retrieved.endDate.getDate()
          ));
          const expectedEndUTC = new Date(Date.UTC(
            endDate.getFullYear(),
            endDate.getMonth(),
            endDate.getDate()
          ));
          
          expect(retrievedStartUTC.getTime()).toBe(expectedStartUTC.getTime());
          expect(retrievedEndUTC.getTime()).toBe(expectedEndUTC.getTime());

          // Verify team composition is preserved
          expect(retrieved.teamComposition).toEqual(projectData.teamComposition);
          expect(retrieved.teamComposition.length).toBe(projectData.teamComposition.length);
          
          for (let i = 0; i < projectData.teamComposition.length; i++) {
            expect(retrieved.teamComposition[i].role).toBe(projectData.teamComposition[i].role);
            expect(retrieved.teamComposition[i].count).toBe(projectData.teamComposition[i].count);
            expect(retrieved.teamComposition[i].experienceLevel).toBe(projectData.teamComposition[i].experienceLevel);
          }

          // Verify technology stack is preserved
          expect(retrieved.technologyStack).toEqual(projectData.technologyStack);
          expect(retrieved.technologyStack.length).toBe(projectData.technologyStack.length);
          
          for (let i = 0; i < projectData.technologyStack.length; i++) {
            expect(retrieved.technologyStack[i].name).toBe(projectData.technologyStack[i].name);
            expect(retrieved.technologyStack[i].category).toBe(projectData.technologyStack[i].category);
            expect(retrieved.technologyStack[i].maturity).toBe(projectData.technologyStack[i].maturity);
          }

          // Verify metadata fields exist
          expect(retrieved.id).toBeDefined();
          expect(retrieved.createdAt).toBeDefined();
          expect(retrieved.updatedAt).toBeDefined();
          expect(retrieved.createdAt).toBeInstanceOf(Date);
          expect(retrieved.updatedAt).toBeInstanceOf(Date);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: ai-project-risk-analyzer, Property 6: Project data round-trips correctly
  it('should handle edge cases: minimal valid project data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.constantFrom('AB', 'XY', '12', 'OK'),
          startDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2029-12-31') }).filter(d => !isNaN(d.getTime())),
          daysToEnd: fc.integer({ min: 1, max: 30 }),
          budget: fc.constantFrom(1000, 5000, 10000),
          teamSize: fc.constantFrom(1, 2, 3),
        }),
        validTeamMemberGen,
        validTechnologyGen,
        async (minimalData, teamMember, technology) => {
          const endDate = new Date(minimalData.startDate);
          endDate.setDate(endDate.getDate() + minimalData.daysToEnd);

          const createData: CreateProjectDTO = {
            name: minimalData.name,
            description: undefined,
            startDate: minimalData.startDate,
            endDate: endDate,
            budget: minimalData.budget,
            teamSize: minimalData.teamSize,
            teamComposition: [teamMember],
            technologyStack: [technology],
            scope: undefined,
          };

          const created = await createProject(testUserId, createData);
          const retrieved = await getProjectById(created.id, testUserId);

          // Verify minimal data is preserved
          expect(retrieved.name).toBe(minimalData.name);
          expect(retrieved.description).toBeNull();
          expect(retrieved.scope).toBeNull();
          expect(retrieved.budget).toBe(minimalData.budget);
          expect(retrieved.teamSize).toBe(minimalData.teamSize);
          expect(retrieved.teamComposition.length).toBe(1);
          expect(retrieved.technologyStack.length).toBe(1);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  // Feature: ai-project-risk-analyzer, Property 6: Project data round-trips correctly
  it('should handle edge cases: maximum length strings', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 90, maxLength: 100 }).filter(s => s.trim().length >= 2),
          description: fc.string({ minLength: 450, maxLength: 500 }),
          scope: fc.string({ minLength: 900, maxLength: 1000 }),
          startDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2029-12-31') }).filter(d => !isNaN(d.getTime())),
          daysToEnd: fc.integer({ min: 1, max: 30 }),
        }),
        validTeamMemberGen,
        validTechnologyGen,
        async (maxData, teamMember, technology) => {
          const endDate = new Date(maxData.startDate);
          endDate.setDate(endDate.getDate() + maxData.daysToEnd);

          const createData: CreateProjectDTO = {
            name: maxData.name,
            description: maxData.description,
            startDate: maxData.startDate,
            endDate: endDate,
            budget: 500000,
            teamSize: 10,
            teamComposition: [teamMember],
            technologyStack: [technology],
            scope: maxData.scope,
          };

          const created = await createProject(testUserId, createData);
          const retrieved = await getProjectById(created.id, testUserId);

          // Verify long strings are preserved
          expect(retrieved.name).toBe(maxData.name.trim());
          expect(retrieved.description).toBe(maxData.description.trim());
          expect(retrieved.scope).toBe(maxData.scope.trim());

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
