import { pool } from '../config/database';
import { logger } from '../utils/logger';

/**
 * Project Service
 * Handles project creation, retrieval, updates, and deletion
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4
 */

export interface TeamMember {
  role: string;
  count: number;
  experienceLevel: 'Junior' | 'Mid' | 'Senior';
}

export interface Technology {
  name: string;
  category: 'Frontend' | 'Backend' | 'Database' | 'DevOps' | 'Other';
  maturity: 'Stable' | 'Emerging' | 'Experimental';
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  budget: number;
  teamSize: number;
  teamComposition: TeamMember[];
  technologyStack: Technology[];
  scope: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectDTO {
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  budget: number;
  teamSize: number;
  teamComposition: TeamMember[];
  technologyStack: Technology[];
  scope?: string;
}

export interface UpdateProjectDTO {
  name?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  teamSize?: number;
  teamComposition?: TeamMember[];
  technologyStack?: Technology[];
  scope?: string;
}

/**
 * Create a new project
 * @param userId - User ID who owns the project
 * @param projectData - Project creation data
 * @returns Created project object
 * @throws Error if validation fails
 */
export async function createProject(
  userId: string,
  projectData: CreateProjectDTO
): Promise<Project> {
  const {
    name,
    description,
    startDate,
    endDate,
    budget,
    teamSize,
    teamComposition,
    technologyStack,
    scope,
  } = projectData;

  // Validate required fields
  if (!name || name.trim().length === 0) {
    throw new Error('Project name is required');
  }

  if (name.trim().length < 2) {
    throw new Error('Project name must be at least 2 characters long');
  }

  if (!startDate || !endDate) {
    throw new Error('Start date and end date are required');
  }

  if (!budget || budget <= 0) {
    throw new Error('Budget must be a positive number');
  }

  if (!teamSize || teamSize <= 0) {
    throw new Error('Team size must be a positive number');
  }

  // Validate dates
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Invalid date format');
  }

  if (end <= start) {
    throw new Error('End date must be after start date');
  }

  // Normalize to UTC to avoid timezone issues with DATE type
  const startUTC = new Date(Date.UTC(start.getFullYear(), start.getMonth(), start.getDate()));
  const endUTC = new Date(Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()));

  // Re-validate after normalization
  if (endUTC <= startUTC) {
    throw new Error('End date must be after start date');
  }

  // Validate team composition
  if (!teamComposition || teamComposition.length === 0) {
    throw new Error('Team composition is required');
  }

  validateTeamComposition(teamComposition);

  // Validate technology stack
  if (!technologyStack || technologyStack.length === 0) {
    throw new Error('Technology stack is required');
  }

  validateTechnologyStack(technologyStack);

  try {
    const result = await pool.query(
      `INSERT INTO projects (
        user_id, name, description, start_date, end_date, budget, 
        team_size, team_composition, technology_stack, scope
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING id, user_id, name, description, start_date, end_date, budget, 
                team_size, team_composition, technology_stack, scope, 
                created_at, updated_at`,
      [
        userId,
        name.trim(),
        description?.trim() || null,
        startUTC,
        endUTC,
        budget,
        teamSize,
        JSON.stringify(teamComposition),
        JSON.stringify(technologyStack),
        scope?.trim() || null,
      ]
    );

    const project = mapRowToProject(result.rows[0]);

    logger.info('Project created successfully', { projectId: project.id, userId });

    return project;
  } catch (error: any) {
    logger.error('Error creating project', { error: error.message, userId });
    throw error;
  }
}

/**
 * Get all projects for a user
 * @param userId - User ID
 * @returns Array of projects
 */
