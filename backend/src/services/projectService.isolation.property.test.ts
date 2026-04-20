import fc from 'fast-check';
import dotenv from 'dotenv';
import { pool } from '../config/database';
import {
  createProject,
  getProjectById,
  getUserProjects,
  updateProject,
  deleteProject,
  CreateProjectDTO,
} from './projectService';

// Load environment variables
dotenv.config();

/**
 * Property-Based Tests for Data Isolation
 * Feature: ai-project-risk-analyzer, Property 5: Data isolation is enforced
 * Validates: Requirements 1.7, 2.3
 */

describe('Property 5: Data isolation is enforced', () => {
  let testUser1Id: string;
  let testUser2Id: string;

  beforeAll(async () => {
    // Create two test users for isolation testing
    const user1Result = await pool.query(
      `INSERT INTO users (email, password_hash, name) 
       VALUES ($1, $2, $3) 
       RETURNING id`,
      [`test-isolation-user1-${Date.now()}@example.com`, 'hashedpassword', 'Test User 1']
    );
    testUser1Id = user1Result.rows[0].id;

    const user2Result = await pool.query(
      `INSERT INTO users (email, password_hash, name) 
       VALUES ($1, $2, $3) 
       RETURNING id`,
      [`test-isolation-user2-${Date.now()}@example.com`, 'hashedpassword', 'Test User 2']
    );
    testUser2Id = user2Result.rows[0].id;
  });

  afterAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM projects WHERE user_id IN ($1, $2)', [testUser1Id, testUser2Id]);
    await pool.query('DELETE FROM users WHERE id IN ($1, $2)', [testUser1Id, testUser2Id]);
    await pool.end();
  });

  afterEach(async () => {
    // Clean up projects after each test
    await pool.query('DELETE FROM projects WHERE user_id IN ($1, $2)', [testUser1Id, testUser2Id]);
  });

  // Generators for valid project data
  const validTeamMemberGen = fc.record({
    role: fc.constantFrom('Developer', 'Designer', 'QA Engineer', 'DevOps', 'Product Manager'),
    count: fc.integer({ min: 1, max: 10 }),
    experienceLevel: fc.constantFrom('Junior', 'Mid', 'Senior') as fc.Arbitrary<'Junior' | 'Mid' | 'Senior'>,
  });

  const validTechnologyGen = fc.record({
    name: fc.constantFrom('React', 'Node.js', 'PostgreSQL', 'Docker', 'TypeScript'),
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

  // Feature: ai-project-risk-analyzer, Property 5: Data isolation is enforced
  it('should prevent user from accessing another user\'s project by ID', async () => {
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

          // User 1 creates a project
          const user1Project = await createProject(testUser1Id, createData);

          // User 2 tries to access User 1's project - should fail
          try {
            await getProjectById(user1Project.id, testUser2Id);
            // Should not reach here
            return false;
          } catch (error: any) {
            // Should throw permission error
            return error.message.includes('permission') || error.message.includes('access');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: ai-project-risk-analyzer, Property 5: Data isolation is enforced
  it('should prevent user from updating another user\'s project', async () => {
    await fc.assert(
      fc.asyncProperty(
        validProjectDataGen,
        fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length >= 2),
        async (projectData, newName) => {
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

          // User 1 creates a project
          const user1Project = await createProject(testUser1Id, createData);

          // User 2 tries to update User 1's project - should fail
          try {
            await updateProject(user1Project.id, testUser2Id, { name: newName });
            // Should not reach here
            return false;
          } catch (error: any) {
            // Should throw permission error
            return error.message.includes('permission') || error.message.includes('access');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: ai-project-risk-analyzer, Property 5: Data isolation is enforced
  it('should prevent user from deleting another user\'s project', async () => {
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

          // User 1 creates a project
          const user1Project = await createProject(testUser1Id, createData);

          // User 2 tries to delete User 1's project - should fail
          try {
            await deleteProject(user1Project.id, testUser2Id);
            // Should not reach here
            return false;
          } catch (error: any) {
            // Should throw permission error
            return error.message.includes('permission') || error.message.includes('access');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: ai-project-risk-analyzer, Property 5: Data isolation is enforced
  it('should only return user\'s own projects in getUserProjects', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(validProjectDataGen, { minLength: 1, maxLength: 5 }),
        fc.array(validProjectDataGen, { minLength: 1, maxLength: 5 }),
        async (user1Projects, user2Projects) => {
          // Explicit cleanup at start to ensure clean state
          await pool.query('DELETE FROM projects WHERE user_id IN ($1, $2)', [testUser1Id, testUser2Id]);

          // User 1 creates their projects
          const user1CreatedProjects = [];
          for (const projectData of user1Projects) {
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

            const created = await createProject(testUser1Id, createData);
            user1CreatedProjects.push(created);
          }

          // User 2 creates their projects
          const user2CreatedProjects = [];
          for (const projectData of user2Projects) {
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

            const created = await createProject(testUser2Id, createData);
            user2CreatedProjects.push(created);
          }

          // Get User 1's projects
          const user1Retrieved = await getUserProjects(testUser1Id);

          // Get User 2's projects
          const user2Retrieved = await getUserProjects(testUser2Id);

          // Debug logging for failures
          if (user1Retrieved.length !== user1CreatedProjects.length) {
            console.error('User 1 project count mismatch:');
            console.error(`  Expected: ${user1CreatedProjects.length}, Got: ${user1Retrieved.length}`);
            console.error(`  Created IDs: ${user1CreatedProjects.map(p => p.id).join(', ')}`);
            console.error(`  Retrieved IDs: ${user1Retrieved.map(p => p.id).join(', ')}`);
            console.error(`  Retrieved userIds: ${user1Retrieved.map(p => p.userId).join(', ')}`);
            return false;
          }

          const user1Ids = new Set(user1CreatedProjects.map(p => p.id));
          for (const project of user1Retrieved) {
            if (!user1Ids.has(project.id)) {
              console.error('User 1 retrieved unexpected project:');
              console.error(`  Project ID: ${project.id}, User ID: ${project.userId}`);
              console.error(`  Expected IDs: ${Array.from(user1Ids).join(', ')}`);
              return false;
            }
            if (project.userId !== testUser1Id) {
              console.error('User 1 retrieved project with wrong userId:');
              console.error(`  Project ID: ${project.id}, User ID: ${project.userId}, Expected: ${testUser1Id}`);
              return false;
            }
          }

          // Verify User 2 only sees their own projects
          if (user2Retrieved.length !== user2CreatedProjects.length) {
            console.error('User 2 project count mismatch:');
            console.error(`  Expected: ${user2CreatedProjects.length}, Got: ${user2Retrieved.length}`);
            console.error(`  Created IDs: ${user2CreatedProjects.map(p => p.id).join(', ')}`);
            console.error(`  Retrieved IDs: ${user2Retrieved.map(p => p.id).join(', ')}`);
            console.error(`  Retrieved userIds: ${user2Retrieved.map(p => p.userId).join(', ')}`);
            return false;
          }

          const user2Ids = new Set(user2CreatedProjects.map(p => p.id));
          for (const project of user2Retrieved) {
            if (!user2Ids.has(project.id)) {
              console.error('User 2 retrieved unexpected project:');
              console.error(`  Project ID: ${project.id}, User ID: ${project.userId}`);
              console.error(`  Expected IDs: ${Array.from(user2Ids).join(', ')}`);
              return false;
            }
            if (project.userId !== testUser2Id) {
              console.error('User 2 retrieved project with wrong userId:');
              console.error(`  Project ID: ${project.id}, User ID: ${project.userId}, Expected: ${testUser2Id}`);
              return false;
            }
          }

          // Verify no overlap between user projects
          const user1ProjectIds = new Set(user1Retrieved.map(p => p.id));
          const user2ProjectIds = new Set(user2Retrieved.map(p => p.id));

          for (const id of user1ProjectIds) {
            if (user2ProjectIds.has(id)) {
              console.error('Project ID overlap detected:');
              console.error(`  Shared ID: ${id}`);
              return false;
            }
          }

          return true;
        }
      ),
      { numRuns: 50, timeout: 60000 }
    );
  }, 65000);

  // Feature: ai-project-risk-analyzer, Property 5: Data isolation is enforced
  it('should maintain isolation even with identical project data', async () => {
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

          // Both users create projects with identical data
          const user1Project = await createProject(testUser1Id, createData);
          const user2Project = await createProject(testUser2Id, createData);

          // Verify projects have different IDs
          if (user1Project.id === user2Project.id) {
            return false;
          }

          // Verify each user can only access their own project
          const user1Retrieved = await getProjectById(user1Project.id, testUser1Id);
          const user2Retrieved = await getProjectById(user2Project.id, testUser2Id);

          if (user1Retrieved.userId !== testUser1Id) {
            return false;
          }

          if (user2Retrieved.userId !== testUser2Id) {
            return false;
          }

          // Verify User 1 cannot access User 2's project
          try {
            await getProjectById(user2Project.id, testUser1Id);
            return false;
          } catch (error: any) {
            if (!error.message.includes('permission') && !error.message.includes('access')) {
              return false;
            }
          }

          // Verify User 2 cannot access User 1's project
          try {
            await getProjectById(user1Project.id, testUser2Id);
            return false;
          } catch (error: any) {
            if (!error.message.includes('permission') && !error.message.includes('access')) {
              return false;
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: ai-project-risk-analyzer, Property 5: Data isolation is enforced
  it('should enforce isolation across all project operations', async () => {
    await fc.assert(
      fc.asyncProperty(
        validProjectDataGen,
        fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length >= 2),
        fc.double({ min: 1000, max: 1000000, noNaN: true }),
        async (projectData, newName, newBudget) => {
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

          // User 1 creates a project
          const user1Project = await createProject(testUser1Id, createData);

          // Test all operations that User 2 should NOT be able to perform
          let getBlocked = false;
          let updateBlocked = false;
          let deleteBlocked = false;

          // Try to get
          try {
            await getProjectById(user1Project.id, testUser2Id);
          } catch (error: any) {
            if (error.message.includes('permission') || error.message.includes('access')) {
              getBlocked = true;
            }
          }

          // Try to update
          try {
            await updateProject(user1Project.id, testUser2Id, { name: newName, budget: newBudget });
          } catch (error: any) {
            if (error.message.includes('permission') || error.message.includes('access')) {
              updateBlocked = true;
            }
          }

          // Try to delete
          try {
            await deleteProject(user1Project.id, testUser2Id);
          } catch (error: any) {
            if (error.message.includes('permission') || error.message.includes('access')) {
              deleteBlocked = true;
            }
          }

          // Verify project still exists and belongs to User 1
          const stillExists = await getProjectById(user1Project.id, testUser1Id);

          // All operations should be blocked and project should still exist
          return getBlocked && updateBlocked && deleteBlocked && stillExists.userId === testUser1Id;
        }
      ),
      { numRuns: 100 }
    );
  });
});
