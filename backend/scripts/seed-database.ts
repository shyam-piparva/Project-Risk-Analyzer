#!/usr/bin/env tsx

/**
 * Database Seeding Script
 * Seeds the database with sample data for development and testing
 * 
 * Usage:
 *   npm run seed              - Seed all data
 *   npm run seed:users        - Seed only users
 *   npm run seed:projects     - Seed only projects
 *   npm run seed:risks        - Seed only risk analyses
 *   npm run seed:clean        - Clean all seeded data
 */

import { pool } from '../src/config/database';
import { hashPassword } from '../src/utils/password';
import { logger } from '../src/utils/logger';

// Sample data generators
const SAMPLE_USERS = [
  {
    email: 'john.doe@example.com',
    password: 'Password123!',
    name: 'John Doe',
  },
  {
    email: 'jane.smith@example.com',
    password: 'Password123!',
    name: 'Jane Smith',
  },
  {
    email: 'bob.wilson@example.com',
    password: 'Password123!',
    name: 'Bob Wilson',
  },
  {
    email: 'alice.johnson@example.com',
    password: 'Password123!',
    name: 'Alice Johnson',
  },
  {
    email: 'demo@example.com',
    password: 'Demo123!',
    name: 'Demo User',
  },
];

const SAMPLE_PROJECTS = [
  {
    name: 'E-Commerce Platform Redesign',
    description: 'Complete redesign of the company e-commerce platform with modern UI/UX',
    startDate: new Date('2024-01-15'),
    endDate: new Date('2024-06-30'),
    budget: 250000,
    teamSize: 8,
    teamComposition: [
      { role: 'Frontend Developer', count: 3, experienceLevel: 'Mid' },
      { role: 'Backend Developer', count: 2, experienceLevel: 'Senior' },
      { role: 'UI/UX Designer', count: 2, experienceLevel: 'Mid' },
      { role: 'Project Manager', count: 1, experienceLevel: 'Senior' },
    ],
    technologyStack: [
      { name: 'React', category: 'Frontend', maturity: 'Stable' },
      { name: 'Node.js', category: 'Backend', maturity: 'Stable' },
      { name: 'PostgreSQL', category: 'Database', maturity: 'Stable' },
      { name: 'Docker', category: 'DevOps', maturity: 'Stable' },
    ],
    scope: 'Full redesign of customer-facing e-commerce platform including product catalog, shopping cart, checkout, and user account management',
  },
  {
    name: 'Mobile Banking App',
    description: 'New mobile banking application for iOS and Android',
    startDate: new Date('2024-02-01'),
    endDate: new Date('2024-12-31'),
    budget: 500000,
    teamSize: 12,
    teamComposition: [
      { role: 'Mobile Developer', count: 4, experienceLevel: 'Senior' },
      { role: 'Backend Developer', count: 3, experienceLevel: 'Senior' },
      { role: 'Security Engineer', count: 2, experienceLevel: 'Senior' },
      { role: 'QA Engineer', count: 2, experienceLevel: 'Mid' },
      { role: 'Product Manager', count: 1, experienceLevel: 'Senior' },
    ],
    technologyStack: [
      { name: 'React Native', category: 'Frontend', maturity: 'Stable' },
      { name: 'Java Spring', category: 'Backend', maturity: 'Stable' },
      { name: 'MongoDB', category: 'Database', maturity: 'Stable' },
      { name: 'Kubernetes', category: 'DevOps', maturity: 'Stable' },
      { name: 'OAuth 2.0', category: 'Other', maturity: 'Stable' },
    ],
    scope: 'Complete mobile banking solution with account management, transfers, bill payments, and biometric authentication',
  },
  {
    name: 'AI Chatbot Integration',
    description: 'Integrate AI-powered chatbot for customer support',
    startDate: new Date('2024-03-01'),
    endDate: new Date('2024-05-31'),
    budget: 75000,
    teamSize: 4,
    teamComposition: [
      { role: 'ML Engineer', count: 2, experienceLevel: 'Mid' },
      { role: 'Backend Developer', count: 1, experienceLevel: 'Senior' },
      { role: 'DevOps Engineer', count: 1, experienceLevel: 'Mid' },
    ],
    technologyStack: [
      { name: 'Python', category: 'Backend', maturity: 'Stable' },
      { name: 'TensorFlow', category: 'Other', maturity: 'Emerging' },
      { name: 'Redis', category: 'Database', maturity: 'Stable' },
      { name: 'AWS Lambda', category: 'DevOps', maturity: 'Stable' },
    ],
    scope: 'AI chatbot for handling common customer inquiries with natural language processing',
  },
  {
    name: 'Legacy System Migration',
    description: 'Migrate legacy monolith to microservices architecture',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-09-30'),
    budget: 400000,
    teamSize: 10,
    teamComposition: [
      { role: 'Backend Developer', count: 5, experienceLevel: 'Senior' },
      { role: 'DevOps Engineer', count: 2, experienceLevel: 'Senior' },
      { role: 'Database Administrator', count: 1, experienceLevel: 'Senior' },
      { role: 'Architect', count: 1, experienceLevel: 'Senior' },
      { role: 'QA Engineer', count: 1, experienceLevel: 'Mid' },
    ],
    technologyStack: [
      { name: 'Java', category: 'Backend', maturity: 'Stable' },
      { name: 'Kafka', category: 'Other', maturity: 'Stable' },
      { name: 'PostgreSQL', category: 'Database', maturity: 'Stable' },
      { name: 'Kubernetes', category: 'DevOps', maturity: 'Stable' },
    ],
    scope: 'Break down monolithic application into microservices with event-driven architecture',
  },
  {
    name: 'Startup MVP Development',
    description: 'Rapid MVP development for new startup',
    startDate: new Date('2024-04-01'),
    endDate: new Date('2024-06-15'),
    budget: 50000,
    teamSize: 3,
    teamComposition: [
      { role: 'Full Stack Developer', count: 2, experienceLevel: 'Junior' },
      { role: 'Designer', count: 1, experienceLevel: 'Junior' },
    ],
    technologyStack: [
      { name: 'Next.js', category: 'Frontend', maturity: 'Emerging' },
      { name: 'Supabase', category: 'Backend', maturity: 'Emerging' },
      { name: 'Vercel', category: 'DevOps', maturity: 'Stable' },
    ],
    scope: 'Minimum viable product for social networking platform',
  },
];