export async function getUserProjects(userId: string): Promise<Project[]> {
  try {
    const result = await pool.query(
      `SELECT id, user_id, name, description, start_date, end_date, budget, 
              team_size, team_composition, technology_stack, scope, 
              created_at, updated_at
       FROM projects 
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    return result.rows.map(mapRowToProject);
  } catch (error: any) {
    logger.error('Error getting user projects', { error: error.message, userId });
    throw error;
  }
}

/**
 * Get a single project by ID
 * @param projectId - Project ID
 * @param userId - User ID (for ownership validation)
 * @returns Project object
 * @throws Error if project not found or user doesn't own it
 */
export async function getProjectById(projectId: string, userId: string): Promise<Project> {
  try {
    const result = await pool.query(
      `SELECT id, user_id, name, description, start_date, end_date, budget, 
              team_size, team_composition, technology_stack, scope, 
              created_at, updated_at
       FROM projects 
       WHERE id = $1`,
      [projectId]
    );

    if (result.rows.length === 0) {
      throw new Error('Project not found');
    }

    const project = mapRowToProject(result.rows[0]);

    // Validate ownership
    if (project.userId !== userId) {
      throw new Error('You do not have permission to access this project');
    }

    return project;
  } catch (error: any) {
    logger.error('Error getting project by ID', { error: error.message, projectId, userId });
    throw error;
  }
}

/**
 * Update project details
 * @param projectId - Project ID
 * @param userId - User ID (for ownership validation)
 * @param updates - Fields to update
 * @returns Updated project object
 * @throws Error if project not found or validation fails
 */
export async function updateProject(
  projectId: string,
  userId: string,
  updates: UpdateProjectDTO
): Promise<Project> {
  // Validate ownership first
  await validateOwnership(projectId, userId);

  const {
    name,
    description,
    startDate,
    endDate,
    budget,
    teamSize,
    teamComposition,
    technologyStack,
    scope,
  } = updates;

  // Check if there are any fields to update
  if (Object.keys(updates).length === 0) {
    throw new Error('No fields to update');
  }

  const updateFields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (name !== undefined) {
    if (!name || name.trim().length === 0) {
      throw new Error('Project name cannot be empty');
    }
    if (name.trim().length < 2) {
      throw new Error('Project name must be at least 2 characters long');
    }
    updateFields.push(`name = $${paramIndex++}`);
    values.push(name.trim());
  }

  if (description !== undefined) {
    updateFields.push(`description = $${paramIndex++}`);
    values.push(description?.trim() || null);
  }

  let startUTC: Date | undefined;
  let endUTC: Date | undefined;

  if (startDate !== undefined) {
    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      throw new Error('Invalid start date format');
    }
    // Normalize to UTC to avoid timezone issues with DATE type
    startUTC = new Date(Date.UTC(start.getFullYear(), start.getMonth(), start.getDate()));
    updateFields.push(`start_date = $${paramIndex++}`);
    values.push(startUTC);
  }

  if (endDate !== undefined) {
    const end = new Date(endDate);
    if (isNaN(end.getTime())) {
      throw new Error('Invalid end date format');
    }
    // Normalize to UTC to avoid timezone issues with DATE type
    endUTC = new Date(Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()));
    updateFields.push(`end_date = $${paramIndex++}`);
    values.push(endUTC);
  }

  // Validate dates if both are being updated or if one is being updated
  if (startUTC !== undefined || endUTC !== undefined) {
    // Get current project to check dates
    const currentProject = await getProjectById(projectId, userId);
    const finalStartDate = startUTC !== undefined ? startUTC : currentProject.startDate;
    const finalEndDate = endUTC !== undefined ? endUTC : currentProject.endDate;

    if (finalEndDate <= finalStartDate) {
      throw new Error('End date must be after start date');
    }
  }

  if (budget !== undefined) {
    if (budget <= 0) {
      throw new Error('Budget must be a positive number');
    }
    updateFields.push(`budget = $${paramIndex++}`);
    values.push(budget);
  }

  if (teamSize !== undefined) {
    if (teamSize <= 0) {
      throw new Error('Team size must be a positive number');
    }
    updateFields.push(`team_size = $${paramIndex++}`);
    values.push(teamSize);
  }

  if (teamComposition !== undefined) {
    validateTeamComposition(teamComposition);
    updateFields.push(`team_composition = $${paramIndex++}`);
    values.push(JSON.stringify(teamComposition));
  }

  if (technologyStack !== undefined) {
    validateTechnologyStack(technologyStack);
    updateFields.push(`technology_stack = $${paramIndex++}`);
    values.push(JSON.stringify(technologyStack));
  }

  if (scope !== undefined) {
    updateFields.push(`scope = $${paramIndex++}`);
    values.push(scope?.trim() || null);
  }

  // Note: updated_at is automatically updated by database trigger
  // However, we explicitly set it here to ensure it updates even when other values don't change
  updateFields.push(`updated_at = clock_timestamp()`);

  values.push(projectId);

  try {
    const query = `
      UPDATE projects 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramIndex}
      RETURNING id, user_id, name, description, start_date, end_date, budget, 
                team_size, team_composition, technology_stack, scope, 
                created_at, updated_at
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new Error('Project not found');
    }

    const project = mapRowToProject(result.rows[0]);

    logger.info('Project updated successfully', { projectId, userId });

    return project;
  } catch (error: any) {
    logger.error('Error updating project', { error: error.message, projectId, userId });
    throw error;
  }
}

