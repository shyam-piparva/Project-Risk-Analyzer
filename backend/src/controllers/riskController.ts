import { Response } from 'express';
import Joi from 'joi';
import axios from 'axios';
import { getProjectById } from '../services/projectService';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';
import { analyzeProjectFallback } from '../services/riskAnalysisFallback';
import { compareAnalyses, RiskAnalysis } from '../services/analysisComparisonService';

/**
 * Risk Analysis Controllers
 * Handles HTTP requests for risk analysis operations
 * Acts as a proxy to the Python Risk Analysis Engine
 * Validates: Requirements 3.1, 3.7, 5.3, 5.4, 7.1, 7.2, 7.3
 */

const RISK_ENGINE_URL = process.env.RISK_ENGINE_URL || 'http://localhost:5001';

// Validation schemas using Joi
const addMitigationSchema = Joi.object({
  strategy: Joi.string().trim().min(1).required().messages({
    'string.empty': 'Mitigation strategy is required',
    'any.required': 'Mitigation strategy is required',
  }),
  priority: Joi.string().valid('High', 'Medium', 'Low').default('Medium').messages({
    'any.only': 'Priority must be High, Medium, or Low',
  }),
  estimatedEffort: Joi.string().trim().default('TBD').messages({
    'string.base': 'Estimated effort must be a string',
  }),
});

const updateRiskStatusSchema = Joi.object({
  status: Joi.string()
    .valid('Open', 'In Progress', 'Mitigated', 'Resolved', 'Accepted')
    .required()
    .messages({
      'any.only': 'Status must be Open, In Progress, Mitigated, Resolved, or Accepted',
      'any.required': 'Status is required',
    }),
  resolved: Joi.boolean().default(false).messages({
    'boolean.base': 'Resolved must be a boolean',
  }),
});

/**
 * POST /api/projects/:id/analyze
 * Trigger risk analysis for a project
 * Validates: Requirement 3.1, 7.1
 */