const SAMPLE_RISK_CATEGORIES = ['Technical', 'Resource', 'Schedule', 'Budget', 'External'];

const SAMPLE_RISKS = [
  {
    title: 'Timeline Compression Risk',
    description: 'Project timeline is aggressive given the scope and team size',
    category: 'Schedule',
    probability: 0.7,
    impact: 0.8,
  },
  {
    title: 'Technology Maturity Risk',
    description: 'Using emerging technologies that may have limited community support',
    category: 'Technical',
    probability: 0.5,
    impact: 0.6,
  },
  {
    title: 'Budget Constraint Risk',
    description: 'Budget may be insufficient for the planned scope',
    category: 'Budget',
    probability: 0.6,
    impact: 0.7,
  },
  {
    title: 'Team Experience Gap',
    description: 'Team has limited experience with some of the required technologies',
    category: 'Resource',
    probability: 0.4,
    impact: 0.5,
  },
  {
    title: 'Third-Party Dependency Risk',
    description: 'Heavy reliance on third-party APIs and services',
    category: 'External',
    probability: 0.3,
    impact: 0.6,
  },
];

const SAMPLE_MITIGATIONS = [
  {
    strategy: 'Add buffer time to critical path tasks',
    priority: 'High',
    estimatedEffort: '1 week',
  },
  {
    strategy: 'Conduct technology spike to validate feasibility',
    priority: 'High',
    estimatedEffort: '2 weeks',
  },
  {
    strategy: 'Review and optimize scope to fit budget',
    priority: 'Medium',
    estimatedEffort: '3 days',
  },
  {
    strategy: 'Provide training sessions for team members',
    priority: 'Medium',
    estimatedEffort: '1 week',
  },
  {
    strategy: 'Implement fallback mechanisms for third-party services',
    priority: 'High',
    estimatedEffort: '2 weeks',
  },
];

