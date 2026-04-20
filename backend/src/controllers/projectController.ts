import { Response } from 'express';
import Joi from 'joi';
import {
  createProject,
  getUserProjects,
  getProjectById,
  updateProject,
  deleteProject,
} from '../services/projectService';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';

/**
 * Project Controllers
 * Handles HTTP requests for project management
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4
 */

// Validation schemas using Joi
const teamMemberSchema = Joi.object({
  role: Joi.string().trim().min(1).required().messages({
    'string.empty': 'Team member role is required',
    'any.required': 'Team member role is required',
  }),
  count: Joi.number().integer().min(1).required().messages({
    'number.min': 'Team member count must be at least 1',
    'any.required': 'Team member count is required',
  }),
  experienceLevel: Joi.string().valid('Junior', 'Mid', 'Senior').required().messages({
    'any.only': 'Experience level must be Junior, Mid, or Senior',
    'any.required': 'Experience level is required',
  }),
});

const technologySchema = Joi.object({
  name: Joi.string().trim().min(1).required().messages({
    'string.empty': 'Technology name is required',
    'any.required': 'Technology name is required',
  }),
  category: Joi.string()
    .valid('Frontend', 'Backend', 'Database', 'DevOps', 'Other')
    .required()
    .messages({
      'any.only': 'Category must be Frontend, Backend, Database, DevOps, or Other',
      'any.required': 'Technology category is required',
    }),
  maturity: Joi.string().valid('Stable', 'Emerging', 'Experimental').required().messages({
    'any.only': 'Maturity must be Stable, Emerging, or Experimental',
    'any.required': 'Technology maturity is required',
  }),
});

const createProjectSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).required().messages({
    'string.empty': 'Project name is required',
    'string.max': 'Project name must be less than 255 characters',
    'any.required': 'Project name is required',
  }),
  description: Joi.string().trim().allow('').optional(),
  startDate: Joi.date().iso().required().messages({
    'date.base': 'Start date must be a valid date',
    'any.required': 'Start date is required',
  }),
  endDate: Joi.date().iso().greater(Joi.ref('startDate')).required().messages({
    'date.base': 'End date must be a valid date',
    'date.greater': 'End date must be after start date',
    'any.required': 'End date is required',
  }),
  budget: Joi.number().positive().required().messages({
    'number.positive': 'Budget must be a positive number',
    'any.required': 'Budget is required',
  }),
  teamSize: Joi.number().integer().min(1).required().messages({
    'number.min': 'Team size must be at least 1',
    'any.required': 'Team size is required',
  }),
  teamComposition: Joi.array().items(teamMemberSchema).min(1).required().messages({
    'array.min': 'At least one team member is required',
    'any.required': 'Team composition is required',
  }),
  technologyStack: Joi.array().items(technologySchema).min(1).required().messages({
    'array.min': 'At least one technology is required',
    'any.required': 'Technology stack is required',
  }),
  scope: Joi.string().trim().allow('').optional(),
});

const updateProjectSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).optional().messages({
    'string.empty': 'Project name cannot be empty',
    'string.max': 'Project name must be less than 255 characters',
  }),
  description: Joi.string().trim().allow('').optional(),
  startDate: Joi.date().iso().optional().messages({
    'date.base': 'Start date must be a valid date',
  }),
  endDate: Joi.date().iso().optional().messages({
    'date.base': 'End date must be a valid date',
  }),
  budget: Joi.number().positive().optional().messages({
    'number.positive': 'Budget must be a positive number',
  }),
  teamSize: Joi.number().integer().min(1).optional().messages({
    'number.min': 'Team size must be at least 1',
  }),
  teamComposition: Joi.array().items(teamMemberSchema).min(1).optional().messages({
    'array.min': 'At least one team member is required',
  }),
  technologyStack: Joi.array().items(technologySchema).min(1).optional().messages({
    'array.min': 'At least one technology is required',
  }),
  scope: Joi.string().trim().allow('').optional(),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

/**
 * POST /api/projects
 * Create a new project
 * Validates: Requirement 2.1
 */
