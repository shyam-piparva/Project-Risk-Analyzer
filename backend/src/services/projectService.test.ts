import {
  createProject,
  getUserProjects,
  getProjectById,
  updateProject,
  deleteProject,
  validateOwnership,
  CreateProjectDTO,
  UpdateProjectDTO,
  TeamMember,
  Technology,
} from './projectService';
import { pool } from '../config/database';

// Mock the database pool
jest.mock('../config/database', () => ({
  pool: {
    query: jest.fn(),
  },
}));

// Mock the logger
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('ProjectService', () => {
  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
  const mockProjectId = '123e4567-e89b-12d3-a456-426614174001';

  const mockTeamComposition: TeamMember[] = [
    { role: 'Developer', count: 3, experienceLevel: 'Mid' },
    { role: 'Designer', count: 1, experienceLevel: 'Senior' },
  ];

  const mockTechnologyStack: Technology[] = [
    { name: 'React', category: 'Frontend', maturity: 'Stable' },
    { name: 'Node.js', category: 'Backend', maturity: 'Stable' },
  ];

  const mockProjectData: CreateProjectDTO = {
    name: 'Test Project',
    description: 'Test Description',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    budget: 100000,
    teamSize: 4,
    teamComposition: mockTeamComposition,
    technologyStack: mockTechnologyStack,
    scope: 'Test Scope',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createProject', () => {
    it('should create a project successfully', async () => {
      const mockResult = {
        rows: [
          {
            id: mockProjectId,
            user_id: mockUserId,
            name: 'Test Project',
            description: 'Test Description',
            start_date: new Date('2024-01-01'),
            end_date: new Date('2024-12-31'),
            budget: '100000.00',
            team_size: 4,
            team_composition: mockTeamComposition,
            technology_stack: mockTechnologyStack,
            scope: 'Test Scope',
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      };

      (pool.query as jest.Mock).mockResolvedValue(mockResult);

      const result = await createProject(mockUserId, mockProjectData);

      expect(result.id).toBe(mockProjectId);
      expect(result.name).toBe('Test Project');
      expect(result.userId).toBe(mockUserId);
      expect(pool.query).toHaveBeenCalledTimes(1);
    });

    it('should throw error if name is missing', async () => {
      const invalidData = { ...mockProjectData, name: '' };

      await expect(createProject(mockUserId, invalidData)).rejects.toThrow(
        'Project name is required'
      );
    });

    it('should throw error if end date is before start date', async () => {
      const invalidData = {
        ...mockProjectData,
        startDate: new Date('2024-12-31'),
        endDate: new Date('2024-01-01'),
      };

      await expect(createProject(mockUserId, invalidData)).rejects.toThrow(
        'End date must be after start date'
      );
    });

    it('should throw error if budget is not positive', async () => {
      const invalidData = { ...mockProjectData, budget: -1000 };

      await expect(createProject(mockUserId, invalidData)).rejects.toThrow(
        'Budget must be a positive number'
      );
    });

    it('should throw error if team composition is empty', async () => {
      const invalidData = { ...mockProjectData, teamComposition: [] };

      await expect(createProject(mockUserId, invalidData)).rejects.toThrow(
        'Team composition is required'
      );
    });

    it('should throw error if technology stack is empty', async () => {
      const invalidData = { ...mockProjectData, technologyStack: [] };

      await expect(createProject(mockUserId, invalidData)).rejects.toThrow(
        'Technology stack is required'
      );
    });
  });

  describe('Project Validation - Date Validation', () => {
    it('should throw error if start date is missing', async () => {
      const invalidData = { ...mockProjectData, startDate: undefined as any };

      await expect(createProject(mockUserId, invalidData)).rejects.toThrow(
        'Start date and end date are required'
      );
    });

    it('should throw error if end date is missing', async () => {
      const invalidData = { ...mockProjectData, endDate: undefined as any };

      await expect(createProject(mockUserId, invalidData)).rejects.toThrow(
        'Start date and end date are required'
      );
    });

    it('should throw error if end date equals start date', async () => {
      const sameDate = new Date('2024-06-15');
      const invalidData = {
        ...mockProjectData,
        startDate: sameDate,
        endDate: sameDate,
      };

      await expect(createProject(mockUserId, invalidData)).rejects.toThrow(
        'End date must be after start date'
      );
    });

    it('should throw error if end date is one day before start date', async () => {
      const invalidData = {
        ...mockProjectData,
        startDate: new Date('2024-06-15'),
        endDate: new Date('2024-06-14'),
      };

      await expect(createProject(mockUserId, invalidData)).rejects.toThrow(
        'End date must be after start date'
      );
    });

    it('should throw error if start date is invalid', async () => {
      const invalidData = {
        ...mockProjectData,
        startDate: new Date('invalid-date'),
      };

      await expect(createProject(mockUserId, invalidData)).rejects.toThrow(
        'Invalid date format'
      );
    });

    it('should throw error if end date is invalid', async () => {
      const invalidData = {
        ...mockProjectData,
        endDate: new Date('invalid-date'),
      };

      await expect(createProject(mockUserId, invalidData)).rejects.toThrow(
        'Invalid date format'
      );
    });

    it('should accept valid dates where end date is after start date', async () => {
      const mockResult = {
        rows: [
          {
            id: mockProjectId,
            user_id: mockUserId,
            name: 'Test Project',
            description: 'Test Description',
            start_date: new Date('2024-01-01'),
            end_date: new Date('2024-12-31'),
            budget: '100000.00',
            team_size: 4,
            team_composition: mockTeamComposition,
            technology_stack: mockTechnologyStack,
            scope: 'Test Scope',
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      };

      (pool.query as jest.Mock).mockResolvedValue(mockResult);

      const validData = {
        ...mockProjectData,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };

      const result = await createProject(mockUserId, validData);
      expect(result.id).toBe(mockProjectId);
    });
  });

  describe('Project Validation - Budget Validation', () => {
    it('should throw error if budget is zero', async () => {
      const invalidData = { ...mockProjectData, budget: 0 };

      await expect(createProject(mockUserId, invalidData)).rejects.toThrow(
        'Budget must be a positive number'
      );
    });

    it('should throw error if budget is negative', async () => {
      const invalidData = { ...mockProjectData, budget: -5000 };

      await expect(createProject(mockUserId, invalidData)).rejects.toThrow(
        'Budget must be a positive number'
      );
    });

    it('should throw error if budget is missing', async () => {
      const invalidData = { ...mockProjectData, budget: undefined as any };

      await expect(createProject(mockUserId, invalidData)).rejects.toThrow(
        'Budget must be a positive number'
      );
    });

    it('should throw error if budget is null', async () => {
      const invalidData = { ...mockProjectData, budget: null as any };

      await expect(createProject(mockUserId, invalidData)).rejects.toThrow(
        'Budget must be a positive number'
      );
    });

    it('should accept positive budget values', async () => {
      const mockResult = {
        rows: [
          {
            id: mockProjectId,
            user_id: mockUserId,
            name: 'Test Project',
            description: 'Test Description',
            start_date: new Date('2024-01-01'),
            end_date: new Date('2024-12-31'),
            budget: '250000.00',
            team_size: 4,
            team_composition: mockTeamComposition,
            technology_stack: mockTechnologyStack,
            scope: 'Test Scope',
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      };

      (pool.query as jest.Mock).mockResolvedValue(mockResult);

      const validData = { ...mockProjectData, budget: 250000 };

      const result = await createProject(mockUserId, validData);
      expect(result.budget).toBe(250000);
    });

    it('should accept small positive budget values', async () => {
      const mockResult = {
        rows: [
          {
            id: mockProjectId,
            user_id: mockUserId,
            name: 'Test Project',
            description: 'Test Description',
            start_date: new Date('2024-01-01'),
            end_date: new Date('2024-12-31'),
            budget: '1.00',
            team_size: 4,
            team_composition: mockTeamComposition,
            technology_stack: mockTechnologyStack,
            scope: 'Test Scope',
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      };

      (pool.query as jest.Mock).mockResolvedValue(mockResult);

      const validData = { ...mockProjectData, budget: 1 };

      const result = await createProject(mockUserId, validData);
      expect(result.budget).toBe(1);
    });
  });

  describe('Project Validation - Missing Required Fields', () => {
    it('should throw error if name is missing', async () => {
      const invalidData = { ...mockProjectData, name: '' };

      await expect(createProject(mockUserId, invalidData)).rejects.toThrow(
        'Project name is required'
      );
    });

    it('should throw error if name is only whitespace', async () => {
      const invalidData = { ...mockProjectData, name: '   ' };

      await expect(createProject(mockUserId, invalidData)).rejects.toThrow(
        'Project name is required'
      );
    });

    it('should throw error if name is less than 2 characters', async () => {
      const invalidData = { ...mockProjectData, name: 'A' };

      await expect(createProject(mockUserId, invalidData)).rejects.toThrow(
        'Project name must be at least 2 characters long'
      );
    });

    it('should throw error if name is null', async () => {
      const invalidData = { ...mockProjectData, name: null as any };

      await expect(createProject(mockUserId, invalidData)).rejects.toThrow(
        'Project name is required'
      );
    });

    it('should throw error if name is undefined', async () => {
      const invalidData = { ...mockProjectData, name: undefined as any };

      await expect(createProject(mockUserId, invalidData)).rejects.toThrow(
        'Project name is required'
      );
    });

    it('should throw error if team size is missing', async () => {
      const invalidData = { ...mockProjectData, teamSize: undefined as any };

      await expect(createProject(mockUserId, invalidData)).rejects.toThrow(
        'Team size must be a positive number'
      );
    });

    it('should throw error if team size is zero', async () => {
      const invalidData = { ...mockProjectData, teamSize: 0 };

      await expect(createProject(mockUserId, invalidData)).rejects.toThrow(
        'Team size must be a positive number'
      );
    });

    it('should throw error if team size is negative', async () => {
      const invalidData = { ...mockProjectData, teamSize: -5 };

      await expect(createProject(mockUserId, invalidData)).rejects.toThrow(
        'Team size must be a positive number'
      );
    });

    it('should throw error if team composition is missing', async () => {
      const invalidData = { ...mockProjectData, teamComposition: undefined as any };

      await expect(createProject(mockUserId, invalidData)).rejects.toThrow(
        'Team composition is required'
      );
    });

    it('should throw error if team composition is null', async () => {
      const invalidData = { ...mockProjectData, teamComposition: null as any };

      await expect(createProject(mockUserId, invalidData)).rejects.toThrow(
        'Team composition is required'
      );
    });

    it('should throw error if technology stack is missing', async () => {
      const invalidData = { ...mockProjectData, technologyStack: undefined as any };

      await expect(createProject(mockUserId, invalidData)).rejects.toThrow(
        'Technology stack is required'
      );
    });

    it('should throw error if technology stack is null', async () => {
      const invalidData = { ...mockProjectData, technologyStack: null as any };

      await expect(createProject(mockUserId, invalidData)).rejects.toThrow(
        'Technology stack is required'
      );
    });

    it('should accept valid project with all required fields', async () => {
      const mockResult = {
        rows: [
          {
            id: mockProjectId,
            user_id: mockUserId,
            name: 'Valid Project',
            description: 'Valid Description',
            start_date: new Date('2024-01-01'),
            end_date: new Date('2024-12-31'),
            budget: '100000.00',
            team_size: 5,
            team_composition: mockTeamComposition,
            technology_stack: mockTechnologyStack,
            scope: 'Valid Scope',
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      };

      (pool.query as jest.Mock).mockResolvedValue(mockResult);

      const validData = {
        name: 'Valid Project',
        description: 'Valid Description',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        budget: 100000,
        teamSize: 5,
        teamComposition: mockTeamComposition,
        technologyStack: mockTechnologyStack,
        scope: 'Valid Scope',
      };

      const result = await createProject(mockUserId, validData);
      expect(result.name).toBe('Valid Project');
      expect(result.teamSize).toBe(5);
    });
  });

  describe('getUserProjects', () => {
    it('should return all projects for a user', async () => {
      const mockResult = {
        rows: [
          {
            id: mockProjectId,
            user_id: mockUserId,
            name: 'Test Project 1',
            description: 'Description 1',
            start_date: new Date('2024-01-01'),
            end_date: new Date('2024-12-31'),
            budget: '100000.00',
            team_size: 4,
            team_composition: mockTeamComposition,
            technology_stack: mockTechnologyStack,
            scope: 'Scope 1',
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      };

      (pool.query as jest.Mock).mockResolvedValue(mockResult);

      const result = await getUserProjects(mockUserId);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Project 1');
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [mockUserId]
      );
    });

    it('should return empty array if user has no projects', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      const result = await getUserProjects(mockUserId);

      expect(result).toHaveLength(0);
    });
  });

  describe('getProjectById', () => {
    it('should return project if user owns it', async () => {
      const mockResult = {
        rows: [
          {
            id: mockProjectId,
            user_id: mockUserId,
            name: 'Test Project',
            description: 'Description',
            start_date: new Date('2024-01-01'),
            end_date: new Date('2024-12-31'),
            budget: '100000.00',
            team_size: 4,
            team_composition: mockTeamComposition,
            technology_stack: mockTechnologyStack,
            scope: 'Scope',
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      };

      (pool.query as jest.Mock).mockResolvedValue(mockResult);

      const result = await getProjectById(mockProjectId, mockUserId);

      expect(result.id).toBe(mockProjectId);
      expect(result.userId).toBe(mockUserId);
    });

    it('should throw error if project not found', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      await expect(getProjectById(mockProjectId, mockUserId)).rejects.toThrow(
        'Project not found'
      );
    });

    it('should throw error if user does not own project', async () => {
      const mockResult = {
        rows: [
          {
            id: mockProjectId,
            user_id: 'different-user-id',
            name: 'Test Project',
            description: 'Description',
            start_date: new Date('2024-01-01'),
            end_date: new Date('2024-12-31'),
            budget: '100000.00',
            team_size: 4,
            team_composition: mockTeamComposition,
            technology_stack: mockTechnologyStack,
            scope: 'Scope',
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      };

      (pool.query as jest.Mock).mockResolvedValue(mockResult);

      await expect(getProjectById(mockProjectId, mockUserId)).rejects.toThrow(
        'You do not have permission to access this project'
      );
    });
  });

  describe('updateProject', () => {
    it('should update project successfully', async () => {
      // Mock ownership validation
      const ownershipResult = {
        rows: [{ user_id: mockUserId }],
      };

      // Mock the update query
      const updateResult = {
        rows: [
          {
            id: mockProjectId,
            user_id: mockUserId,
            name: 'Updated Project',
            description: 'Updated Description',
            start_date: new Date('2024-01-01'),
            end_date: new Date('2024-12-31'),
            budget: '150000.00',
            team_size: 4,
            team_composition: mockTeamComposition,
            technology_stack: mockTechnologyStack,
            scope: 'Updated Scope',
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      };

      (pool.query as jest.Mock)
        .mockResolvedValueOnce(ownershipResult)
        .mockResolvedValueOnce(updateResult);

      const updates: UpdateProjectDTO = {
        name: 'Updated Project',
        budget: 150000,
      };

      const result = await updateProject(mockProjectId, mockUserId, updates);

      expect(result.name).toBe('Updated Project');
      expect(result.budget).toBe(150000);
    });

    it('should throw error if no fields to update', async () => {
      const ownershipResult = {
        rows: [{ user_id: mockUserId }],
      };

      (pool.query as jest.Mock).mockResolvedValue(ownershipResult);

      await expect(updateProject(mockProjectId, mockUserId, {})).rejects.toThrow(
        'No fields to update'
      );
    });

    it('should throw error if updating to invalid dates', async () => {
      const ownershipResult = {
        rows: [{ user_id: mockUserId }],
      };

      const projectResult = {
        rows: [
          {
            id: mockProjectId,
            user_id: mockUserId,
            name: 'Test Project',
            description: 'Description',
            start_date: new Date('2024-01-01'),
            end_date: new Date('2024-12-31'),
            budget: '100000.00',
            team_size: 4,
            team_composition: mockTeamComposition,
            technology_stack: mockTechnologyStack,
            scope: 'Scope',
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      };

      (pool.query as jest.Mock)
        .mockResolvedValueOnce(ownershipResult)
        .mockResolvedValueOnce(projectResult);

      const updates: UpdateProjectDTO = {
        endDate: new Date('2023-01-01'), // Before start date
      };

      await expect(updateProject(mockProjectId, mockUserId, updates)).rejects.toThrow(
        'End date must be after start date'
      );
    });
  });

  describe('deleteProject', () => {
    it('should delete project successfully', async () => {
      const ownershipResult = {
        rows: [{ user_id: mockUserId }],
      };

      const deleteResult = {
        rowCount: 1,
      };

      (pool.query as jest.Mock)
        .mockResolvedValueOnce(ownershipResult)
        .mockResolvedValueOnce(deleteResult);

      await expect(deleteProject(mockProjectId, mockUserId)).resolves.not.toThrow();
    });

    it('should throw error if project not found', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      await expect(deleteProject(mockProjectId, mockUserId)).rejects.toThrow(
        'Project not found'
      );
    });
  });

  describe('validateOwnership', () => {
    it('should return true if user owns project', async () => {
      const mockResult = {
        rows: [{ user_id: mockUserId }],
      };

      (pool.query as jest.Mock).mockResolvedValue(mockResult);

      const result = await validateOwnership(mockProjectId, mockUserId);

      expect(result).toBe(true);
    });

    it('should throw error if project not found', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      await expect(validateOwnership(mockProjectId, mockUserId)).rejects.toThrow(
        'Project not found'
      );
    });

    it('should throw error if user does not own project', async () => {
      const mockResult = {
        rows: [{ user_id: 'different-user-id' }],
      };

      (pool.query as jest.Mock).mockResolvedValue(mockResult);

      await expect(validateOwnership(mockProjectId, mockUserId)).rejects.toThrow(
        'You do not have permission to access this project'
      );
    });
  });
});