/**
 * Seed users
 */
async function seedUsers(): Promise<Map<string, string>> {
  console.log('Seeding users...');
  const userIdMap = new Map<string, string>();

  for (const user of SAMPLE_USERS) {
    try {
      // Check if user already exists
      const existing = await pool.query('SELECT id FROM users WHERE email = $1', [user.email]);

      if (existing.rows.length > 0) {
        console.log(`  ✓ User already exists: ${user.email}`);
        userIdMap.set(user.email, existing.rows[0].id);
        continue;
      }

      const passwordHash = await hashPassword(user.password);

      const result = await pool.query(
        `INSERT INTO users (email, password_hash, name, is_verified) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id`,
        [user.email, passwordHash, user.name, true]
      );

      userIdMap.set(user.email, result.rows[0].id);
      console.log(`  ✓ Created user: ${user.email}`);
    } catch (error: any) {
      console.error(`  ✗ Error creating user ${user.email}:`, error.message);
    }
  }

  console.log(`Seeded ${userIdMap.size} users\n`);
  return userIdMap;
}

/**
 * Seed projects
 */
async function seedProjects(userIdMap: Map<string, string>): Promise<Map<string, string>> {
  console.log('Seeding projects...');
  const projectIdMap = new Map<string, string>();

  const userIds = Array.from(userIdMap.values());
  if (userIds.length === 0) {
    console.log('  ✗ No users found, skipping project seeding\n');
    return projectIdMap;
  }

  for (let i = 0; i < SAMPLE_PROJECTS.length; i++) {
    const project = SAMPLE_PROJECTS[i];
    const userId = userIds[i % userIds.length]; // Distribute projects among users

    try {
      const result = await pool.query(
        `INSERT INTO projects (
          user_id, name, description, start_date, end_date, budget, 
          team_size, team_composition, technology_stack, scope
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
        RETURNING id`,
        [
          userId,
          project.name,
          project.description,
          project.startDate,
          project.endDate,
          project.budget,
          project.teamSize,
          JSON.stringify(project.teamComposition),
          JSON.stringify(project.technologyStack),
          project.scope,
        ]
      );

      projectIdMap.set(project.name, result.rows[0].id);
      console.log(`  ✓ Created project: ${project.name}`);
    } catch (error: any) {
      console.error(`  ✗ Error creating project ${project.name}:`, error.message);
    }
  }

  console.log(`Seeded ${projectIdMap.size} projects\n`);
  return projectIdMap;
}

/**
 * Seed risk analyses
 */
