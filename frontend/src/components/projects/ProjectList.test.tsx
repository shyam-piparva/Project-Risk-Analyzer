/**
 * Unit tests for ProjectList component
 * Tests project listing, search, filtering, and delete functionality
 * Requirements: 2.1, 2.2, 2.5, 2.6
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProjectList from './ProjectList';
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

// Mock useAuth
const mockUser = { id: 'user-123', email: 'test@example.com', name: 'Test User' };
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    token: 'mock-token',
    isAuthenticated: true,
    isLoading: false,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    refreshToken: jest.fn(),
  }),
}));

describe('ProjectList', () => {
  let queryClient: QueryClient;

  const mockProjects = [
    {
      id: 'project-1',
      userId: 'user-123',
      name: 'E-commerce Platform',
      description: 'Building a modern e-commerce platform',
      startDate: '2024-01-01T00:00:00.000Z',
      endDate: '2024-12-31T00:00:00.000Z',
      budget: 150000,
      teamSize: 8,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'project-2',
      userId: 'user-123',
      name: 'Mobile App Development',
      description: 'Creating a cross-platform mobile application',
      startDate: '2024-02-01T00:00:00.000Z',
      endDate: '2024-08-31T00:00:00.000Z',
      budget: 80000,
      teamSize: 5,
      createdAt: '2024-02-01T00:00:00.000Z',
      updatedAt: '2024-02-01T00:00:00.000Z',
    },
    {
      id: 'project-3',
      userId: 'user-123',
      name: 'Data Analytics Dashboard',
      description: 'Building a real-time analytics dashboard',
      startDate: '2024-03-01T00:00:00.000Z',
      endDate: '2024-09-30T00:00:00.000Z',
      budget: 120000,
      teamSize: 6,
      createdAt: '2024-03-01T00:00:00.000Z',
      updatedAt: '2024-03-01T00:00:00.000Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const renderProjectList = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ProjectList {...props} />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  describe('Component Rendering', () => {
    it('should render loading state initially', () => {
      mockApiService.get.mockImplementation(() => new Promise(() => {}));
      renderProjectList();

      expect(screen.getByText(/loading projects/i)).toBeInTheDocument();
    });

    it('should render projects list when data is loaded', async () => {
      mockApiService.get.mockResolvedValueOnce(mockProjects);
      renderProjectList();

      await waitFor(() => {
        expect(screen.getByText('E-commerce Platform')).toBeInTheDocument();
        expect(screen.getByText('Mobile App Development')).toBeInTheDocument();
        expect(screen.getByText('Data Analytics Dashboard')).toBeInTheDocument();
      });
    });

    it('should render search input', async () => {
      mockApiService.get.mockResolvedValueOnce(mockProjects);
      renderProjectList();

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search projects/i)).toBeInTheDocument();
      });
    });

    it('should render create new project button', async () => {
      mockApiService.get.mockResolvedValueOnce(mockProjects);
      renderProjectList();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create new project/i })).toBeInTheDocument();
      });
    });

    it('should display error message when API fails', async () => {
      mockApiService.get.mockRejectedValueOnce(new Error('API Error'));
      renderProjectList();

      await waitFor(() => {
        expect(screen.getByText(/error loading projects/i)).toBeInTheDocument();
      });
    });

    it('should show empty state when no projects exist', async () => {
      mockApiService.get.mockResolvedValueOnce([]);
      renderProjectList();

      await waitFor(() => {
        expect(screen.getByText(/no projects yet/i)).toBeInTheDocument();
      });
    });
  });

  describe('Project Display', () => {
    it('should display project name and description', async () => {
      mockApiService.get.mockResolvedValueOnce(mockProjects);
      renderProjectList();

      await waitFor(() => {
        expect(screen.getByText('E-commerce Platform')).toBeInTheDocument();
        expect(screen.getByText(/building a modern e-commerce platform/i)).toBeInTheDocument();
      });
    });

    it('should display formatted budget', async () => {
      mockApiService.get.mockResolvedValueOnce(mockProjects);
      renderProjectList();

      await waitFor(() => {
        expect(screen.getByText('$150,000.00')).toBeInTheDocument();
        expect(screen.getByText('$80,000.00')).toBeInTheDocument();
      });
    });

    it('should display team size', async () => {
      mockApiService.get.mockResolvedValueOnce(mockProjects);
      renderProjectList();

      await waitFor(() => {
        const teamSizeElements = screen.getAllByText(/8|5|6/);
        expect(teamSizeElements.length).toBeGreaterThan(0);
      });
    });

    it('should display formatted dates', async () => {
      mockApiService.get.mockResolvedValueOnce(mockProjects);
      renderProjectList();

      await waitFor(() => {
        expect(screen.getByText(/Jan 1, 2024/)).toBeInTheDocument();
        expect(screen.getByText(/Dec 31, 2024/)).toBeInTheDocument();
      });
    });

    it('should display action buttons for each project', async () => {
      mockApiService.get.mockResolvedValueOnce(mockProjects);
      renderProjectList();

      await waitFor(() => {
        const viewButtons = screen.getAllByRole('button', { name: /view/i });
        const editButtons = screen.getAllByRole('button', { name: /edit/i });
        const deleteButtons = screen.getAllByRole('button', { name: /delete/i });

        expect(viewButtons).toHaveLength(3);
        expect(editButtons).toHaveLength(3);
        expect(deleteButtons).toHaveLength(3);
      });
    });
  });

  describe('Search Functionality', () => {
    it('should filter projects by name', async () => {
      mockApiService.get.mockResolvedValueOnce(mockProjects);
      renderProjectList();

      await waitFor(() => {
        expect(screen.getByText('E-commerce Platform')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search projects/i);
      fireEvent.change(searchInput, { target: { value: 'mobile' } });

      expect(screen.queryByText('E-commerce Platform')).not.toBeInTheDocument();
      expect(screen.getByText('Mobile App Development')).toBeInTheDocument();
      expect(screen.queryByText('Data Analytics Dashboard')).not.toBeInTheDocument();
    });

    it('should filter projects by description', async () => {
      mockApiService.get.mockResolvedValueOnce(mockProjects);
      renderProjectList();

      await waitFor(() => {
        expect(screen.getByText('E-commerce Platform')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search projects/i);
      fireEvent.change(searchInput, { target: { value: 'analytics' } });

      expect(screen.queryByText('E-commerce Platform')).not.toBeInTheDocument();
      expect(screen.queryByText('Mobile App Development')).not.toBeInTheDocument();
      expect(screen.getByText('Data Analytics Dashboard')).toBeInTheDocument();
    });

    it('should be case-insensitive', async () => {
      mockApiService.get.mockResolvedValueOnce(mockProjects);
      renderProjectList();

      await waitFor(() => {
        expect(screen.getByText('E-commerce Platform')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search projects/i);
      fireEvent.change(searchInput, { target: { value: 'MOBILE' } });

      expect(screen.getByText('Mobile App Development')).toBeInTheDocument();
    });

    it('should show "no projects match" message when search has no results', async () => {
      mockApiService.get.mockResolvedValueOnce(mockProjects);
      renderProjectList();

      await waitFor(() => {
        expect(screen.getByText('E-commerce Platform')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search projects/i);
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      expect(screen.getByText(/no projects match your search/i)).toBeInTheDocument();
    });

    it('should show all projects when search is cleared', async () => {
      mockApiService.get.mockResolvedValueOnce(mockProjects);
      renderProjectList();

      await waitFor(() => {
        expect(screen.getByText('E-commerce Platform')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search projects/i);
      
      // Search
      fireEvent.change(searchInput, { target: { value: 'mobile' } });
      expect(screen.queryByText('E-commerce Platform')).not.toBeInTheDocument();

      // Clear search
      fireEvent.change(searchInput, { target: { value: '' } });
      expect(screen.getByText('E-commerce Platform')).toBeInTheDocument();
      expect(screen.getByText('Mobile App Development')).toBeInTheDocument();
      expect(screen.getByText('Data Analytics Dashboard')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should navigate to create page when create button is clicked', async () => {
      mockApiService.get.mockResolvedValueOnce(mockProjects);
      renderProjectList();

      await waitFor(() => {
        expect(screen.getByText('E-commerce Platform')).toBeInTheDocument();
      });

      const createButton = screen.getAllByRole('button', { name: /create new project/i })[0];
      fireEvent.click(createButton);

      expect(mockNavigate).toHaveBeenCalledWith('/projects/new');
    });

    it('should navigate to edit page when edit button is clicked', async () => {
      mockApiService.get.mockResolvedValueOnce(mockProjects);
      renderProjectList();

      await waitFor(() => {
        expect(screen.getByText('E-commerce Platform')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      fireEvent.click(editButtons[0]);

      expect(mockNavigate).toHaveBeenCalledWith('/projects/project-1/edit');
    });

    it('should navigate to dashboard when view button is clicked', async () => {
      mockApiService.get.mockResolvedValueOnce(mockProjects);
      renderProjectList();

      await waitFor(() => {
        expect(screen.getByText('E-commerce Platform')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByRole('button', { name: /view/i });
      fireEvent.click(viewButtons[0]);

      expect(mockNavigate).toHaveBeenCalledWith('/projects/project-1/dashboard');
    });
  });

  describe('Delete Functionality', () => {
    it('should show confirmation modal when delete button is clicked', async () => {
      mockApiService.get.mockResolvedValueOnce(mockProjects);
      renderProjectList();

      await waitFor(() => {
        expect(screen.getByText('E-commerce Platform')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      fireEvent.click(deleteButtons[0]);

      expect(screen.getByText(/confirm delete/i)).toBeInTheDocument();
      expect(screen.getByText(/are you sure you want to delete this project/i)).toBeInTheDocument();
    });

    it('should close modal when cancel is clicked', async () => {
      mockApiService.get.mockResolvedValueOnce(mockProjects);
      renderProjectList();

      await waitFor(() => {
        expect(screen.getByText('E-commerce Platform')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      fireEvent.click(deleteButtons[0]);

      expect(screen.getByText(/confirm delete/i)).toBeInTheDocument();

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(screen.queryByText(/confirm delete/i)).not.toBeInTheDocument();
    });
  });
  describe('API Integration', () => {
    it('should fetch projects on mount', async () => {
      mockApiService.get.mockResolvedValueOnce(mockProjects);
      renderProjectList();

      await waitFor(() => {
        expect(mockApiService.get).toHaveBeenCalledWith('/api/projects');
      });
    });

    it('should use provided userId prop', async () => {
      mockApiService.get.mockResolvedValueOnce(mockProjects);
      renderProjectList({ userId: 'custom-user-id' });

      await waitFor(() => {
        expect(mockApiService.get).toHaveBeenCalledWith('/api/projects');
      });
    });
  });
});
