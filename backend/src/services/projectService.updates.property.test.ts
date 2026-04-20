import fc from 'fast-check';
import dotenv from 'dotenv';
import { pool } from '../config/database';
import { createProject, updateProject, getProjectById, CreateProjectDTO, UpdateProjectDTO } from './projectService';

// Load environment variables
dotenv.config();

/**
 * Property-Based Tests for Project Updates
 * Feature: ai-project-risk-analyzer, Property 7: Project updates are persisted
 * Validates: Requirements 2.2
 */

describe('Property 7: Project updates are persisted', () => {
  let testUserId: string;

  beforeAll(async () => {
    // Create a test user for project ownership
    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, name) 
       VALUES ($1, $2, $3) 
       RETURNING id`,
      [`test-updates-${Date.now()}@example.com`, 'hashedpassword', 'Test User']
    );
    testUserId = userResult.rows[0].id;
  });

  afterAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM projects WHERE user_id = $1', [testUserId]);
    await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
    // Don't end the pool here - let Jest handle cleanup
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
    name: fc.constantFrom('React', 'Node.js', 'PostgreSQL', 'Docker', 'TypeScript', 'Python'),
    category: fc.constantFrom('Frontend', 'Backend', 'Database', 'DevOps', 'Other') as fc.Arbitrary<'Frontend' | 'Backend' | 'Database' | 'DevOps' | 'Other'>,
    maturity: fc.constantFrom('Stable', 'Emerging', 'Experimental') as fc.Arbitrary<'Stable' | 'Emerging' | 'Experimental'>,
  });

  const validProjectDataGen = fc.record({
    name: fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length >= 2),
    description: fc.string({ minLength: 0, maxLength: 500 }),
    startDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2029-12-31') }).filter(d => !isNaN(d.getTime())),
    daysToEnd: fc.integer({ min: 1, max: 365 }),
    budget: fc.double({ min: 1000, max: 1000000, noNaN: true }),
    teamSize: fc.integer({ min: 1, max: 50 }),
    teamComposition: fc.array(validTeamMemberGen, { minLength: 1, maxLength: 5 }),
    technologyStack: fc.array(validTechnologyGen, { minLength: 1, maxLength: 10 }),
    scope: fc.string({ minLength: 0, maxLength: 1000 }),
  });

  // Feature: ai-project-risk-analyzer, Property 7: Project updates are persisted
  it('should persist project name updates and update timestamp', async () => {
    await fc.assert(
      fc.asyncProperty(
        validProjectDataGen,
        fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length >= 2),
        async (initialData, newName) => {
          // Create initial project
          const endDate = new Date(initialData.startDate);
          endDate.setDate(endDate.getDate() + initialData.daysToEnd);

          const projectData: CreateProjectDTO = {
            name: initialData.name,
            description: initialData.description,
            startDate: initialData.startDate,
            endDate: endDate,
            budget: initialData.budget,
            teamSize: initialData.teamSize,
            teamComposition: initialData.teamComposition,
            technologyStack: initialData.technologyStack,
            scope: initialData.scope,
          };

          const createdProject = await createProject(testUserId, projectData);
          const originalUpdatedAt = createdProject.updatedAt;

          // Wait to ensure timestamp difference (increased to 100ms for reliability)
          await new Promise(resolve => setTimeout(resolve, 100));

          // Update the project name
          const updates: UpdateProjectDTO = { name: newName };
          await updateProject(createdProject.id, testUserId, updates);

          // Verify the update was persisted
          const retrievedProject = await getProjectById(createdProject.id, testUserId);

          // Check that name was updated
          if (retrievedProject.name !== newName.trim()) {
            return false;
          }

          // Check that updated_at timestamp was changed
          if (retrievedProject.updatedAt <= originalUpdatedAt) {
            return false;
          }

          // Check that other fields remained unchanged
          if (retrievedProject.description !== createdProject.description) {
            return false;
          }

          if (retrievedProject.budget !== createdProject.budget) {
            return false;
          }

          return true;
        }
      ),
      { numRuns: 50, timeout: 30000 }
    );
  }, 35000);

  // Feature: ai-project-risk-analyzer, Property 7: Project updates are persisted
  it('should persist budget updates and update timestamp', async () => {
    await fc.assert(
      fc.asyncProperty(
        validProjectDataGen,
        fc.double({ min: 1000, max: 1000000, noNaN: true }),
        async (initialData, newBudget) => {
          // Create initial project
          const endDate = new Date(initialData.startDate);
          endDate.setDate(endDate.getDate() + initialData.daysToEnd);

          const projectData: CreateProjectDTO = {
            name: initialData.name,
            description: initialData.description,
            startDate: initialData.startDate,
            endDate: endDate,
            budget: initialData.budget,
            teamSize: initialData.teamSize,
            teamComposition: initialData.teamComposition,
            technologyStack: initialData.technologyStack,
            scope: initialData.scope,
          };

          const createdProject = await createProject(testUserId, projectData);
          const originalUpdatedAt = createdProject.updatedAt;

          // Wait to ensure timestamp difference (increased to 100ms for reliability)
          await new Promise(resolve => setTimeout(resolve, 100));

          // Update the project budget
          const updates: UpdateProjectDTO = { budget: newBudget };
          await updateProject(createdProject.id, testUserId, updates);

          // Verify the update was persisted
          const retrievedProject = await getProjectById(createdProject.id, testUserId);

          // Check that budget was updated
          if (Math.abs(retrievedProject.budget - newBudget) > 0.01) {
            return false;
          }

          // Check that updated_at timestamp was changed
          if (retrievedProject.updatedAt <= originalUpdatedAt) {
            return false;
          }

          return true;
        }
      ),
      { numRuns: 50, timeout: 30000 }
    );
  }, 35000);

  // Feature: ai-project-risk-analyzer, Property 7: Project updates are persisted
  it('should persist date updates when valid and update timestamp', async () => {
    await fc.assert(
      fc.asyncProperty(
        validProjectDataGen,
        fc.integer({ min: 1, max: 365 }),
        async (initialData, newDaysToEnd) => {
          // Create initial project
          const endDate = new Date(initialData.startDate);
          endDate.setDate(endDate.getDate() + initialData.daysToEnd);

          const projectData: CreateProjectDTO = {
            name: initialData.name,
            description: initialData.description,
            startDate: initialData.startDate,
            endDate: endDate,
            budget: initialData.budget,
            teamSize: initialData.teamSize,
            teamComposition: initialData.teamComposition,
            technologyStack: initialData.technologyStack,
            scope: initialData.scope,
          };

          const createdProject = await createProject(testUserId, projectData);
          const originalUpdatedAt = createdProject.updatedAt;

          // Wait to ensure timestamp difference (increased to 100ms for reliability)
          await new Promise(resolve => setTimeout(resolve, 100));

          // Update the end date
          const newEndDate = new Date(initialData.startDate);
          newEndDate.setDate(newEndDate.getDate() + newDaysToEnd);

          const updates: UpdateProjectDTO = { endDate: newEndDate };
          await updateProject(createdProject.id, testUserId, updates);

          // Verify the update was persisted
          const retrievedProject = await getProjectById(createdProject.id, testUserId);

          // Check that end date was updated
          // PostgreSQL stores dates without time, so we need to compare date strings
          const retrievedEndDateStr = new Date(retrievedProject.endDate).toISOString().split('T')[0];
          const expectedEndDateStr = newEndDate.toISOString().split('T')[0];
          
          if (retrievedEndDateStr !== expectedEndDateStr) {
            return false;
          }

          // Check that updated_at timestamp was changed
          if (retrievedProject.updatedAt <= originalUpdatedAt) {
            return false;
          }

          return true;
        }
      ),
      { numRuns: 50, timeout: 30000 }
    );
  }, 35000);

  // Feature: ai-project-risk-analyzer, Property 7: Project updates are persisted
  it('should persist team composition updates and update timestamp', async () => {
    await fc.assert(
      fc.asyncProperty(
        validProjectDataGen,
        fc.array(validTeamMemberGen, { minLength: 1, maxLength: 5 }),
        async (initialData, newTeamComposition) => {
          // Create initial project
          const endDate = new Date(initialData.startDate);
          endDate.setDate(endDate.getDate() + initialData.daysToEnd);

          const projectData: CreateProjectDTO = {
            name: initialData.name,
            description: initialData.description,
            startDate: initialData.startDate,
            endDate: endDate,
            budget: initialData.budget,
            teamSize: initialData.teamSize,
            teamComposition: initialData.teamComposition,
            technologyStack: initialData.technologyStack,
            scope: initialData.scope,
          };

          const createdProject = await createProject(testUserId, projectData);
          const originalUpdatedAt = createdProject.updatedAt;

          // Wait to ensure timestamp difference (increased to 100ms for reliability)
          await new Promise(resolve => setTimeout(resolve, 100));

          // Update the team composition
          const updates: UpdateProjectDTO = { teamComposition: newTeamComposition };
          await updateProject(createdProject.id, testUserId, updates);

          // Verify the update was persisted
          const retrievedProject = await getProjectById(createdProject.id, testUserId);

          // Check that team composition was updated
          if (JSON.stringify(retrievedProject.teamComposition) !== JSON.stringify(newTeamComposition)) {
            return false;
          }

          // Check that updated_at timestamp was changed
          if (retrievedProject.updatedAt <= originalUpdatedAt) {
            return false;
          }

          return true;
        }
      ),
      { numRuns: 50, timeout: 30000 }
    );
  }, 35000);

  // Feature: ai-project-risk-analyzer, Property 7: Project updates are persisted
  it('should persist technology stack updates and update timestamp', async () => {
    await fc.assert(
      fc.asyncProperty(
        validProjectDataGen,
        fc.array(validTechnologyGen, { minLength: 1, maxLength: 10 }),
        async (initialData, newTechnologyStack) => {
          // Create initial project
          const endDate = new Date(initialData.startDate);
          endDate.setDate(endDate.getDate() + initialData.daysToEnd);

          const projectData: CreateProjectDTO = {
            name: initialData.name,
            description: initialData.description,
            startDate: initialData.startDate,
            endDate: endDate,
            budget: initialData.budget,
            teamSize: initialData.teamSize,
            teamComposition: initialData.teamComposition,
            technologyStack: initialData.technologyStack,
            scope: initialData.scope,
          };

          const createdProject = await createProject(testUserId, projectData);
          const originalUpdatedAt = createdProject.updatedAt;

          // Wait to ensure timestamp difference (increased to 100ms for reliability)
          await new Promise(resolve => setTimeout(resolve, 100));

          // Update the technology stack
          const updates: UpdateProjectDTO = { technologyStack: newTechnologyStack };
          await updateProject(createdProject.id, testUserId, updates);

          // Verify the update was persisted
          const retrievedProject = await getProjectById(createdProject.id, testUserId);

          // Check that technology stack was updated
          if (JSON.stringify(retrievedProject.technologyStack) !== JSON.stringify(newTechnologyStack)) {
            return false;
          }

          // Check that updated_at timestamp was changed
          if (retrievedProject.updatedAt <= originalUpdatedAt) {
            return false;
          }

          return true;
        }
      ),
      { numRuns: 50, timeout: 30000 }
    );
  }, 35000);

  // Feature: ai-project-risk-analyzer, Property 7: Project updates are persisted
  it('should persist multiple field updates simultaneously and update timestamp', async () => {
    await fc.assert(
      fc.asyncProperty(
        validProjectDataGen,
        fc.record({
          name: fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length >= 2),
          description: fc.string({ minLength: 0, maxLength: 500 }),
          budget: fc.double({ min: 1000, max: 1000000, noNaN: true }),
          scope: fc.string({ minLength: 0, maxLength: 1000 }),
        }),
        async (initialData, updates) => {
          // Create initial project
          const endDate = new Date(initialData.startDate);
          endDate.setDate(endDate.getDate() + initialData.daysToEnd);

          const projectData: CreateProjectDTO = {
            name: initialData.name,
            description: initialData.description,
            startDate: initialData.startDate,
            endDate: endDate,
            budget: initialData.budget,
            teamSize: initialData.teamSize,
            teamComposition: initialData.teamComposition,
            technologyStack: initialData.technologyStack,
            scope: initialData.scope,
          };

          const createdProject = await createProject(testUserId, projectData);
          const originalUpdatedAt = createdProject.updatedAt;

          // Wait to ensure timestamp difference (increased to 100ms for reliability)
          await new Promise(resolve => setTimeout(resolve, 100));

          // Update multiple fields
          const updateData: UpdateProjectDTO = {
            name: updates.name,
            description: updates.description,
            budget: updates.budget,
            scope: updates.scope,
          };

          await updateProject(createdProject.id, testUserId, updateData);

          // Verify the updates were persisted
          const retrievedProject = await getProjectById(createdProject.id, testUserId);

          // Check that all fields were updated
          if (retrievedProject.name !== updates.name.trim()) {
            return false;
          }

          if (retrievedProject.description !== (updates.description.trim() || null)) {
            return false;
          }

          if (Math.abs(retrievedProject.budget - updates.budget) > 0.01) {
            return false;
          }

          if (retrievedProject.scope !== (updates.scope.trim() || null)) {
            return false;
          }

          // Check that updated_at timestamp was changed
          if (retrievedProject.updatedAt <= originalUpdatedAt) {
            return false;
          }

          return true;
        }
      ),
      { numRuns: 50, timeout: 30000 }
    );
  }, 35000);

  // Feature: ai-project-risk-analyzer, Property 7: Project updates are persisted
  it('should maintain data consistency across multiple sequential updates', async () => {
    await fc.assert(
      fc.asyncProperty(
        validProjectDataGen,
        fc.array(
          fc.record({
            name: fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length >= 2),
            budget: fc.double({ min: 1000, max: 1000000, noNaN: true }),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        async (initialData, updateSequence) => {
          // Create initial project
          const endDate = new Date(initialData.startDate);
          endDate.setDate(endDate.getDate() + initialData.daysToEnd);

          const projectData: CreateProjectDTO = {
            name: initialData.name,
            description: initialData.description,
            startDate: initialData.startDate,
            endDate: endDate,
            budget: initialData.budget,
            teamSize: initialData.teamSize,
            teamComposition: initialData.teamComposition,
            technologyStack: initialData.technologyStack,
            scope: initialData.scope,
          };

          const createdProject = await createProject(testUserId, projectData);
          let previousUpdatedAt = createdProject.updatedAt;

          // Apply updates sequentially
          for (const update of updateSequence) {
            await new Promise(resolve => setTimeout(resolve, 100));

            const updateData: UpdateProjectDTO = {
              name: update.name,
              budget: update.budget,
            };

            await updateProject(createdProject.id, testUserId, updateData);

            // Verify each update was persisted
            const retrievedProject = await getProjectById(createdProject.id, testUserId);

            if (retrievedProject.name !== update.name.trim()) {
              return false;
            }

            if (Math.abs(retrievedProject.budget - update.budget) > 0.01) {
              return false;
            }

            // Check that updated_at timestamp increased
            if (retrievedProject.updatedAt <= previousUpdatedAt) {
              return false;
            }

            previousUpdatedAt = retrievedProject.updatedAt;
          }

          return true;
        }
      ),
      { numRuns: 20, timeout: 60000 }
    );
  }, 65000);
});
