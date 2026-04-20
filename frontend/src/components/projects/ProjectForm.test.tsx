/**
 * Unit tests for ProjectForm component
 * Tests form validation, date validation, and API integration
 * Requirements: 2.1, 2.2, 2.5, 2.6
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProjectForm from './ProjectForm';
import { apiService } from '../../services/api';

// Mock the API service
jest.mock('../../services/api');
const mockApiService = apiService as jest.Mocked<typeof apiService>;

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('ProjectForm', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const renderProjectForm = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ProjectForm {...props} />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  describe('Form Rendering', () => {
    it('should render all required form fields', () => {
      renderProjectForm();

      expect(screen.getByLabelText(/project name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/budget/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/team size/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create project/i })).toBeInTheDocument();
    });

    it('should render team composition section', () => {
      renderProjectForm();

      expect(screen.getByText(/team composition/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add team member/i })).toBeInTheDocument();
    });

    it('should render technology stack section', () => {
      renderProjectForm();

      expect(screen.getByText(/technology stack/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add technology/i })).toBeInTheDocument();
    });

    it('should show "Edit Project" title in edit mode', async () => {
      const mockProject = {
        id: '123',
        name: 'Test Project',
        description: 'Test Description',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        budget: 100000,
        teamSize: 5,
        teamComposition: [],
        technologyStack: [],
        scope: 'Test Scope',
      };

      mockApiService.get.mockResolvedValueOnce(mockProject);

      renderProjectForm({ projectId: '123' });

      await waitFor(() => {
        expect(screen.getByText(/edit project/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('should show error when project name is empty', async () => {
      renderProjectForm();

      const submitButton = screen.getByRole('button', { name: /create project/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/project name is required/i)).toBeInTheDocument();
      });

      expect(mockApiService.post).not.toHaveBeenCalled();
    });

    it('should show error when description is empty', async () => {
      renderProjectForm();

      const nameInput = screen.getByLabelText(/project name/i);
      fireEvent.change(nameInput, { target: { value: 'Test Project' } });

      const submitButton = screen.getByRole('button', { name: /create project/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/description is required/i)).toBeInTheDocument();
      });

      expect(mockApiService.post).not.toHaveBeenCalled();
    });

    it('should show error when start date is empty', async () => {
      renderProjectForm();

      const nameInput = screen.getByLabelText(/project name/i);
      const descInput = screen.getByLabelText(/description/i);

      fireEvent.change(nameInput, { target: { value: 'Test Project' } });
      fireEvent.change(descInput, { target: { value: 'Test Description' } });

      const submitButton = screen.getByRole('button', { name: /create project/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/start date is required/i)).toBeInTheDocument();
      });

      expect(mockApiService.post).not.toHaveBeenCalled();
    });

    it('should show error when end date is empty', async () => {
      renderProjectForm();

      const nameInput = screen.getByLabelText(/project name/i);
      const descInput = screen.getByLabelText(/description/i);
      const startDateInput = screen.getByLabelText(/start date/i);

      fireEvent.change(nameInput, { target: { value: 'Test Project' } });
      fireEvent.change(descInput, { target: { value: 'Test Description' } });
      fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });

      const submitButton = screen.getByRole('button', { name: /create project/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/end date is required/i)).toBeInTheDocument();
      });

      expect(mockApiService.post).not.toHaveBeenCalled();
    });

    it('should show error when budget is empty', async () => {
      renderProjectForm();

      const nameInput = screen.getByLabelText(/project name/i);
      const descInput = screen.getByLabelText(/description/i);
      const startDateInput = screen.getByLabelText(/start date/i);
      const endDateInput = screen.getByLabelText(/end date/i);

      fireEvent.change(nameInput, { target: { value: 'Test Project' } });
      fireEvent.change(descInput, { target: { value: 'Test Description' } });
      fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });
      fireEvent.change(endDateInput, { target: { value: '2024-12-31' } });

      const submitButton = screen.getByRole('button', { name: /create project/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/budget is required/i)).toBeInTheDocument();
      });

      expect(mockApiService.post).not.toHaveBeenCalled();
    });

    it('should show error when team size is empty', async () => {
      renderProjectForm();

      const nameInput = screen.getByLabelText(/project name/i);
      const descInput = screen.getByLabelText(/description/i);
      const startDateInput = screen.getByLabelText(/start date/i);
      const endDateInput = screen.getByLabelText(/end date/i);
      const budgetInput = screen.getByLabelText(/budget/i);

      fireEvent.change(nameInput, { target: { value: 'Test Project' } });
      fireEvent.change(descInput, { target: { value: 'Test Description' } });
      fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });
      fireEvent.change(endDateInput, { target: { value: '2024-12-31' } });
      fireEvent.change(budgetInput, { target: { value: '100000' } });

      const submitButton = screen.getByRole('button', { name: /create project/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/team size is required/i)).toBeInTheDocument();
      });

      expect(mockApiService.post).not.toHaveBeenCalled();
    });

    it('should show error when team size is not a positive number', async () => {
      renderProjectForm();

      const teamSizeInput = screen.getByLabelText(/team size/i);
      fireEvent.change(teamSizeInput, { target: { value: '-5' } });

      const submitButton = screen.getByRole('button', { name: /create project/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/team size must be a positive number/i)).toBeInTheDocument();
      });
    });

    it('should clear field error when user types in the field', async () => {
      renderProjectForm();

      const nameInput = screen.getByLabelText(/project name/i);
      const submitButton = screen.getByRole('button', { name: /create project/i });

      // Trigger validation error
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/project name is required/i)).toBeInTheDocument();
      });

      // Type in the field
      fireEvent.change(nameInput, { target: { value: 'Test Project' } });

      // Error should be cleared
      expect(screen.queryByText(/project name is required/i)).not.toBeInTheDocument();
    });
  });

  describe('Date Validation', () => {
    it('should show error when end date is before start date', async () => {
      renderProjectForm();

      const nameInput = screen.getByLabelText(/project name/i);
      const descInput = screen.getByLabelText(/description/i);
      const startDateInput = screen.getByLabelText(/start date/i);
      const endDateInput = screen.getByLabelText(/end date/i);
      const budgetInput = screen.getByLabelText(/budget/i);
      const teamSizeInput = screen.getByLabelText(/team size/i);

      fireEvent.change(nameInput, { target: { value: 'Test Project' } });
      fireEvent.change(descInput, { target: { value: 'Test Description' } });
      fireEvent.change(startDateInput, { target: { value: '2024-12-31' } });
      fireEvent.change(endDateInput, { target: { value: '2024-01-01' } });
      fireEvent.change(budgetInput, { target: { value: '100000' } });
      fireEvent.change(teamSizeInput, { target: { value: '5' } });

      const submitButton = screen.getByRole('button', { name: /create project/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/end date must be after start date/i)).toBeInTheDocument();
      });

      expect(mockApiService.post).not.toHaveBeenCalled();
    });

    it('should show error when end date equals start date', async () => {
      renderProjectForm();

      const nameInput = screen.getByLabelText(/project name/i);
      const descInput = screen.getByLabelText(/description/i);
      const startDateInput = screen.getByLabelText(/start date/i);
      const endDateInput = screen.getByLabelText(/end date/i);
      const budgetInput = screen.getByLabelText(/budget/i);
      const teamSizeInput = screen.getByLabelText(/team size/i);

      fireEvent.change(nameInput, { target: { value: 'Test Project' } });
      fireEvent.change(descInput, { target: { value: 'Test Description' } });
      fireEvent.change(startDateInput, { target: { value: '2024-06-15' } });
      fireEvent.change(endDateInput, { target: { value: '2024-06-15' } });
      fireEvent.change(budgetInput, { target: { value: '100000' } });
      fireEvent.change(teamSizeInput, { target: { value: '5' } });

      const submitButton = screen.getByRole('button', { name: /create project/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/end date must be after start date/i)).toBeInTheDocument();
      });

      expect(mockApiService.post).not.toHaveBeenCalled();
    });

    it('should accept valid date range', async () => {
      mockApiService.post.mockResolvedValueOnce({ id: '123' });
      renderProjectForm();

      const nameInput = screen.getByLabelText(/project name/i);
      const descInput = screen.getByLabelText(/description/i);
      const startDateInput = screen.getByLabelText(/start date/i);
      const endDateInput = screen.getByLabelText(/end date/i);
      const budgetInput = screen.getByLabelText(/budget/i);
      const teamSizeInput = screen.getByLabelText(/team size/i);

      fireEvent.change(nameInput, { target: { value: 'Test Project' } });
      fireEvent.change(descInput, { target: { value: 'Test Description' } });
      fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });
      fireEvent.change(endDateInput, { target: { value: '2024-12-31' } });
      fireEvent.change(budgetInput, { target: { value: '100000' } });
      fireEvent.change(teamSizeInput, { target: { value: '5' } });

      const submitButton = screen.getByRole('button', { name: /create project/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockApiService.post).toHaveBeenCalled();
      });
    });
  });

  describe('Budget Validation', () => {
    it('should show error when budget is zero', async () => {
      renderProjectForm();

      const nameInput = screen.getByLabelText(/project name/i);
      const descInput = screen.getByLabelText(/description/i);
      const startDateInput = screen.getByLabelText(/start date/i);
      const endDateInput = screen.getByLabelText(/end date/i);
      const budgetInput = screen.getByLabelText(/budget/i);
      const teamSizeInput = screen.getByLabelText(/team size/i);

      fireEvent.change(nameInput, { target: { value: 'Test Project' } });
      fireEvent.change(descInput, { target: { value: 'Test Description' } });
      fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });
      fireEvent.change(endDateInput, { target: { value: '2024-12-31' } });
      fireEvent.change(budgetInput, { target: { value: '0' } });
      fireEvent.change(teamSizeInput, { target: { value: '5' } });

      const submitButton = screen.getByRole('button', { name: /create project/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/budget must be a positive number/i)).toBeInTheDocument();
      });

      expect(mockApiService.post).not.toHaveBeenCalled();
    });

    it('should show error when budget is negative', async () => {
      renderProjectForm();

      const nameInput = screen.getByLabelText(/project name/i);
      const descInput = screen.getByLabelText(/description/i);
      const startDateInput = screen.getByLabelText(/start date/i);
      const endDateInput = screen.getByLabelText(/end date/i);
      const budgetInput = screen.getByLabelText(/budget/i);
      const teamSizeInput = screen.getByLabelText(/team size/i);

      fireEvent.change(nameInput, { target: { value: 'Test Project' } });
      fireEvent.change(descInput, { target: { value: 'Test Description' } });
      fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });
      fireEvent.change(endDateInput, { target: { value: '2024-12-31' } });
      fireEvent.change(budgetInput, { target: { value: '-50000' } });
      fireEvent.change(teamSizeInput, { target: { value: '5' } });

      const submitButton = screen.getByRole('button', { name: /create project/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/budget must be a positive number/i)).toBeInTheDocument();
      });

      expect(mockApiService.post).not.toHaveBeenCalled();
    });

    it('should accept positive budget values', async () => {
      mockApiService.post.mockResolvedValueOnce({ id: '123' });
      renderProjectForm();

      const nameInput = screen.getByLabelText(/project name/i);
      const descInput = screen.getByLabelText(/description/i);
      const startDateInput = screen.getByLabelText(/start date/i);
      const endDateInput = screen.getByLabelText(/end date/i);
      const budgetInput = screen.getByLabelText(/budget/i);
      const teamSizeInput = screen.getByLabelText(/team size/i);

      fireEvent.change(nameInput, { target: { value: 'Test Project' } });
      fireEvent.change(descInput, { target: { value: 'Test Description' } });
      fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });
      fireEvent.change(endDateInput, { target: { value: '2024-12-31' } });
      fireEvent.change(budgetInput, { target: { value: '250000.50' } });
      fireEvent.change(teamSizeInput, { target: { value: '5' } });

      const submitButton = screen.getByRole('button', { name: /create project/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockApiService.post).toHaveBeenCalled();
      });
    });
  });

  describe('API Integration', () => {
    it('should call POST API when creating a new project', async () => {
      mockApiService.post.mockResolvedValueOnce({ id: '123' });
      renderProjectForm();

      const nameInput = screen.getByLabelText(/project name/i);
      const descInput = screen.getByLabelText(/description/i);
      const startDateInput = screen.getByLabelText(/start date/i);
      const endDateInput = screen.getByLabelText(/end date/i);
      const budgetInput = screen.getByLabelText(/budget/i);
      const teamSizeInput = screen.getByLabelText(/team size/i);

      fireEvent.change(nameInput, { target: { value: 'Test Project' } });
      fireEvent.change(descInput, { target: { value: 'Test Description' } });
      fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });
      fireEvent.change(endDateInput, { target: { value: '2024-12-31' } });
      fireEvent.change(budgetInput, { target: { value: '100000' } });
      fireEvent.change(teamSizeInput, { target: { value: '5' } });

      const submitButton = screen.getByRole('button', { name: /create project/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockApiService.post).toHaveBeenCalledWith('/api/projects', {
          name: 'Test Project',
          description: 'Test Description',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          budget: 100000,
          teamSize: 5,
          teamComposition: [],
          technologyStack: [],
          scope: '',
        });
      });
    });

    it('should call PUT API when updating an existing project', async () => {
      const mockProject = {
        id: '123',
        name: 'Old Project',
        description: 'Old Description',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        budget: 100000,
        teamSize: 5,
        teamComposition: [],
        technologyStack: [],
        scope: 'Old Scope',
      };

      mockApiService.get.mockResolvedValueOnce(mockProject);
      mockApiService.put.mockResolvedValueOnce({ ...mockProject, name: 'Updated Project' });

      renderProjectForm({ projectId: '123' });

      await waitFor(() => {
        expect(screen.getByDisplayValue('Old Project')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/project name/i);
      fireEvent.change(nameInput, { target: { value: 'Updated Project' } });

      const submitButton = screen.getByRole('button', { name: /update project/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockApiService.put).toHaveBeenCalledWith('/api/projects/123', expect.objectContaining({
          name: 'Updated Project',
        }));
      });
    });

    it('should navigate to projects page on successful creation', async () => {
      mockApiService.post.mockResolvedValueOnce({ id: '123' });
      renderProjectForm();

      const nameInput = screen.getByLabelText(/project name/i);
      const descInput = screen.getByLabelText(/description/i);
      const startDateInput = screen.getByLabelText(/start date/i);
      const endDateInput = screen.getByLabelText(/end date/i);
      const budgetInput = screen.getByLabelText(/budget/i);
      const teamSizeInput = screen.getByLabelText(/team size/i);

      fireEvent.change(nameInput, { target: { value: 'Test Project' } });
      fireEvent.change(descInput, { target: { value: 'Test Description' } });
      fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });
      fireEvent.change(endDateInput, { target: { value: '2024-12-31' } });
      fireEvent.change(budgetInput, { target: { value: '100000' } });
      fireEvent.change(teamSizeInput, { target: { value: '5' } });

      const submitButton = screen.getByRole('button', { name: /create project/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/projects');
      });
    });

    it('should call onSuccess callback when provided', async () => {
      mockApiService.post.mockResolvedValueOnce({ id: '123' });
      const onSuccess = jest.fn();
      renderProjectForm({ onSuccess });

      const nameInput = screen.getByLabelText(/project name/i);
      const descInput = screen.getByLabelText(/description/i);
      const startDateInput = screen.getByLabelText(/start date/i);
      const endDateInput = screen.getByLabelText(/end date/i);
      const budgetInput = screen.getByLabelText(/budget/i);
      const teamSizeInput = screen.getByLabelText(/team size/i);

      fireEvent.change(nameInput, { target: { value: 'Test Project' } });
      fireEvent.change(descInput, { target: { value: 'Test Description' } });
      fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });
      fireEvent.change(endDateInput, { target: { value: '2024-12-31' } });
      fireEvent.change(budgetInput, { target: { value: '100000' } });
      fireEvent.change(teamSizeInput, { target: { value: '5' } });

      const submitButton = screen.getByRole('button', { name: /create project/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should show loading state during submission', async () => {
      mockApiService.post.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ id: '123' }), 100)));
      renderProjectForm();

      const nameInput = screen.getByLabelText(/project name/i);
      const descInput = screen.getByLabelText(/description/i);
      const startDateInput = screen.getByLabelText(/start date/i);
      const endDateInput = screen.getByLabelText(/end date/i);
      const budgetInput = screen.getByLabelText(/budget/i);
      const teamSizeInput = screen.getByLabelText(/team size/i);

      fireEvent.change(nameInput, { target: { value: 'Test Project' } });
      fireEvent.change(descInput, { target: { value: 'Test Description' } });
      fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });
      fireEvent.change(endDateInput, { target: { value: '2024-12-31' } });
      fireEvent.change(budgetInput, { target: { value: '100000' } });
      fireEvent.change(teamSizeInput, { target: { value: '5' } });

      const submitButton = screen.getByRole('button', { name: /create project/i });
      fireEvent.click(submitButton);

      expect(screen.getByText(/saving/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        expect(screen.queryByText(/saving/i)).not.toBeInTheDocument();
      });
    });

    it('should disable form inputs during submission', async () => {
      mockApiService.post.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ id: '123' }), 100)));
      renderProjectForm();

      const nameInput = screen.getByLabelText(/project name/i) as HTMLInputElement;
      const descInput = screen.getByLabelText(/description/i) as HTMLTextAreaElement;
      const startDateInput = screen.getByLabelText(/start date/i) as HTMLInputElement;
      const endDateInput = screen.getByLabelText(/end date/i) as HTMLInputElement;
      const budgetInput = screen.getByLabelText(/budget/i) as HTMLInputElement;
      const teamSizeInput = screen.getByLabelText(/team size/i) as HTMLInputElement;

      fireEvent.change(nameInput, { target: { value: 'Test Project' } });
      fireEvent.change(descInput, { target: { value: 'Test Description' } });
      fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });
      fireEvent.change(endDateInput, { target: { value: '2024-12-31' } });
      fireEvent.change(budgetInput, { target: { value: '100000' } });
      fireEvent.change(teamSizeInput, { target: { value: '5' } });

      const submitButton = screen.getByRole('button', { name: /create project/i });
      fireEvent.click(submitButton);

      expect(nameInput).toBeDisabled();
      expect(descInput).toBeDisabled();
      expect(startDateInput).toBeDisabled();
      expect(endDateInput).toBeDisabled();
      expect(budgetInput).toBeDisabled();
      expect(teamSizeInput).toBeDisabled();

      await waitFor(() => {
        expect(nameInput).not.toBeDisabled();
      });
    });

    it('should display error message on API failure', async () => {
      const errorMessage = 'Failed to create project';
      mockApiService.post.mockRejectedValueOnce({
        response: { data: { message: errorMessage } },
      });

      renderProjectForm();

      const nameInput = screen.getByLabelText(/project name/i);
      const descInput = screen.getByLabelText(/description/i);
      const startDateInput = screen.getByLabelText(/start date/i);
      const endDateInput = screen.getByLabelText(/end date/i);
      const budgetInput = screen.getByLabelText(/budget/i);
      const teamSizeInput = screen.getByLabelText(/team size/i);

      fireEvent.change(nameInput, { target: { value: 'Test Project' } });
      fireEvent.change(descInput, { target: { value: 'Test Description' } });
      fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });
      fireEvent.change(endDateInput, { target: { value: '2024-12-31' } });
      fireEvent.change(budgetInput, { target: { value: '100000' } });
      fireEvent.change(teamSizeInput, { target: { value: '5' } });

      const submitButton = screen.getByRole('button', { name: /create project/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should display generic error message when API error has no message', async () => {
      mockApiService.post.mockRejectedValueOnce(new Error('Network error'));

      renderProjectForm();

      const nameInput = screen.getByLabelText(/project name/i);
      const descInput = screen.getByLabelText(/description/i);
      const startDateInput = screen.getByLabelText(/start date/i);
      const endDateInput = screen.getByLabelText(/end date/i);
      const budgetInput = screen.getByLabelText(/budget/i);
      const teamSizeInput = screen.getByLabelText(/team size/i);

      fireEvent.change(nameInput, { target: { value: 'Test Project' } });
      fireEvent.change(descInput, { target: { value: 'Test Description' } });
      fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });
      fireEvent.change(endDateInput, { target: { value: '2024-12-31' } });
      fireEvent.change(budgetInput, { target: { value: '100000' } });
      fireEvent.change(teamSizeInput, { target: { value: '5' } });

      const submitButton = screen.getByRole('button', { name: /create project/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to save project/i)).toBeInTheDocument();
      });
    });

    it('should include team composition in API payload', async () => {
      mockApiService.post.mockResolvedValueOnce({ id: '123' });
      renderProjectForm();

      // Fill basic fields
      const nameInput = screen.getByLabelText(/project name/i);
      const descInput = screen.getByLabelText(/description/i);
      const startDateInput = screen.getByLabelText(/start date/i);
      const endDateInput = screen.getByLabelText(/end date/i);
      const budgetInput = screen.getByLabelText(/budget/i);
      const teamSizeInput = screen.getByLabelText(/team size/i);

      fireEvent.change(nameInput, { target: { value: 'Test Project' } });
      fireEvent.change(descInput, { target: { value: 'Test Description' } });
      fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });
      fireEvent.change(endDateInput, { target: { value: '2024-12-31' } });
      fireEvent.change(budgetInput, { target: { value: '100000' } });
      fireEvent.change(teamSizeInput, { target: { value: '5' } });

      // Add team member
      const teamMemberInputs = screen.getAllByPlaceholderText(/e.g., Developer, Designer/i);
      fireEvent.change(teamMemberInputs[0], { target: { value: 'Developer' } });
      
      const addTeamMemberButton = screen.getByRole('button', { name: /add team member/i });
      fireEvent.click(addTeamMemberButton);

      const submitButton = screen.getByRole('button', { name: /create project/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockApiService.post).toHaveBeenCalledWith('/api/projects', expect.objectContaining({
          teamComposition: [{ role: 'Developer', count: 1, experienceLevel: 'Mid' }],
        }));
      });
    });

    it('should include technology stack in API payload', async () => {
      mockApiService.post.mockResolvedValueOnce({ id: '123' });
      renderProjectForm();

      // Fill basic fields
      const nameInput = screen.getByLabelText(/project name/i);
      const descInput = screen.getByLabelText(/description/i);
      const startDateInput = screen.getByLabelText(/start date/i);
      const endDateInput = screen.getByLabelText(/end date/i);
      const budgetInput = screen.getByLabelText(/budget/i);
      const teamSizeInput = screen.getByLabelText(/team size/i);

      fireEvent.change(nameInput, { target: { value: 'Test Project' } });
      fireEvent.change(descInput, { target: { value: 'Test Description' } });
      fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });
      fireEvent.change(endDateInput, { target: { value: '2024-12-31' } });
      fireEvent.change(budgetInput, { target: { value: '100000' } });
      fireEvent.change(teamSizeInput, { target: { value: '5' } });

      // Add technology
      const technologyInputs = screen.getAllByPlaceholderText(/e.g., React, Node.js/i);
      fireEvent.change(technologyInputs[0], { target: { value: 'React' } });
      
      const addTechnologyButton = screen.getByRole('button', { name: /add technology/i });
      fireEvent.click(addTechnologyButton);

      const submitButton = screen.getByRole('button', { name: /create project/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockApiService.post).toHaveBeenCalledWith('/api/projects', expect.objectContaining({
          technologyStack: [{ name: 'React', category: 'Frontend', maturity: 'Stable' }],
        }));
      });
    });
  });

  describe('Cancel Button', () => {
    it('should navigate to projects page when cancel is clicked', () => {
      renderProjectForm();

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockNavigate).toHaveBeenCalledWith('/projects');
    });
  });
});