export const createProjectHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      res.status(401).json({
        error: 'AuthenticationError',
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Validate request body
    const { error, value } = createProjectSchema.validate(req.body);

    if (error) {
      res.status(400).json({
        error: 'ValidationError',
        message: error.details[0].message,
        field: error.details[0].path.join('.'),
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Create project
    const project = await createProject(req.user.userId, value);

    logger.info('Project created via API', { projectId: project.id, userId: req.user.userId });

    res.status(201).json({
      message: 'Project created successfully',
      project: {
        id: project.id,
        userId: project.userId,
        name: project.name,
        description: project.description,
        startDate: project.startDate,
        endDate: project.endDate,
        budget: project.budget,
        teamSize: project.teamSize,
        teamComposition: project.teamComposition,
        technologyStack: project.technologyStack,
        scope: project.scope,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
    });
  } catch (error: any) {
    logger.error('Create project error', { error: error.message, userId: req.user?.userId });

    // Handle specific validation errors from service
    if (
      error.message.includes('required') ||
      error.message.includes('must be') ||
      error.message.includes('Invalid') ||
      error.message.includes('cannot be empty')
    ) {
      res.status(400).json({
        error: 'ValidationError',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(500).json({
      error: 'ServerError',
      message: 'An error occurred while creating the project',
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * GET /api/projects
 * Get all projects for the authenticated user
 * Validates: Requirement 2.3
 */
export const getProjectsHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      res.status(401).json({
        error: 'AuthenticationError',
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Get user's projects
    const projects = await getUserProjects(req.user.userId);

    logger.info('Projects retrieved via API', {
      userId: req.user.userId,
      count: projects.length,
    });

    res.status(200).json({
      message: 'Projects retrieved successfully',
      count: projects.length,
      projects: projects.map((project) => ({
        id: project.id,
        userId: project.userId,
        name: project.name,
        description: project.description,
        startDate: project.startDate,
        endDate: project.endDate,
        budget: project.budget,
        teamSize: project.teamSize,
        teamComposition: project.teamComposition,
        technologyStack: project.technologyStack,
        scope: project.scope,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      })),
    });
  } catch (error: any) {
    logger.error('Get projects error', { error: error.message, userId: req.user?.userId });

    res.status(500).json({
      error: 'ServerError',
      message: 'An error occurred while retrieving projects',
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * GET /api/projects/:id
 * Get a single project by ID
 * Validates: Requirement 2.3
 */
export const getProjectByIdHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      res.status(401).json({
        error: 'AuthenticationError',
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const projectId = req.params.id;

    // Validate project ID format (UUID)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid project ID format',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Get project
    const project = await getProjectById(projectId, req.user.userId);

    logger.info('Project retrieved via API', { projectId, userId: req.user.userId });

    res.status(200).json({
      message: 'Project retrieved successfully',
      project: {
        id: project.id,
        userId: project.userId,
        name: project.name,
        description: project.description,
        startDate: project.startDate,
        endDate: project.endDate,
        budget: project.budget,
        teamSize: project.teamSize,
        teamComposition: project.teamComposition,
        technologyStack: project.technologyStack,
        scope: project.scope,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
    });
  } catch (error: any) {
    logger.error('Get project by ID error', {
      error: error.message,
      projectId: req.params.id,
      userId: req.user?.userId,
    });

    if (error.message === 'Project not found') {
      res.status(404).json({
        error: 'NotFoundError',
        message: 'Project not found',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (error.message === 'You do not have permission to access this project') {
      res.status(403).json({
        error: 'AuthorizationError',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(500).json({
      error: 'ServerError',
      message: 'An error occurred while retrieving the project',
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * PUT /api/projects/:id
 * Update a project
 * Validates: Requirement 2.2
 */
export const updateProjectHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      res.status(401).json({
        error: 'AuthenticationError',
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const projectId = req.params.id;

    // Validate project ID format (UUID)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid project ID format',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Validate request body
    const { error, value } = updateProjectSchema.validate(req.body);

    if (error) {
      res.status(400).json({
        error: 'ValidationError',
        message: error.details[0].message,
        field: error.details[0].path.join('.'),
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Update project
    const project = await updateProject(projectId, req.user.userId, value);

    logger.info('Project updated via API', { projectId, userId: req.user.userId });

    res.status(200).json({
      message: 'Project updated successfully',
      project: {
        id: project.id,
        userId: project.userId,
        name: project.name,
        description: project.description,
        startDate: project.startDate,
        endDate: project.endDate,
        budget: project.budget,
        teamSize: project.teamSize,
        teamComposition: project.teamComposition,
        technologyStack: project.technologyStack,
        scope: project.scope,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
    });
  } catch (error: any) {
    logger.error('Update project error', {
      error: error.message,
      projectId: req.params.id,
      userId: req.user?.userId,
    });

    if (error.message === 'Project not found') {
      res.status(404).json({
        error: 'NotFoundError',
        message: 'Project not found',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (error.message === 'You do not have permission to access this project') {
      res.status(403).json({
        error: 'AuthorizationError',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Handle specific validation errors from service
    if (
      error.message.includes('required') ||
      error.message.includes('must be') ||
      error.message.includes('Invalid') ||
      error.message.includes('cannot be empty')
    ) {
      res.status(400).json({
        error: 'ValidationError',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(500).json({
      error: 'ServerError',
      message: 'An error occurred while updating the project',
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * DELETE /api/projects/:id
 * Delete a project
 * Validates: Requirement 2.4
 */
export const deleteProjectHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      res.status(401).json({
        error: 'AuthenticationError',
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const projectId = req.params.id;

    // Validate project ID format (UUID)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid project ID format',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Delete project
    await deleteProject(projectId, req.user.userId);

    logger.info('Project deleted via API', { projectId, userId: req.user.userId });

    res.status(200).json({
      message: 'Project deleted successfully',
    });
  } catch (error: any) {
    logger.error('Delete project error', {
      error: error.message,
      projectId: req.params.id,
      userId: req.user?.userId,
    });

    if (error.message === 'Project not found') {
      res.status(404).json({
        error: 'NotFoundError',
        message: 'Project not found',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (error.message === 'You do not have permission to access this project') {
      res.status(403).json({
        error: 'AuthorizationError',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(500).json({
      error: 'ServerError',
      message: 'An error occurred while deleting the project',
      timestamp: new Date().toISOString(),
    });
  }
};
