import { Router } from 'express';
import {
  createProjectHandler,
  getProjectsHandler,
  getProjectByIdHandler,
  updateProjectHandler,
  deleteProjectHandler,
} from '../controllers/projectController';
import { authenticate } from '../middleware/auth';

/**
 * Project Routes
 * Defines all project management API endpoints
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4
 */

const router = Router();

// All project routes require authentication
router.use(authenticate);

// Project CRUD operations
router.post('/', createProjectHandler);
router.get('/', getProjectsHandler);
router.get('/:id', getProjectByIdHandler);
router.put('/:id', updateProjectHandler);
router.delete('/:id', deleteProjectHandler);

export default router;
