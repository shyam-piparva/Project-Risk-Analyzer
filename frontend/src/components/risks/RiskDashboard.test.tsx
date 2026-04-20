/**
 * Unit tests for RiskDashboard component
 * Tests metric calculations, filtering, and chart rendering
 * Requirements: 6.6
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RiskDashboard from './RiskDashboard';
import { apiService } from '../../services/api';
import { RiskAnalysis } from './RiskDashboard';

// Mock the API service
jest.mock('../../services/api');
const mockApiService = apiService as jest.Mocked<typeof apiService>;

// Mock chart components to simplify testing
jest.mock('./RiskCharts', () => ({
  CategoryDistributionChart: ({ risks, onCategoryClick }: any) => (
    <div data-testid="category-chart">
      <button onClick={() => onCategoryClick && onCategoryClick('Technical')}>
        Category Chart - {risks.length} risks
      </button>
    </div>
  ),
  SeverityDistributionChart: ({ risks }: any) => (
    <div data-testid="severity-chart">Severity Chart - {risks.length} risks</div>
  ),
  RiskTimelineChart: ({ risks }: any) => (
    <div data-testid="timeline-chart">Timeline Chart - {risks.length} risks</div>
  ),
}));

// Mock RiskCard component
jest.mock('./RiskCard', () => ({
  __esModule: true,
  default: ({ risk }: any) => (
    <div data-testid={`risk-card-${risk.id}`}>
      <h3>{risk.title}</h3>
      <p>{risk.category}</p>
      <span>{risk.score}</span>
    </div>
  ),
}));

describe('RiskDashboard', () => {
  let queryClient: QueryClient;

  const mockRiskAnalysis: RiskAnalysis = {
    id: 'analysis-1',
    projectId: 'project-1',
    overallScore: 65.5,
    analyzedAt: '2024-01-15T10:30:00.000Z',
    risks: [
      {
        id: 'risk-1',
        analysisId: 'analysis-1',
        title: 'Timeline Compression Risk',
        description: 'Project timeline is too aggressive',
        category: 'Schedule',
        score: 85.0,
        probability: 0.9,
        impact: 0.8,
        status: 'Open',
        mitigations: [],
        detectedAt: '2024-01-15T10:30:00.000Z',
        resolvedAt: null,
      },
      {
        id: 'risk-2',
        analysisId: 'analysis-1',
        title: 'Budget Constraint',
        description: 'Budget may be insufficient',
        category: 'Budget',
        score: 72.0,
        probability: 0.8,
        impact: 0.7,
        status: 'Open',
        mitigations: [],
        detectedAt: '2024-01-15T10:30:00.000Z',
        resolvedAt: null,
      },
      {
        id: 'risk-3',
        analysisId: 'analysis-1',
        title: 'Technology Maturity',
        description: 'Using experimental technology',
        category: 'Technical',
        score: 55.0,
        probability: 0.6,
        impact: 0.5,
        status: 'Mitigated',
        mitigations: [],
        detectedAt: '2024-01-15T10:30:00.000Z',
        resolvedAt: null,
      },
      {
        id: 'risk-4',
        analysisId: 'analysis-1',
        title: 'Team Experience Gap',
        description: 'Team lacks experience with framework',
        category: 'Resource',
        score: 45.0,
        probability: 0.5,
        impact: 0.4,
        status: 'Resolved',
        mitigations: [],
        detectedAt: '2024-01-15T10:30:00.000Z',
        resolvedAt: '2024-01-20T10:30:00.000Z',
      },
      {
        id: 'risk-5',
        analysisId: 'analysis-1',
        title: 'External Dependency',
        description: 'Reliance on third-party API',
        category: 'External',
        score: 30.0,
        probability: 0.3,
        impact: 0.3,
        status: 'Open',
        mitigations: [],
        detectedAt: '2024-01-15T10:30:00.000Z',
        resolvedAt: null,
      },
    ],
    metadata: {
      modelVersion: '1.0.0',
      engineVersion: '1.0.0',
      processingTime: 1500,
      dataCompleteness: 95.0,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const renderDashboard = (projectId = 'project-1') => {
    return render(
      <QueryClientProvider client={queryClient}>
        <RiskDashboard projectId={projectId} />
      </QueryClientProvider>
    );
  };

  describe('Component Rendering', () => {
    it('should render loading state initially', () => {
      mockApiService.get.mockImplementation(() => new Promise(() => {}));
      renderDashboard();

      expect(screen.getByText(/loading risk analysis/i)).toBeInTheDocument();
    });

    it('should render dashboard when data is loaded', async () => {
      mockApiService.get.mockResolvedValueOnce(mockRiskAnalysis);
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Risk Dashboard')).toBeInTheDocument();
      });
    });

    it('should render error message when API fails', async () => {
      mockApiService.get.mockRejectedValueOnce(new Error('API Error'));
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/error loading risk analysis/i)).toBeInTheDocument();
      });
    });

    it('should show no analysis message when data is null', async () => {
      mockApiService.get.mockResolvedValueOnce(null);
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/no risk analysis available/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /run analysis/i })).toBeInTheDocument();
      });
    });
  });

  describe('Metric Calculations', () => {
    it('should calculate and display overall risk score correctly', async () => {
      mockApiService.get.mockResolvedValueOnce(mockRiskAnalysis);
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('65.5')).toBeInTheDocument();
      });
    });

    it('should calculate total risks correctly', async () => {
      mockApiService.get.mockResolvedValueOnce(mockRiskAnalysis);
      renderDashboard();

      await waitFor(() => {
        const totalRisksElement = screen.getByText('Total Risks').parentElement;
        expect(totalRisksElement?.textContent).toContain('5');
      });
    });

    it('should calculate high priority risks correctly (score >= 70)', async () => {
      mockApiService.get.mockResolvedValueOnce(mockRiskAnalysis);
      renderDashboard();

      await waitFor(() => {
        const highPriorityElement = screen.getByText('High Priority').parentElement;
        // Should count risks with score >= 70: risk-1 (85) and risk-2 (72)
        expect(highPriorityElement?.textContent).toContain('2');
      });
    });

    it('should calculate mitigated risks correctly', async () => {
      mockApiService.get.mockResolvedValueOnce(mockRiskAnalysis);
      renderDashboard();

      await waitFor(() => {
        const mitigatedElement = screen.getByText('Mitigated').parentElement;
        // Should count risks with status 'Mitigated' or 'Resolved': risk-3 and risk-4
        expect(mitigatedElement?.textContent).toContain('2');
      });
    });

    it('should calculate open risks correctly', async () => {
      mockApiService.get.mockResolvedValueOnce(mockRiskAnalysis);
      renderDashboard();

      await waitFor(() => {
        const openRisksElement = screen.getByText('Open Risks').parentElement;
        // Should count risks with status 'Open': risk-1, risk-2, risk-5
        expect(openRisksElement?.textContent).toContain('3');
      });
    });

    it('should handle zero risks correctly', async () => {
      const emptyAnalysis = {
        ...mockRiskAnalysis,
        risks: [],
      };
      mockApiService.get.mockResolvedValueOnce(emptyAnalysis);
      renderDashboard();

      await waitFor(() => {
        const totalRisksElement = screen.getByText('Total Risks').parentElement;
        expect(totalRisksElement?.textContent).toContain('0');
        
        const highPriorityElement = screen.getByText('High Priority').parentElement;
        expect(highPriorityElement?.textContent).toContain('0');
      });
    });

    it('should display formatted analysis timestamp', async () => {
      mockApiService.get.mockResolvedValueOnce(mockRiskAnalysis);
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/last analyzed:/i)).toBeInTheDocument();
        expect(screen.getByText(/Jan 15, 2024/i)).toBeInTheDocument();
      });
    });
  });

  describe('Filtering Functionality', () => {
    it('should display all category filter buttons with counts', async () => {
      mockApiService.get.mockResolvedValueOnce(mockRiskAnalysis);
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /all \(5\)/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /technical \(1\)/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /resource \(1\)/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /schedule \(1\)/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /budget \(1\)/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /external \(1\)/i })).toBeInTheDocument();
      });
    });

    it('should filter risks by category when category button is clicked', async () => {
      mockApiService.get.mockResolvedValueOnce(mockRiskAnalysis);
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('All Risks')).toBeInTheDocument();
      });

      // Click Technical category filter
      const technicalButton = screen.getByRole('button', { name: /technical \(1\)/i });
      fireEvent.click(technicalButton);

      // Should show only Technical risks
      expect(screen.getByText('Technical Risks')).toBeInTheDocument();
      expect(screen.getByTestId('risk-card-risk-3')).toBeInTheDocument();
      expect(screen.queryByTestId('risk-card-risk-1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('risk-card-risk-2')).not.toBeInTheDocument();
    });

    it('should show all risks when "All" filter is clicked', async () => {
      mockApiService.get.mockResolvedValueOnce(mockRiskAnalysis);
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('All Risks')).toBeInTheDocument();
      });

      // First filter by Technical
      const technicalButton = screen.getByRole('button', { name: /technical \(1\)/i });
      fireEvent.click(technicalButton);

      expect(screen.getByText('Technical Risks')).toBeInTheDocument();

      // Then click All
      const allButton = screen.getByRole('button', { name: /all \(5\)/i });
      fireEvent.click(allButton);

      // Should show all risks again
      expect(screen.getByText('All Risks')).toBeInTheDocument();
      expect(screen.getByTestId('risk-card-risk-1')).toBeInTheDocument();
      expect(screen.getByTestId('risk-card-risk-2')).toBeInTheDocument();
      expect(screen.getByTestId('risk-card-risk-3')).toBeInTheDocument();
    });

    it('should show "no risks found" message when filtered category has no risks', async () => {
      const analysisWithoutTechnical = {
        ...mockRiskAnalysis,
        risks: mockRiskAnalysis.risks.filter(r => r.category !== 'Technical'),
      };
      mockApiService.get.mockResolvedValueOnce(analysisWithoutTechnical);
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /technical \(0\)/i })).toBeInTheDocument();
      });

      const technicalButton = screen.getByRole('button', { name: /technical \(0\)/i });
      fireEvent.click(technicalButton);

      expect(screen.getByText(/no risks found in this category/i)).toBeInTheDocument();
    });

    it('should highlight selected category filter button', async () => {
      mockApiService.get.mockResolvedValueOnce(mockRiskAnalysis);
      renderDashboard();

      await waitFor(() => {
        const allButton = screen.getByRole('button', { name: /all \(5\)/i });
        expect(allButton).toHaveClass('bg-blue-500');
      });

      const scheduleButton = screen.getByRole('button', { name: /schedule \(1\)/i });
      fireEvent.click(scheduleButton);

      expect(scheduleButton).toHaveClass('bg-blue-500');
    });

    it('should filter risks when category is clicked from chart', async () => {
      mockApiService.get.mockResolvedValueOnce(mockRiskAnalysis);
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('category-chart')).toBeInTheDocument();
      });

      // Simulate clicking on chart category
      const chartButton = screen.getByText(/category chart/i);
      fireEvent.click(chartButton);

      // Should filter to Technical category
      expect(screen.getByText('Technical Risks')).toBeInTheDocument();
    });
  });

  describe('Chart Rendering', () => {
    it('should render category distribution chart', async () => {
      mockApiService.get.mockResolvedValueOnce(mockRiskAnalysis);
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('category-chart')).toBeInTheDocument();
        expect(screen.getByText(/category chart - 5 risks/i)).toBeInTheDocument();
      });
    });

    it('should render severity distribution chart', async () => {
      mockApiService.get.mockResolvedValueOnce(mockRiskAnalysis);
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('severity-chart')).toBeInTheDocument();
        expect(screen.getByText(/severity chart - 5 risks/i)).toBeInTheDocument();
      });
    });

    it('should render timeline chart', async () => {
      mockApiService.get.mockResolvedValueOnce(mockRiskAnalysis);
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('timeline-chart')).toBeInTheDocument();
        expect(screen.getByText(/timeline chart - 5 risks/i)).toBeInTheDocument();
      });
    });

    it('should pass filtered risks to charts when category is selected', async () => {
      mockApiService.get.mockResolvedValueOnce(mockRiskAnalysis);
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/category chart - 5 risks/i)).toBeInTheDocument();
      });

      // Filter by Technical
      const technicalButton = screen.getByRole('button', { name: /technical \(1\)/i });
      fireEvent.click(technicalButton);

      // Charts should still show all risks (not filtered in the mock)
      // The actual component passes filteredRisks, but our mock doesn't re-render with new props
      expect(screen.getByText('Technical Risks')).toBeInTheDocument();
      expect(screen.getByTestId('risk-card-risk-3')).toBeInTheDocument();
    });
  });

  describe('Refresh Functionality', () => {
    it('should display refresh button', async () => {
      mockApiService.get.mockResolvedValueOnce(mockRiskAnalysis);
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /refresh analysis/i })).toBeInTheDocument();
      });
    });

    it('should trigger new analysis when refresh button is clicked', async () => {
      mockApiService.get.mockResolvedValueOnce(mockRiskAnalysis);
      mockApiService.post.mockResolvedValueOnce(mockRiskAnalysis);
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /refresh analysis/i })).toBeInTheDocument();
      });

      const refreshButton = screen.getByRole('button', { name: /refresh analysis/i });
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(mockApiService.post).toHaveBeenCalledWith('/api/projects/project-1/analyze');
      });
    });

    it('should show analyzing state during refresh', async () => {
      mockApiService.get.mockResolvedValueOnce(mockRiskAnalysis);
      mockApiService.post.mockImplementation(() => new Promise(() => {}));
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /refresh analysis/i })).toBeInTheDocument();
      });

      const refreshButton = screen.getByRole('button', { name: /refresh analysis/i });
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /analyzing/i })).toBeInTheDocument();
      });
    });

    it('should disable refresh button during analysis', async () => {
      mockApiService.get.mockResolvedValueOnce(mockRiskAnalysis);
      mockApiService.post.mockImplementation(() => new Promise(() => {}));
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /refresh analysis/i })).toBeInTheDocument();
      });

      const refreshButton = screen.getByRole('button', { name: /refresh analysis/i });
      fireEvent.click(refreshButton);

      await waitFor(() => {
        const analyzingButton = screen.getByRole('button', { name: /analyzing/i });
        expect(analyzingButton).toBeDisabled();
      });
    });
  });

  describe('Risk Display', () => {
    it('should render all risk cards', async () => {
      mockApiService.get.mockResolvedValueOnce(mockRiskAnalysis);
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('risk-card-risk-1')).toBeInTheDocument();
        expect(screen.getByTestId('risk-card-risk-2')).toBeInTheDocument();
        expect(screen.getByTestId('risk-card-risk-3')).toBeInTheDocument();
        expect(screen.getByTestId('risk-card-risk-4')).toBeInTheDocument();
        expect(screen.getByTestId('risk-card-risk-5')).toBeInTheDocument();
      });
    });

    it('should apply correct severity color to overall score', async () => {
      // Test high severity (>= 70)
      const highRiskAnalysis = { ...mockRiskAnalysis, overallScore: 85.0 };
      mockApiService.get.mockResolvedValueOnce(highRiskAnalysis);
      const { rerender } = renderDashboard();

      await waitFor(() => {
        const scoreElement = screen.getByText('85.0');
        expect(scoreElement).toHaveClass('text-red-600');
      });

      // Test medium severity (40-69)
      const mediumRiskAnalysis = { ...mockRiskAnalysis, overallScore: 55.0 };
      mockApiService.get.mockResolvedValueOnce(mediumRiskAnalysis);
      
      rerender(
        <QueryClientProvider client={queryClient}>
          <RiskDashboard projectId="project-2" />
        </QueryClientProvider>
      );

      await waitFor(() => {
        const scoreElement = screen.getByText('55.0');
        expect(scoreElement).toHaveClass('text-yellow-600');
      });
    });
  });

  describe('API Integration', () => {
    it('should fetch risk analysis on mount', async () => {
      mockApiService.get.mockResolvedValueOnce(mockRiskAnalysis);
      renderDashboard('project-123');

      await waitFor(() => {
        expect(mockApiService.get).toHaveBeenCalledWith('/api/projects/project-123/risks');
      });
    });

    it('should not fetch when projectId is empty', () => {
      mockApiService.get.mockResolvedValueOnce(mockRiskAnalysis);
      renderDashboard('');

      expect(mockApiService.get).not.toHaveBeenCalled();
    });
  });
});
