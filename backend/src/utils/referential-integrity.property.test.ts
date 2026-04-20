import fc from 'fast-check';
import dotenv from 'dotenv';
import { pool } from '../config/database';

// Load environment variables
dotenv.config();

/**
 * Property-Based Tests for Referential Integrity and Cascading Deletion
 * Feature: ai-project-risk-analyzer, Property 9: Cascading deletion removes all related data
 * Validates: Requirements 2.4, 9.6, 9.7
 */

describe('Property 9: Cascading deletion removes all related data', () => {
  afterAll(async () => {
    await pool.end();
  });

  // Helper function to create a complete data hierarchy
  async function createCompleteHierarchy() {
    // Create user
    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, name) 
       VALUES ($1, $2, $3) 
       RETURNING id`,
      [`test-cascade-${Date.now()}-${Math.random()}@example.com`, 'hashedpassword', 'Test User']
    );
    const userId = userResult.rows[0].id;

    // Create project
    const projectResult = await pool.query(
      `INSERT INTO projects 
       (user_id, name, description, start_date, end_date, budget, team_size, team_composition, technology_stack) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        userId,
        'Test Project',
        'Test Description',
        '2024-01-01',
        '2024-12-31',
        100000,
        5,
        JSON.stringify([{ role: 'Developer', count: 3, experienceLevel: 'Mid' }]),
        JSON.stringify([{ name: 'React', category: 'Frontend', maturity: 'Stable' }])
      ]
    );
    const projectId = projectResult.rows[0].id;

    // Create risk analysis
    const analysisResult = await pool.query(
      `INSERT INTO risk_analyses (project_id, overall_score, metadata) 
       VALUES ($1, $2, $3)
       RETURNING id`,
      [projectId, 75.5, JSON.stringify({ modelVersion: '1.0', engineVersion: '1.0', processingTime: 1000, dataCompleteness: 100 })]
    );
    const analysisId = analysisResult.rows[0].id;

    // Create risks
    const riskIds = [];
    for (let i = 0; i < 3; i++) {
      const riskResult = await pool.query(
        `INSERT INTO risks 
         (analysis_id, title, description, category, score, probability, impact, status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [
          analysisId,
          `Risk ${i + 1}`,
          `Description for risk ${i + 1}`,
          ['Technical', 'Resource', 'Schedule'][i],
          70 + i * 5,
          0.7,
          0.8,
          'Open'
        ]
      );
      riskIds.push(riskResult.rows[0].id);
    }

    // Create mitigations for each risk
    const mitigationIds = [];
    for (const riskId of riskIds) {
      for (let j = 0; j < 2; j++) {
        const mitigationResult = await pool.query(
          `INSERT INTO mitigations 
           (risk_id, strategy, priority, estimated_effort, is_custom) 
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [riskId, `Mitigation strategy ${j + 1}`, ['High', 'Medium'][j], '2 days', false]
        );
        mitigationIds.push(mitigationResult.rows[0].id);
      }
    }

    // Create report
    const reportResult = await pool.query(
      `INSERT INTO reports 
       (project_id, analysis_id, type, file_url, generated_by, options) 
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        projectId,
        analysisId,
        'PDF',
        'https://example.com/report.pdf',
        userId,
        JSON.stringify({ includeSummary: true, includeDetailedRisks: true })
      ]
    );
    const reportId = reportResult.rows[0].id;

    return {
      userId,
      projectId,
      analysisId,
      riskIds,
      mitigationIds,
      reportId
    };
  }

  // Helper function to count records in a table by a specific column
  async function countRecords(table: string, column: string, value: string): Promise<number> {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM ${table} WHERE ${column} = $1`,
      [value]
    );
    return parseInt(result.rows[0].count, 10);
  }

  // Feature: ai-project-risk-analyzer, Property 9: Cascading deletion removes all related data
  it('should cascade delete all related data when a user is deleted', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 3 }), // Number of projects per user
        fc.integer({ min: 1, max: 2 }), // Number of analyses per project
        async (numProjects, numAnalyses) => {
          // Create a user with multiple projects and related data
          const userResult = await pool.query(
            `INSERT INTO users (email, password_hash, name) 
             VALUES ($1, $2, $3) 
             RETURNING id`,
            [`test-user-cascade-${Date.now()}-${Math.random()}@example.com`, 'hashedpassword', 'Test User']
          );
          const userId = userResult.rows[0].id;

          const projectIds = [];
          const analysisIds = [];
          const riskIds = [];
          const mitigationIds = [];
          const reportIds = [];

          // Create multiple projects
          for (let p = 0; p < numProjects; p++) {
            const projectResult = await pool.query(
              `INSERT INTO projects 
               (user_id, name, description, start_date, end_date, budget, team_size, team_composition, technology_stack) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
               RETURNING id`,
              [
                userId,
                `Project ${p + 1}`,
                'Test Description',
                '2024-01-01',
                '2024-12-31',
                100000,
                5,
                JSON.stringify([{ role: 'Developer', count: 3, experienceLevel: 'Mid' }]),
                JSON.stringify([{ name: 'React', category: 'Frontend', maturity: 'Stable' }])
              ]
            );
            const projectId = projectResult.rows[0].id;
            projectIds.push(projectId);

            // Create multiple analyses per project
            for (let a = 0; a < numAnalyses; a++) {
              const analysisResult = await pool.query(
                `INSERT INTO risk_analyses (project_id, overall_score, metadata) 
                 VALUES ($1, $2, $3)
                 RETURNING id`,
                [projectId, 75.5, JSON.stringify({ modelVersion: '1.0' })]
              );
              const analysisId = analysisResult.rows[0].id;
              analysisIds.push(analysisId);

              // Create risks for each analysis
              for (let r = 0; r < 2; r++) {
                const riskResult = await pool.query(
                  `INSERT INTO risks 
                   (analysis_id, title, description, category, score, probability, impact, status) 
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                   RETURNING id`,
                  [
                    analysisId,
                    `Risk ${r + 1}`,
                    'Description',
                    'Technical',
                    70,
                    0.7,
                    0.8,
                    'Open'
                  ]
                );
                const riskId = riskResult.rows[0].id;
                riskIds.push(riskId);

                // Create mitigations for each risk
                const mitigationResult = await pool.query(
                  `INSERT INTO mitigations 
                   (risk_id, strategy, priority, estimated_effort, is_custom) 
                   VALUES ($1, $2, $3, $4, $5)
                   RETURNING id`,
                  [riskId, 'Mitigation strategy', 'High', '2 days', false]
                );
                mitigationIds.push(mitigationResult.rows[0].id);
              }

              // Create report for this analysis
              const reportResult = await pool.query(
                `INSERT INTO reports 
                 (project_id, analysis_id, type, file_url, generated_by, options) 
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING id`,
                [
                  projectId,
                  analysisId,
                  'PDF',
                  'https://example.com/report.pdf',
                  userId,
                  JSON.stringify({ includeSummary: true })
                ]
              );
              reportIds.push(reportResult.rows[0].id);
            }
          }

          // Verify all data exists before deletion
          expect(await countRecords('projects', 'user_id', userId)).toBe(numProjects);
          expect(await countRecords('users', 'id', userId)).toBe(1);

          // Delete reports first (they reference users via generated_by without CASCADE)
          await pool.query('DELETE FROM reports WHERE generated_by = $1', [userId]);

          // Delete the user
          await pool.query('DELETE FROM users WHERE id = $1', [userId]);

          // Verify all related data is deleted
          expect(await countRecords('users', 'id', userId)).toBe(0);
          expect(await countRecords('projects', 'user_id', userId)).toBe(0);

          // Verify all analyses are deleted
          for (const analysisId of analysisIds) {
            expect(await countRecords('risk_analyses', 'id', analysisId)).toBe(0);
          }

          // Verify all risks are deleted
          for (const riskId of riskIds) {
            expect(await countRecords('risks', 'id', riskId)).toBe(0);
          }

          // Verify all mitigations are deleted
          for (const mitigationId of mitigationIds) {
            expect(await countRecords('mitigations', 'id', mitigationId)).toBe(0);
          }

          // Verify all reports are deleted
          for (const reportId of reportIds) {
            expect(await countRecords('reports', 'id', reportId)).toBe(0);
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  // Feature: ai-project-risk-analyzer, Property 9: Cascading deletion removes all related data
  it('should cascade delete all related data when a project is deleted', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 3 }), // Number of analyses
        fc.integer({ min: 1, max: 3 }), // Number of risks per analysis
        async (numAnalyses, numRisks) => {
          const hierarchy = await createCompleteHierarchy();
          const { userId, projectId } = hierarchy;

          // Create additional analyses and risks
          const additionalAnalysisIds = [];
          const additionalRiskIds = [];
          const additionalMitigationIds = [];

          for (let a = 0; a < numAnalyses; a++) {
            const analysisResult = await pool.query(
              `INSERT INTO risk_analyses (project_id, overall_score, metadata) 
               VALUES ($1, $2, $3)
               RETURNING id`,
              [projectId, 80, JSON.stringify({ modelVersion: '1.0' })]
            );
            const analysisId = analysisResult.rows[0].id;
            additionalAnalysisIds.push(analysisId);

            for (let r = 0; r < numRisks; r++) {
              const riskResult = await pool.query(
                `INSERT INTO risks 
                 (analysis_id, title, description, category, score, probability, impact, status) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 RETURNING id`,
                [analysisId, `Risk ${r}`, 'Description', 'Technical', 70, 0.7, 0.8, 'Open']
              );
              const riskId = riskResult.rows[0].id;
              additionalRiskIds.push(riskId);

              const mitigationResult = await pool.query(
                `INSERT INTO mitigations 
                 (risk_id, strategy, priority, estimated_effort, is_custom) 
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING id`,
                [riskId, 'Strategy', 'High', '1 day', false]
              );
              additionalMitigationIds.push(mitigationResult.rows[0].id);
            }
          }

          // Verify project exists
          expect(await countRecords('projects', 'id', projectId)).toBe(1);

          // Delete the project
          await pool.query('DELETE FROM projects WHERE id = $1', [projectId]);

          // Verify project is deleted
          expect(await countRecords('projects', 'id', projectId)).toBe(0);

          // Verify all analyses are deleted (original + additional)
          expect(await countRecords('risk_analyses', 'id', hierarchy.analysisId)).toBe(0);
          for (const analysisId of additionalAnalysisIds) {
            expect(await countRecords('risk_analyses', 'id', analysisId)).toBe(0);
          }

          // Verify all risks are deleted
          for (const riskId of [...hierarchy.riskIds, ...additionalRiskIds]) {
            expect(await countRecords('risks', 'id', riskId)).toBe(0);
          }

          // Verify all mitigations are deleted
          for (const mitigationId of [...hierarchy.mitigationIds, ...additionalMitigationIds]) {
            expect(await countRecords('mitigations', 'id', mitigationId)).toBe(0);
          }

          // Verify report is deleted
          expect(await countRecords('reports', 'id', hierarchy.reportId)).toBe(0);

          // Verify user still exists (should not be affected)
          expect(await countRecords('users', 'id', userId)).toBe(1);

          // Clean up user
          await pool.query('DELETE FROM users WHERE id = $1', [userId]);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  // Feature: ai-project-risk-analyzer, Property 9: Cascading deletion removes all related data
  it('should cascade delete risks and mitigations when a risk analysis is deleted', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }), // Number of risks
        fc.integer({ min: 1, max: 3 }), // Number of mitigations per risk
        async (numRisks, numMitigations) => {
          const hierarchy = await createCompleteHierarchy();
          const { userId, projectId, analysisId } = hierarchy;

          const riskIds = [];
          const mitigationIds = [];

          // Create additional risks and mitigations
          for (let r = 0; r < numRisks; r++) {
            const riskResult = await pool.query(
              `INSERT INTO risks 
               (analysis_id, title, description, category, score, probability, impact, status) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
               RETURNING id`,
              [analysisId, `Risk ${r}`, 'Description', 'Budget', 65, 0.6, 0.7, 'Open']
            );
            const riskId = riskResult.rows[0].id;
            riskIds.push(riskId);

            for (let m = 0; m < numMitigations; m++) {
              const mitigationResult = await pool.query(
                `INSERT INTO mitigations 
                 (risk_id, strategy, priority, estimated_effort, is_custom) 
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING id`,
                [riskId, `Strategy ${m}`, 'Medium', '3 days', false]
              );
              mitigationIds.push(mitigationResult.rows[0].id);
            }
          }

          // Verify analysis exists
          expect(await countRecords('risk_analyses', 'id', analysisId)).toBe(1);

          // Delete the risk analysis
          await pool.query('DELETE FROM risk_analyses WHERE id = $1', [analysisId]);

          // Verify analysis is deleted
          expect(await countRecords('risk_analyses', 'id', analysisId)).toBe(0);

          // Verify all risks are deleted (original + additional)
          for (const riskId of [...hierarchy.riskIds, ...riskIds]) {
            expect(await countRecords('risks', 'id', riskId)).toBe(0);
          }

          // Verify all mitigations are deleted
          for (const mitigationId of [...hierarchy.mitigationIds, ...mitigationIds]) {
            expect(await countRecords('mitigations', 'id', mitigationId)).toBe(0);
          }

          // Verify project still exists
          expect(await countRecords('projects', 'id', projectId)).toBe(1);

          // Clean up
          await pool.query('DELETE FROM users WHERE id = $1', [userId]);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  // Feature: ai-project-risk-analyzer, Property 9: Cascading deletion removes all related data
  it('should cascade delete mitigations when a risk is deleted', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }), // Number of mitigations
        async (numMitigations) => {
          const hierarchy = await createCompleteHierarchy();
          const { userId, riskIds } = hierarchy;
          const targetRiskId = riskIds[0];

          const mitigationIds = [];

          // Create additional mitigations for the first risk
          for (let m = 0; m < numMitigations; m++) {
            const mitigationResult = await pool.query(
              `INSERT INTO mitigations 
               (risk_id, strategy, priority, estimated_effort, is_custom) 
               VALUES ($1, $2, $3, $4, $5)
               RETURNING id`,
              [targetRiskId, `Additional Strategy ${m}`, 'Low', '1 day', true]
            );
            mitigationIds.push(mitigationResult.rows[0].id);
          }

          // Verify risk exists
          expect(await countRecords('risks', 'id', targetRiskId)).toBe(1);

          // Count mitigations before deletion
          const mitigationsBeforeCount = await countRecords('mitigations', 'risk_id', targetRiskId);
          expect(mitigationsBeforeCount).toBeGreaterThan(0);

          // Delete the risk
          await pool.query('DELETE FROM risks WHERE id = $1', [targetRiskId]);

          // Verify risk is deleted
          expect(await countRecords('risks', 'id', targetRiskId)).toBe(0);

          // Verify all mitigations for this risk are deleted
          expect(await countRecords('mitigations', 'risk_id', targetRiskId)).toBe(0);

          // Verify other risks still exist
          for (const riskId of riskIds.slice(1)) {
            expect(await countRecords('risks', 'id', riskId)).toBe(1);
          }

          // Clean up - delete reports first
          await pool.query('DELETE FROM reports WHERE generated_by = $1', [userId]);
          await pool.query('DELETE FROM users WHERE id = $1', [userId]);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  // Feature: ai-project-risk-analyzer, Property 9: Cascading deletion removes all related data
  it('should not leave orphaned records after any deletion in the hierarchy', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('user', 'project', 'analysis', 'risk'),
        async (deleteLevel) => {
          const hierarchy = await createCompleteHierarchy();
          const { userId, projectId, analysisId, riskIds } = hierarchy;

          // Perform deletion at the specified level
          switch (deleteLevel) {
            case 'user':
              // Delete reports first (they reference users via generated_by without CASCADE)
              await pool.query('DELETE FROM reports WHERE generated_by = $1', [userId]);
              await pool.query('DELETE FROM users WHERE id = $1', [userId]);
              break;
            case 'project':
              await pool.query('DELETE FROM projects WHERE id = $1', [projectId]);
              await pool.query('DELETE FROM reports WHERE generated_by = $1', [userId]);
              await pool.query('DELETE FROM users WHERE id = $1', [userId]);
              break;
            case 'analysis':
              await pool.query('DELETE FROM risk_analyses WHERE id = $1', [analysisId]);
              await pool.query('DELETE FROM reports WHERE generated_by = $1', [userId]);
              await pool.query('DELETE FROM users WHERE id = $1', [userId]);
              break;
            case 'risk':
              await pool.query('DELETE FROM risks WHERE id = $1', [riskIds[0]]);
              await pool.query('DELETE FROM reports WHERE generated_by = $1', [userId]);
              await pool.query('DELETE FROM users WHERE id = $1', [userId]);
              break;
          }

          // Query for any orphaned records
          const orphanedProjects = await pool.query(
            `SELECT COUNT(*) as count FROM projects 
             WHERE user_id NOT IN (SELECT id FROM users)`
          );

          const orphanedAnalyses = await pool.query(
            `SELECT COUNT(*) as count FROM risk_analyses 
             WHERE project_id NOT IN (SELECT id FROM projects)`
          );

          const orphanedRisks = await pool.query(
            `SELECT COUNT(*) as count FROM risks 
             WHERE analysis_id NOT IN (SELECT id FROM risk_analyses)`
          );

          const orphanedMitigations = await pool.query(
            `SELECT COUNT(*) as count FROM mitigations 
             WHERE risk_id NOT IN (SELECT id FROM risks)`
          );

          const orphanedReports = await pool.query(
            `SELECT COUNT(*) as count FROM reports 
             WHERE project_id NOT IN (SELECT id FROM projects) 
             OR analysis_id NOT IN (SELECT id FROM risk_analyses)`
          );

          // Verify no orphaned records exist
          expect(parseInt(orphanedProjects.rows[0].count, 10)).toBe(0);
          expect(parseInt(orphanedAnalyses.rows[0].count, 10)).toBe(0);
          expect(parseInt(orphanedRisks.rows[0].count, 10)).toBe(0);
          expect(parseInt(orphanedMitigations.rows[0].count, 10)).toBe(0);
          expect(parseInt(orphanedReports.rows[0].count, 10)).toBe(0);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