export const analyzeProjectHandler = async (req: AuthRequest, res: Response): Promise<void> => {
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
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid project ID format',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Get project and verify ownership
    const project = await getProjectById(projectId, req.user.userId);

    // Transform project data for Python API
    const requestData = {
      project: {
        id: project.id,
        name: project.name,
        description: project.description || '',
        start_date: project.startDate.toISOString().split('T')[0],
        end_date: project.endDate.toISOString().split('T')[0],
        budget: project.budget,
        team_size: project.teamSize,
        team_composition: project.teamComposition.map((member) => ({
          role: member.role,
          count: member.count,
          experience_level: member.experienceLevel,
        })),
        technology_stack: project.technologyStack.map((tech) => ({
          name: tech.name,
          category: tech.category,
          maturity: tech.maturity,
        })),
        scope: project.scope || '',
      },
      user_id: req.user.userId,
    };

    // Call Python risk engine
    const response = await axios.post(
      `${RISK_ENGINE_URL}/api/projects/${projectId}/analyze`,
      requestData,
      {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          Authorization: req.headers.authorization || '',
        },
      }
    );

    logger.info('Risk analysis completed', {
      projectId,
      userId: req.user.userId,
      risksCount: response.data.risks_count,
    });

    res.status(201).json({
      message: 'Risk analysis completed successfully',
      analysisId: response.data.analysis_id,
      projectId: response.data.project_id,
      overallScore: response.data.overall_score,
      analyzedAt: response.data.analyzed_at,
      risksCount: response.data.risks_count,
      metadata: response.data.metadata,
    });
  } catch (error: any) {
    logger.error('Analyze project error', {
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

    if (axios.isAxiosError(error)) {
      if (error.response) {
        res.status(error.response.status).json({
          error: error.response.data.error || 'ServerError',
          message: error.response.data.message || 'Risk analysis failed',
          timestamp: new Date().toISOString(),
        });
        return;
      } else if (error.request) {
        res.status(503).json({
          error: 'ServiceUnavailable',
          message: 'Risk analysis service is currently unavailable. Please try again later.',
          timestamp: new Date().toISOString(),
        });
        return;
      }
    }

    res.status(500).json({
      error: 'ServerError',
      message: 'An error occurred during risk analysis',
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * GET /api/projects/:id/risks
 * Get latest risk analysis for a project
 * Validates: Requirement 3.7
 */
export const getProjectRisksHandler = async (req: AuthRequest, res: Response): Promise<void> => {
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
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid project ID format',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Verify project ownership and get project data
    const project = await getProjectById(projectId, req.user.userId);

    try {
      // Try to call Python risk engine first
      const response = await axios.get(`${RISK_ENGINE_URL}/api/projects/${projectId}/risks`, {
        timeout: 5000,
        headers: {
          Authorization: req.headers.authorization || '',
        },
      });

      logger.info('Project risks retrieved from Python engine', {
        projectId,
        userId: req.user.userId,
        risksCount: response.data.risks.length,
      });

      res.status(200).json({
        message: 'Risks retrieved successfully',
        analysisId: response.data.analysis_id,
        projectId: response.data.project_id,
        overallScore: response.data.overall_score,
        analyzedAt: response.data.analyzed_at,
        risks: response.data.risks,
        metadata: response.data.metadata,
      });
      return;
    } catch (pythonError: any) {
      // If Python service is unavailable, use fallback
      logger.warn('Python risk engine unavailable, using fallback', {
        projectId,
        error: pythonError.message,
      });

      try {
        // Use fallback analysis
        const analysis = await analyzeProjectFallback(project);

        logger.info('Project risks generated using fallback engine', {
          projectId,
          userId: req.user.userId,
          risksCount: analysis.risks.length,
        });

        res.status(200).json({
          message: 'Risks retrieved successfully (using fallback engine)',
          analysisId: analysis.id,
          projectId: analysis.projectId,
          overallScore: analysis.overallScore,
          analyzedAt: analysis.analyzedAt,
          risks: analysis.risks,
          metadata: analysis.metadata,
        });
        return;
      } catch (fallbackError: any) {
        logger.error('Fallback analysis failed', {
          projectId,
          error: fallbackError.message,
          stack: fallbackError.stack,
        });
        
        res.status(500).json({
          error: 'ServerError',
          message: 'Risk analysis service is unavailable and fallback failed',
          timestamp: new Date().toISOString(),
        });
        return;
      }
    }
  } catch (error: any) {
    logger.error('Get project risks error', {
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
      message: 'An error occurred while retrieving risks',
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * GET /api/projects/:id/risks/history
 * Get risk analysis history for a project
 * Validates: Requirement 7.1, 7.2
 */
export const getRiskHistoryHandler = async (req: AuthRequest, res: Response): Promise<void> => {
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
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid project ID format',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Verify project ownership
    await getProjectById(projectId, req.user.userId);

    // Get limit from query params
    const limit = parseInt(req.query.limit as string) || 10;

    if (limit < 1 || limit > 100) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Limit must be between 1 and 100',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Call Python risk engine
    const response = await axios.get(
      `${RISK_ENGINE_URL}/api/projects/${projectId}/risks/history`,
      {
        params: { limit },
        timeout: 5000,
        headers: {
          Authorization: req.headers.authorization || '',
        },
      }
    );

    logger.info('Risk history retrieved', {
      projectId,
      userId: req.user.userId,
      count: response.data.count,
    });

    res.status(200).json({
      message: 'Risk history retrieved successfully',
      projectId: response.data.project_id,
      count: response.data.count,
      analyses: response.data.analyses,
    });
  } catch (error: any) {
    logger.error('Get risk history error', {
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

    if (axios.isAxiosError(error)) {
      if (error.response) {
        res.status(error.response.status).json({
          error: error.response.data.error || 'ServerError',
          message: error.response.data.message || 'Failed to retrieve risk history',
          timestamp: new Date().toISOString(),
        });
        return;
      } else if (error.request) {
        res.status(503).json({
          error: 'ServiceUnavailable',
          message: 'Risk analysis service is currently unavailable. Please try again later.',
          timestamp: new Date().toISOString(),
        });
        return;
      }
    }

    res.status(500).json({
      error: 'ServerError',
      message: 'An error occurred while retrieving risk history',
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * GET /api/risks/:id
 * Get a specific risk with mitigations
 */
export const getRiskByIdHandler = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const riskId = req.params.id;

    // Validate risk ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(riskId)) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid risk ID format',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Call Python risk engine
    const response = await axios.get(`${RISK_ENGINE_URL}/api/risks/${riskId}`, {
      timeout: 5000,
      headers: {
        Authorization: req.headers.authorization || '',
      },
    });

    logger.info('Risk retrieved', {
      riskId,
      userId: req.user.userId,
    });

    res.status(200).json({
      message: 'Risk retrieved successfully',
      risk: response.data,
    });
  } catch (error: any) {
    logger.error('Get risk by ID error', {
      error: error.message,
      riskId: req.params.id,
      userId: req.user?.userId,
    });

    if (axios.isAxiosError(error)) {
      if (error.response) {
        res.status(error.response.status).json({
          error: error.response.data.error || 'ServerError',
          message: error.response.data.message || 'Failed to retrieve risk',
          timestamp: new Date().toISOString(),
        });
        return;
      } else if (error.request) {
        res.status(503).json({
          error: 'ServiceUnavailable',
          message: 'Risk analysis service is currently unavailable. Please try again later.',
          timestamp: new Date().toISOString(),
        });
        return;
      }
    }

    res.status(500).json({
      error: 'ServerError',
      message: 'An error occurred while retrieving the risk',
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * POST /api/risks/:id/mitigations
 * Add custom mitigation to a risk
 * Validates: Requirement 5.4
 */
export const addMitigationHandler = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const riskId = req.params.id;

    // Validate risk ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(riskId)) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid risk ID format',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Validate request body
    const { error, value } = addMitigationSchema.validate(req.body);

    if (error) {
      res.status(400).json({
        error: 'ValidationError',
        message: error.details[0].message,
        field: error.details[0].path.join('.'),
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Transform to Python API format
    const requestData = {
      strategy: value.strategy,
      priority: value.priority,
      estimated_effort: value.estimatedEffort,
    };

    // Call Python risk engine
    const response = await axios.post(
      `${RISK_ENGINE_URL}/api/risks/${riskId}/mitigations`,
      requestData,
      {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
          Authorization: req.headers.authorization || '',
        },
      }
    );

    logger.info('Mitigation added', {
      riskId,
      userId: req.user.userId,
      mitigationId: response.data.id,
    });

    res.status(201).json({
      message: 'Mitigation added successfully',
      mitigation: {
        id: response.data.id,
        riskId: response.data.risk_id,
        strategy: response.data.strategy,
        priority: response.data.priority,
        estimatedEffort: response.data.estimated_effort,
        isImplemented: response.data.is_implemented,
        isCustom: response.data.is_custom,
        createdAt: response.data.created_at,
      },
    });
  } catch (error: any) {
    logger.error('Add mitigation error', {
      error: error.message,
      riskId: req.params.id,
      userId: req.user?.userId,
    });

    if (axios.isAxiosError(error)) {
      if (error.response) {
        res.status(error.response.status).json({
          error: error.response.data.error || 'ServerError',
          message: error.response.data.message || 'Failed to add mitigation',
          timestamp: new Date().toISOString(),
        });
        return;
      } else if (error.request) {
        res.status(503).json({
          error: 'ServiceUnavailable',
          message: 'Risk analysis service is currently unavailable. Please try again later.',
          timestamp: new Date().toISOString(),
        });
        return;
      }
    }

    res.status(500).json({
      error: 'ServerError',
      message: 'An error occurred while adding the mitigation',
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * PUT /api/mitigations/:id/implement
 * Mark mitigation as implemented
 * Validates: Requirement 5.3, 7.5
 */
export const implementMitigationHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
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

    const mitigationId = req.params.id;

    // Validate mitigation ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(mitigationId)) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid mitigation ID format',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Call Python risk engine
    const response = await axios.put(
      `${RISK_ENGINE_URL}/api/mitigations/${mitigationId}/implement`,
      {},
      {
        timeout: 5000,
        headers: {
          Authorization: req.headers.authorization || '',
        },
      }
    );

    logger.info('Mitigation marked as implemented', {
      mitigationId,
      userId: req.user.userId,
    });

    res.status(200).json({
      message: 'Mitigation marked as implemented successfully',
      mitigation: {
        id: response.data.id,
        riskId: response.data.risk_id,
        strategy: response.data.strategy,
        isImplemented: response.data.is_implemented,
        implementedAt: response.data.implemented_at,
      },
    });
  } catch (error: any) {
    logger.error('Implement mitigation error', {
      error: error.message,
      mitigationId: req.params.id,
      userId: req.user?.userId,
    });

    if (axios.isAxiosError(error)) {
      if (error.response) {
        res.status(error.response.status).json({
          error: error.response.data.error || 'ServerError',
          message: error.response.data.message || 'Failed to mark mitigation as implemented',
          timestamp: new Date().toISOString(),
        });
        return;
      } else if (error.request) {
        res.status(503).json({
          error: 'ServiceUnavailable',
          message: 'Risk analysis service is currently unavailable. Please try again later.',
          timestamp: new Date().toISOString(),
        });
        return;
      }
    }

    res.status(500).json({
      error: 'ServerError',
      message: 'An error occurred while marking the mitigation as implemented',
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * PUT /api/risks/:id/status
 * Update risk status
 * Validates: Requirement 5.3, 7.5
 */
export const updateRiskStatusHandler = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const riskId = req.params.id;

    // Validate risk ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(riskId)) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid risk ID format',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Validate request body
    const { error, value } = updateRiskStatusSchema.validate(req.body);

    if (error) {
      res.status(400).json({
        error: 'ValidationError',
        message: error.details[0].message,
        field: error.details[0].path.join('.'),
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Call Python risk engine
    const response = await axios.put(
      `${RISK_ENGINE_URL}/api/risks/${riskId}/status`,
      {
        status: value.status,
        resolved: value.resolved,
      },
      {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
          Authorization: req.headers.authorization || '',
        },
      }
    );

    logger.info('Risk status updated', {
      riskId,
      userId: req.user.userId,
      status: value.status,
    });

    res.status(200).json({
      message: 'Risk status updated successfully',
      risk: {
        id: response.data.id,
        title: response.data.title,
        status: response.data.status,
        resolvedAt: response.data.resolved_at,
      },
    });
  } catch (error: any) {
    logger.error('Update risk status error', {
      error: error.message,
      riskId: req.params.id,
      userId: req.user?.userId,
    });

    if (axios.isAxiosError(error)) {
      if (error.response) {
        res.status(error.response.status).json({
          error: error.response.data.error || 'ServerError',
          message: error.response.data.message || 'Failed to update risk status',
          timestamp: new Date().toISOString(),
        });
        return;
      } else if (error.request) {
        res.status(503).json({
          error: 'ServiceUnavailable',
          message: 'Risk analysis service is currently unavailable. Please try again later.',
          timestamp: new Date().toISOString(),
        });
        return;
      }
    }

    res.status(500).json({
      error: 'ServerError',
      message: 'An error occurred while updating the risk status',
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * GET /api/analyses/compare
 * Compare two risk analyses
 * Validates: Requirement 7.3
 */
export const compareAnalysesHandler = async (req: AuthRequest, res: Response): Promise<void> => {
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

    // Get analysis IDs from query params
    const oldAnalysisId = req.query.oldAnalysisId as string;
    const newAnalysisId = req.query.newAnalysisId as string;

    // Validate analysis IDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!oldAnalysisId || !uuidRegex.test(oldAnalysisId)) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Valid oldAnalysisId is required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!newAnalysisId || !uuidRegex.test(newAnalysisId)) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Valid newAnalysisId is required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Fetch both analyses from Python risk engine
    const [oldAnalysisResponse, newAnalysisResponse] = await Promise.all([
      axios.get(`${RISK_ENGINE_URL}/api/analyses/${oldAnalysisId}`, {
        timeout: 5000,
        headers: {
          Authorization: req.headers.authorization || '',
        },
      }),
      axios.get(`${RISK_ENGINE_URL}/api/analyses/${newAnalysisId}`, {
        timeout: 5000,
        headers: {
          Authorization: req.headers.authorization || '',
        },
      }),
    ]);

    // Transform Python API response to our format
    const oldAnalysis: RiskAnalysis = {
      id: oldAnalysisResponse.data.analysis_id || oldAnalysisResponse.data.id,
      projectId: oldAnalysisResponse.data.project_id,
      overallScore: oldAnalysisResponse.data.overall_score,
      analyzedAt: oldAnalysisResponse.data.analyzed_at,
      risks: oldAnalysisResponse.data.risks.map((risk: any) => ({
        id: risk.id,
        title: risk.title,
        description: risk.description,
        category: risk.category,
        score: risk.score,
        probability: risk.probability,
        impact: risk.impact,
        status: risk.status,
      })),
    };

    const newAnalysis: RiskAnalysis = {
      id: newAnalysisResponse.data.analysis_id || newAnalysisResponse.data.id,
      projectId: newAnalysisResponse.data.project_id,
      overallScore: newAnalysisResponse.data.overall_score,
      analyzedAt: newAnalysisResponse.data.analyzed_at,
      risks: newAnalysisResponse.data.risks.map((risk: any) => ({
        id: risk.id,
        title: risk.title,
        description: risk.description,
        category: risk.category,
        score: risk.score,
        probability: risk.probability,
        impact: risk.impact,
        status: risk.status,
      })),
    };

    // Verify project ownership
    await getProjectById(oldAnalysis.projectId, req.user.userId);

    // Compare the analyses
    const comparison = compareAnalyses(oldAnalysis, newAnalysis);

    logger.info('Analyses compared', {
      oldAnalysisId,
      newAnalysisId,
      userId: req.user.userId,
      projectId: oldAnalysis.projectId,
    });

    res.status(200).json({
      message: 'Analyses compared successfully',
      comparison,
    });
  } catch (error: any) {
    logger.error('Compare analyses error', {
      error: error.message,
      oldAnalysisId: req.query.oldAnalysisId,
      newAnalysisId: req.query.newAnalysisId,
      userId: req.user?.userId,
    });

    if (error.message === 'Cannot compare analyses from different projects') {
      res.status(400).json({
        error: 'ValidationError',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

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

    if (axios.isAxiosError(error)) {
      if (error.response) {
        res.status(error.response.status).json({
          error: error.response.data.error || 'ServerError',
          message: error.response.data.message || 'Failed to retrieve analyses',
          timestamp: new Date().toISOString(),
        });
        return;
      } else if (error.request) {
        res.status(503).json({
          error: 'ServiceUnavailable',
          message: 'Risk analysis service is currently unavailable. Please try again later.',
          timestamp: new Date().toISOString(),
        });
        return;
      }
    }

    res.status(500).json({
      error: 'ServerError',
      message: 'An error occurred while comparing analyses',
      timestamp: new Date().toISOString(),
    });
  }
};
