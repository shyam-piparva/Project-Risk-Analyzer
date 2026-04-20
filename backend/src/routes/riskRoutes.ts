import { Router } from 'express';
import {
  analyzeProjectHandler,
  getProjectRisksHandler,
  getRiskHistoryHandler,
  getRiskByIdHandler,
  addMitigationHandler,
  implementMitigationHandler,
  updateRiskStatusHandler,
} from '../controllers/riskController';
import { authenticate } from '../middleware/auth';

/**
 * Risk Analysis Routes
 * Defines all risk analysis API endpoints
 * Validates: Requirements 3.1, 3.7, 5.3, 5.4, 7.1, 7.2, 7.3
 */

const router = Router();

// All risk routes require authentication
router.use(authenticate);

// Project risk analysis endpoints
router.post('/projects/:id/analyze', analyzeProjectHandler);
router.get('/projects/:id/risks', getProjectRisksHandler);
router.get('/projects/:id/risks/history', getRiskHistoryHandler);

// Individual risk endpoints
router.get('/risks/:id', getRiskByIdHandler);
router.post('/risks/:id/mitigations', addMitigationHandler);
router.put('/risks/:id/status', updateRiskStatusHandler);

// Mitigation endpoints
router.put('/mitigations/:id/implement', implementMitigationHandler);

export default router;
