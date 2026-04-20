import request from 'supertest';
import express, { Express } from 'express';
import projectRoutes from '../routes/projectRoutes';
import * as projectService from '../services/projectService';
import { generateTokens } from '../utils/jwt';

// Mock the project service
jest.mock('../services/projectService');
jest.mock('../utils/logger');

const mockProjectService = projectService as jest.Mocked<typeof projectService>;

describe('Project Controller', () => {
  let app: Express;
  let authToken: string;
  const userId = 'test-user-id';

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/projects', projectRoutes);

    // Generate a valid token for testing
    const tokens = generateTokens({ userId, email: 'test@example.com' });
    authToken = tokens.accessToken;

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('POST /api/projects', () => {
    const validProjectData = {
      name: 'Test Project',
      description: 'Test Description',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      budget: 100000,
      teamSize: 5,
      teamComposition: [
        { role: 'Developer', count: 3, experienceLevel: 'Mid' as const },
        { role: 'Designer', count: 2, experienceLevel: 'Senior' as const },
      ],
      technologyStack: [
        { name: 'React', category: 'Frontend' as const, maturity: 'Stable' as const },
        { name: 'Node.js', category: 'Backend' as const, maturity: 'Stable' as const },
      ],
      scope: 'Build a web application',
    };

    it('should create a project with valid data', async () => {
      const mockProject: projectService.Project = {
        id: 'project-id',
        userId,
        name: validProjectData.name,
        description: validProjectData.description,
        startDate: new Date(validProjectData.startDate),
        endDate: new Date(validProjectData.endDate),
        budget: validProjectData.budget,
        teamSize: validProjectData.teamSize,
        teamComposition: validProjectData.teamComposition,
        technologyStack: validProjectData.technologyStack,
        scope: validProjectData.scope,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockProjectService.createProject.mockResolvedValue(mockProject);

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validProjectData);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Project created successfully');
      expect(response.body.project).toHaveProperty('id');
      expect(response.body.project.name).toBe(validProjectData.name);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/projects')
        .send(validProjectData);

      expect(response.status).toBe(401);
    });

    it('should return 400 for missing required fields', async () => {
      const invalidData = { name: 'Test' };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('ValidationError');
    });

    it('should return 400 for end date before start date', async () => {
      const invalidData = {
        ...validProjectData,
        startDate: '2024-12-31',
        endDate: '2024-01-01',
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('ValidationError');
    });
  });

  describe('GET /api/projects', () => {
    it('should return all projects for authenticated user', async () => {
      const mockProjects: projectService.Project[] = [
        {
          id: 'project-1',
          userId,
          name: 'Project 1',
          description: 'Description 1',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          budget: 100000,
          teamSize: 5,
          teamComposition: [],
          technologyStack: [],
          scope: 'Scope 1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockProjectService.getUserProjects.mockResolvedValue(mockProjects);

      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.projects).toHaveLength(1);
      expect(response.body.count).toBe(1);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/projects');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/projects/:id', () => {
    const projectId = '123e4567-e89b-12d3-a456-426614174000';

    it('should return a project by ID', async () => {
      const mockProject: projectService.Project = {
        id: projectId,
        userId,
        name: 'Test Project',
        description: 'Description',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        budget: 100000,
        teamSize: 5,
        teamComposition: [],
        technologyStack: [],
        scope: 'Scope',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockProjectService.getProjectById.mockResolvedValue(mockProject);

      const response = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.project.id).toBe(projectId);
    });

    it('should return 404 for non-existent project', async () => {
      mockProjectService.getProjectById.mockRejectedValue(new Error('Project not found'));

      const response = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app)
        .get('/api/projects/invalid-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('ValidationError');
    });
  });

  describe('PUT /api/projects/:id', () => {
    const projectId = '123e4567-e89b-12d3-a456-426614174000';

    it('should update a project', async () => {
      const updateData = { name: 'Updated Name' };
      const mockProject: projectService.Project = {
        id: projectId,
        userId,
        name: 'Updated Name',
        description: 'Description',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        budget: 100000,
        teamSize: 5,
        teamComposition: [],
        technologyStack: [],
        scope: 'Scope',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockProjectService.updateProject.mockResolvedValue(mockProject);

      const response = await request(app)
        .put(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.project.name).toBe('Updated Name');
    });

    it('should return 403 for unauthorized access', async () => {
      mockProjectService.updateProject.mockRejectedValue(
        new Error('You do not have permission to access this project')
      );

      const response = await request(app)
        .put(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated' });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/projects/:id', () => {
    const projectId = '123e4567-e89b-12d3-a456-426614174000';

    it('should delete a project', async () => {
      mockProjectService.deleteProject.mockResolvedValue();

      const response = await request(app)
        .delete(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Project deleted successfully');
    });

    it('should return 404 for non-existent project', async () => {
      mockProjectService.deleteProject.mockRejectedValue(new Error('Project not found'));

      const response = await request(app)
        .delete(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
});
