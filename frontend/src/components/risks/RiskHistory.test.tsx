/**
 * Unit tests for RiskHistory component
 * Tests comparison logic and historical data display
 * Requirements: 7.3
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RiskHistory from './RiskHistory';
import { apiService } from '../../services/api';

// Mock the API service
jest.mock('../../services/api');
const mockedApiService = apiService as jest.Mocked<typeof apiService>;

// Mock data
const mockAnalysis1 = {
  id: 'analysis-1',
  projectId: 'project-1',
  overallScore: 65.5,
  analyzedAt: '2024-01-15T10:00:00Z',
  risks: [
    {
      id: 'risk-1',
      title: 'Timeline Risk',
      description: 'Project timeline is compressed',
      category: 'Schedule',
      score: 75.0,
      probability: 0.8,
      impact: 0.7,
      status: 'Open',
      mitigations: [],
    },
    {
      id: 'risk-2',
      title: 'Budget Risk',
      description: 'Budget constraints',
      category: 'Budget',
      score: 60.0,
      probability: 0.6,
      impact: 0.5,
      status: 'Open',
      mitigations: [],
    },
  ],
  metadata: {
    modelVersion: '1.0',
    engineVersion: '1.0',
    processingTime: 1500,
    dataCompleteness: 95,
  },
};

const mockAnalysis2 = {
  id: 'analysis-2',
  projectId: 'project-1',
  overallScore: 55.0,
  analyzedAt: '2024-01-20T10:00:00Z',
  risks: [
    {
      id: 'risk-1',
      title: 'Timeline Risk',
      description: 'Project timeline is compressed',
      category: 'Schedule',
      score: 65.0,
      probability: 0.7,
      impact: 0.6,
      status: 'In Progress',
      mitigations: [],
    },
    {
      id: 'risk-3',
      title: 'Technical Risk',
      description: 'New technology',
      category: 'Technical',
      score: 50.0,
      probability: 0.5,
      impact: 0.5,
      status: 'Open',
      mitigations: [],
    },
  ],
  metadata: {
    modelVersion: '1.0',
    engineVersion: '1.0',
    processingTime: 1200,
    dataCompleteness: 98,
  },
};

const mockComparison = {
  analysis1: mockAnalysis1,
  analysis2: mockAnalysis2,
  overallScoreChange: -10.5,
  riskCountChange: 0,
  newRisks: [
    { id: 'risk-3', title: 'Technical Risk', score: 50.0 },
  ],
  resolvedRisks: [
    { id: 'risk-2', title: 'Budget Risk', score: 60.0 },
  ],
  changedRisks: [
    {
      id: 'risk-1',
      title: 'Timeline Risk',
      oldScore: 75.0,
      newScore: 65.0,
      scoreChange: -10.0,
    },
  ],
};

describe('RiskHistory', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  const renderRiskHistory = (projectId = 'project-1') => {
    return render(
      <QueryClientProvider client={queryClient}>
        <RiskHistory projectId={projectId} />
      </QueryClientProvider>
    );
  };

  describe('Component Rendering', () => {
    it('should show loading state initially', () => {
      mockedApiService.get.mockImplementation(() => new Promise(() => {}));
      renderRiskHistory();
      
      expect(screen.getByText(/loading analysis history/i)).toBeInTheDocument();
    });

    it('should display error message on fetch failure', async () => {
      mockedApiService.get.mockRejectedValueOnce(new Error('API Error'));
      renderRiskHistory();

      await waitFor(() => {
        expect(screen.getByText(/error loading analysis history/i)).toBeInTheDocument();
      });
    });

    it('should display message when no history available', async () => {
      mockedApiService.get.mockResolvedValueOnce([]);
      renderRiskHistory();

      await waitFor(() => {
        expect(screen.getByText(/no analysis history available/i)).toBeInTheDocument();
      });
    });

    it('should render analysis history list', async () => {
      mockedApiService.get.mockResolvedValueOnce([mockAnalysis1, mockAnalysis2]);
      renderRiskHistory();

      await waitFor(() => {
        expect(screen.getByText(/risk analysis history/i)).toBeInTheDocument();
        expect(screen.getByText(/past analyses \(2\)/i)).toBeInTheDocument();
      });
    });
  });

  describe('Comparison Logic', () => {
    beforeEach(async () => {
      mockedApiService.get.mockResolvedValueOnce([mockAnalysis1, mockAnalysis2]);
      renderRiskHistory();
      
      await waitFor(() => {
        expect(screen.getByText(/compare analyses/i)).toBeInTheDocument();
      });
    });

    it('should enable compare button when two analyses are selected', async () => {
      const select1 = screen.getAllByRole('combobox')[0];
      const select2 = screen.getAllByRole('combobox')[1];
      const compareButton = screen.getByRole('button', { name: /compare/i });

      expect(compareButton).toBeDisabled();

      fireEvent.change(select1, { target: { value: 'analysis-1' } });
      fireEvent.change(select2, { target: { value: 'analysis-2' } });

      expect(compareButton).not.toBeDisabled();
    });

    it('should fetch comparison data when compare button is clicked', async () => {
      mockedApiService.get.mockResolvedValueOnce(mockComparison);

      const select1 = screen.getAllByRole('combobox')[0];
      const select2 = screen.getAllByRole('combobox')[1];
      const compareButton = screen.getByRole('button', { name: /compare/i });

      fireEvent.change(select1, { target: { value: 'analysis-1' } });
      fireEvent.change(select2, { target: { value: 'analysis-2' } });
      fireEvent.click(compareButton);

      await waitFor(() => {
        expect(mockedApiService.get).toHaveBeenCalledWith(
          '/api/risks/compare?analysis1=analysis-1&analysis2=analysis-2'
        );
      });
    });

    it('should display overall score change correctly', async () => {
      mockedApiService.get.mockResolvedValueOnce(mockComparison);

      const select1 = screen.getAllByRole('combobox')[0];
      const select2 = screen.getAllByRole('combobox')[1];
      const compareButton = screen.getByRole('button', { name: /compare/i });

      fireEvent.change(select1, { target: { value: 'analysis-1' } });
      fireEvent.change(select2, { target: { value: 'analysis-2' } });
      fireEvent.click(compareButton);

      await waitFor(() => {
        expect(screen.getByText(/overall score change/i)).toBeInTheDocument();
        expect(screen.getByText('-10.5')).toBeInTheDocument();
      });
    });

    it('should display risk count change correctly', async () => {
      mockedApiService.get.mockResolvedValueOnce(mockComparison);

      const select1 = screen.getAllByRole('combobox')[0];
      const select2 = screen.getAllByRole('combobox')[1];
      const compareButton = screen.getByRole('button', { name: /compare/i });

      fireEvent.change(select1, { target: { value: 'analysis-1' } });
      fireEvent.change(select2, { target: { value: 'analysis-2' } });
      fireEvent.click(compareButton);

      await waitFor(() => {
        expect(screen.getByText(/risk count change/i)).toBeInTheDocument();
      });
    });

    it('should display new risks section', async () => {
      mockedApiService.get.mockResolvedValueOnce(mockComparison);

      const select1 = screen.getAllByRole('combobox')[0];
      const select2 = screen.getAllByRole('combobox')[1];
      const compareButton = screen.getByRole('button', { name: /compare/i });

      fireEvent.change(select1, { target: { value: 'analysis-1' } });
      fireEvent.change(select2, { target: { value: 'analysis-2' } });
      fireEvent.click(compareButton);

      await waitFor(() => {
        expect(screen.getByText(/new risks \(1\)/i)).toBeInTheDocument();
        expect(screen.getByText('Technical Risk')).toBeInTheDocument();
      });
    });

    it('should display resolved risks section', async () => {
      mockedApiService.get.mockResolvedValueOnce(mockComparison);

      const select1 = screen.getAllByRole('combobox')[0];
      const select2 = screen.getAllByRole('combobox')[1];
      const compareButton = screen.getByRole('button', { name: /compare/i });

      fireEvent.change(select1, { target: { value: 'analysis-1' } });
      fireEvent.change(select2, { target: { value: 'analysis-2' } });
      fireEvent.click(compareButton);

      await waitFor(() => {
        expect(screen.getByText(/resolved risks \(1\)/i)).toBeInTheDocument();
        expect(screen.getByText('Budget Risk')).toBeInTheDocument();
      });
    });

    it('should display changed risks with score differences', async () => {
      mockedApiService.get.mockResolvedValueOnce(mockComparison);

      const select1 = screen.getAllByRole('combobox')[0];
      const select2 = screen.getAllByRole('combobox')[1];
      const compareButton = screen.getByRole('button', { name: /compare/i });

      fireEvent.change(select1, { target: { value: 'analysis-1' } });
      fireEvent.change(select2, { target: { value: 'analysis-2' } });
      fireEvent.click(compareButton);

      await waitFor(() => {
        expect(screen.getByText(/changed risks \(1\)/i)).toBeInTheDocument();
        expect(screen.getByText('Timeline Risk')).toBeInTheDocument();
        expect(screen.getByText('(-10.0)')).toBeInTheDocument();
      });
    });

    it('should clear comparison when reset button is clicked', async () => {
      mockedApiService.get.mockResolvedValueOnce(mockComparison);

      const select1 = screen.getAllByRole('combobox')[0];
      const select2 = screen.getAllByRole('combobox')[1];
      const compareButton = screen.getByRole('button', { name: /compare/i });

      fireEvent.change(select1, { target: { value: 'analysis-1' } });
      fireEvent.change(select2, { target: { value: 'analysis-2' } });
      fireEvent.click(compareButton);

      await waitFor(() => {
        expect(screen.getByText(/comparison results/i)).toBeInTheDocument();
      });

      const clearButton = screen.getByRole('button', { name: /clear comparison/i });
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(screen.queryByText(/comparison results/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Historical Data Display', () => {
    it('should display all analyses in chronological order', async () => {
      mockedApiService.get.mockResolvedValueOnce([mockAnalysis1, mockAnalysis2]);
      renderRiskHistory();

      await waitFor(() => {
        expect(screen.getByText(/analysis #2/i)).toBeInTheDocument();
        expect(screen.getByText(/analysis #1/i)).toBeInTheDocument();
      });
    });

    it('should display analysis metrics correctly', async () => {
      mockedApiService.get.mockResolvedValueOnce([mockAnalysis1]);
      renderRiskHistory();

      await waitFor(() => {
        expect(screen.getByText('65.5')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument(); // Total risks
        expect(screen.getByText('1')).toBeInTheDocument(); // High priority (score >= 70)
        expect(screen.getByText('1500ms')).toBeInTheDocument(); // Processing time
      });
    });

    it('should format dates correctly', async () => {
      mockedApiService.get.mockResolvedValueOnce([mockAnalysis1]);
      renderRiskHistory();

      await waitFor(() => {
        const dateElements = screen.getAllByText(/Jan 15, 2024/i);
        expect(dateElements.length).toBeGreaterThan(0);
        expect(dateElements[0]).toBeInTheDocument();
      });
    });
  });
});