async function seedRiskAnalyses(projectIdMap: Map<string, string>): Promise<void> {
  console.log('Seeding risk analyses...');

  const projectIds = Array.from(projectIdMap.values());
  if (projectIds.length === 0) {
    console.log('  ✗ No projects found, skipping risk analysis seeding\n');
    return;
  }

  let analysisCount = 0;
  let riskCount = 0;
  let mitigationCount = 0;

  for (const projectId of projectIds) {
    try {
      // Calculate overall score (average of risk scores)
      const riskScores = SAMPLE_RISKS.map((r) => (r.probability * 0.5 + r.impact * 0.5) * 100);
      const overallScore = riskScores.reduce((a, b) => a + b, 0) / riskScores.length;

      // Create risk analysis
      const analysisResult = await pool.query(
        `INSERT INTO risk_analyses (project_id, overall_score, metadata) 
         VALUES ($1, $2, $3) 
         RETURNING id`,
        [
          projectId,
          overallScore,
          JSON.stringify({
            modelVersion: '1.0.0',
            engineVersion: '1.0.0',
            processingTime: Math.floor(Math.random() * 5000) + 1000,
            dataCompleteness: 100,
          }),
        ]
      );

      const analysisId = analysisResult.rows[0].id;
      analysisCount++;

      // Create risks for this analysis
      for (const risk of SAMPLE_RISKS) {
        const score = (risk.probability * 0.5 + risk.impact * 0.5) * 100;

        const riskResult = await pool.query(
          `INSERT INTO risks (
            analysis_id, title, description, category, score, 
            probability, impact, status
          ) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
          RETURNING id`,
          [
            analysisId,
            risk.title,
            risk.description,
            risk.category,
            score,
            risk.probability,
            risk.impact,
            'Open',
          ]
        );

        const riskId = riskResult.rows[0].id;
        riskCount++;

        // Create mitigations for this risk
        const numMitigations = Math.floor(Math.random() * 2) + 1; // 1-2 mitigations per risk
        for (let i = 0; i < numMitigations; i++) {
          const mitigation = SAMPLE_MITIGATIONS[i % SAMPLE_MITIGATIONS.length];

          await pool.query(
            `INSERT INTO mitigations (
              risk_id, strategy, priority, estimated_effort, is_custom
            ) 
            VALUES ($1, $2, $3, $4, $5)`,
            [riskId, mitigation.strategy, mitigation.priority, mitigation.estimatedEffort, false]
          );

          mitigationCount++;
        }
      }

      console.log(`  ✓ Created risk analysis for project ${projectId}`);
    } catch (error: any) {
      console.error(`  ✗ Error creating risk analysis for project ${projectId}:`, error.message);
    }
  }

  console.log(
    `Seeded ${analysisCount} risk analyses, ${riskCount} risks, ${mitigationCount} mitigations\n`
  );
}

/**
 * Clean all seeded data
 */
async function cleanDatabase(): Promise<void> {
  console.log('Cleaning seeded data...');

  try {
    // Delete in reverse order of dependencies
    await pool.query('DELETE FROM mitigations');
    console.log('  ✓ Deleted mitigations');

    await pool.query('DELETE FROM risks');
    console.log('  ✓ Deleted risks');

    await pool.query('DELETE FROM risk_analyses');
    console.log('  ✓ Deleted risk analyses');

    await pool.query('DELETE FROM reports');
    console.log('  ✓ Deleted reports');

    await pool.query('DELETE FROM projects');
    console.log('  ✓ Deleted projects');

    await pool.query('DELETE FROM users WHERE email LIKE \'%@example.com\'');
    console.log('  ✓ Deleted users');

    console.log('\nDatabase cleaned successfully\n');
  } catch (error: any) {
    console.error('Error cleaning database:', error.message);
    throw error;
  }
}

/**
 * Main seeding function
 */
async function seedAll(): Promise<void> {
  console.log('='.repeat(60));
  console.log('Database Seeding Script');
  console.log('='.repeat(60));
  console.log();

  try {
    const userIdMap = await seedUsers();
    const projectIdMap = await seedProjects(userIdMap);
    await seedRiskAnalyses(projectIdMap);

    console.log('='.repeat(60));
    console.log('Seeding completed successfully!');
    console.log('='.repeat(60));
    console.log();
    console.log('Sample credentials:');
    console.log('  Email: demo@example.com');
    console.log('  Password: Demo123!');
    console.log();
  } catch (error: any) {
    console.error('Seeding failed:', error.message);
    process.exit(1);
  }
}

// CLI handling
const command = process.argv[2];

(async () => {
  try {
    switch (command) {
      case 'users':
        await seedUsers();
        break;
      case 'projects':
        const userIdMap = await seedUsers();
        await seedProjects(userIdMap);
        break;
      case 'risks':
        const users = await seedUsers();
        const projects = await seedProjects(users);
        await seedRiskAnalyses(projects);
        break;
      case 'clean':
        await cleanDatabase();
        break;
      default:
        await seedAll();
    }

    await pool.end();
    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    await pool.end();
    process.exit(1);
  }
})();