/**
 * Delete a project and all associated data
 * @param projectId - Project ID
 * @param userId - User ID (for ownership validation)
 * @throws Error if project not found or user doesn't own it
 */
export async function deleteProject(projectId: string, userId: string): Promise<void> {
  // Validate ownership first
  await validateOwnership(projectId, userId);

  try {
    const result = await pool.query(
      'DELETE FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, userId]
    );

    if (result.rowCount === 0) {
      throw new Error('Project not found');
    }

    logger.info('Project deleted successfully', { projectId, userId });
  } catch (error: any) {
    logger.error('Error deleting project', { error: error.message, projectId, userId });
    throw error;
  }
}

/**
 * Validate project ownership
 * @param projectId - Project ID
 * @param userId - User ID
 * @returns True if user owns the project
 * @throws Error if project not found or user doesn't own it
 */
export async function validateOwnership(projectId: string, userId: string): Promise<boolean> {
  try {
    const result = await pool.query(
      'SELECT user_id FROM projects WHERE id = $1',
      [projectId]
    );

    if (result.rows.length === 0) {
      throw new Error('Project not found');
    }

    if (result.rows[0].user_id !== userId) {
      throw new Error('You do not have permission to access this project');
    }

    return true;
  } catch (error: any) {
    logger.error('Error validating ownership', { error: error.message, projectId, userId });
    throw error;
  }
}

/**
 * Validate team composition structure
 */
function validateTeamComposition(teamComposition: TeamMember[]): void {
  const validExperienceLevels = ['Junior', 'Mid', 'Senior'];

  for (const member of teamComposition) {
    if (!member.role || member.role.trim().length === 0) {
      throw new Error('Team member role is required');
    }

    if (!member.count || member.count <= 0) {
      throw new Error('Team member count must be a positive number');
    }

    if (!member.experienceLevel || !validExperienceLevels.includes(member.experienceLevel)) {
      throw new Error(
        `Invalid experience level. Must be one of: ${validExperienceLevels.join(', ')}`
      );
    }
  }
}

/**
 * Validate technology stack structure
 */
function validateTechnologyStack(technologyStack: Technology[]): void {
  const validCategories = ['Frontend', 'Backend', 'Database', 'DevOps', 'Other'];
  const validMaturityLevels = ['Stable', 'Emerging', 'Experimental'];

  for (const tech of technologyStack) {
    if (!tech.name || tech.name.trim().length === 0) {
      throw new Error('Technology name is required');
    }

    if (!tech.category || !validCategories.includes(tech.category)) {
      throw new Error(`Invalid technology category. Must be one of: ${validCategories.join(', ')}`);
    }

    if (!tech.maturity || !validMaturityLevels.includes(tech.maturity)) {
      throw new Error(
        `Invalid technology maturity level. Must be one of: ${validMaturityLevels.join(', ')}`
      );
    }
  }
}

/**
 * Helper function to map database row to Project object
 */
function mapRowToProject(row: any): Project {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    startDate: row.start_date,
    endDate: row.end_date,
    budget: parseFloat(row.budget),
    teamSize: row.team_size,
    teamComposition: row.team_composition,
    technologyStack: row.technology_stack,
    scope: row.scope,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
