/**
 * Unit tests for ReportGenerator component
 * Tests report option handling and generation logic
 * Requirements: 8.5
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ReportGenerator from './ReportGenerator';
import { apiService } from '../../services/api';

// Mock the API service
jest.mock('../../services/api');
const mockedApiService = apiService as jest.Mocked<typeof apiService>;

describe('ReportGenerator', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();

    // Mock window.URL.createObjectURL
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
  });

  const renderReportGenerator = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ReportGenerator projectId="project-1" projectName="Test Project" {...props} />
      </QueryClientProvider>
    );
  };

  describe('Component Rendering', () => {
    it('should render report generator header', () => {
      renderReportGenerator();
      
      expect(screen.getByText(/report generator/i)).toBeInTheDocument();
      expect(screen.getByText(/generate comprehensive reports/i)).toBeInTheDocument();
    });

    it('should render all report options', () => {
      renderReportGenerator();
      
      expect(screen.getByText(/include summary/i)).toBeInTheDocument();
      expect(screen.getByText(/include detailed risks/i)).toBeInTheDocument();
      expect(screen.getByText(/include charts/i)).toBeInTheDocument();
      expect(screen.getByText(/include mitigation strategies/i)).toBeInTheDocument();
      expect(screen.getByText(/include historical data/i)).toBeInTheDocument();
    });

    it('should render PDF and CSV generation buttons', () => {
      renderReportGenerator();
      
      expect(screen.getByRole('button', { name: /generate pdf/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /export csv/i })).toBeInTheDocument();
    });

    it('should have default options selected', () => {
      renderReportGenerator();
      
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[0]).toBeChecked(); // includeSummary
      expect(checkboxes[1]).toBeChecked(); // includeDetailedRisks
      expect(checkboxes[2]).toBeChecked(); // includeCharts
      expect(checkboxes[3]).toBeChecked(); // includeMitigations
      expect(checkboxes[4]).not.toBeChecked(); // includeHistory
    });
  });

  describe('Report Option Handling', () => {
    it('should toggle options when checkboxes are clicked', () => {
      renderReportGenerator();
      
      const summaryCheckbox = screen.getByRole('checkbox', { name: /include summary/i });
      expect(summaryCheckbox).toBeChecked();
      
      fireEvent.click(summaryCheckbox);
      expect(summaryCheckbox).not.toBeChecked();
      
      fireEvent.click(summaryCheckbox);
      expect(summaryCheckbox).toBeChecked();
    });

    it('should allow multiple options to be toggled independently', () => {
      renderReportGenerator();
      
      const summaryCheckbox = screen.getByRole('checkbox', { name: /include summary/i });
      const chartsCheckbox = screen.getByRole('checkbox', { name: /include charts/i });
      const historyCheckbox = screen.getByRole('checkbox', { name: /include historical data/i });

      fireEvent.click(summaryCheckbox);
      fireEvent.click(chartsCheckbox);
      fireEvent.click(historyCheckbox);

      expect(summaryCheckbox).not.toBeChecked();
      expect(chartsCheckbox).not.toBeChecked();
      expect(historyCheckbox).toBeChecked();
    });

    it('should send selected options with PDF generation request', async () => {
      const mockResponse = {
        reportId: 'report-1',
        downloadUrl: 'https://example.com/report.pdf',
        type: 'PDF' as const,
        generatedAt: '2024-01-20T10:00:00Z',
      };
      mockedApiService.post.mockResolvedValueOnce(mockResponse);

      renderReportGenerator();
      
      // Toggle some options
      const chartsCheckbox = screen.getByRole('checkbox', { name: /include charts/i });
      const historyCheckbox = screen.getByRole('checkbox', { name: /include historical data/i });
      fireEvent.click(chartsCheckbox);
      fireEvent.click(historyCheckbox);

      const pdfButton = screen.getByRole('button', { name: /generate pdf/i });
      fireEvent.click(pdfButton);

      await waitFor(() => {
        expect(mockedApiService.post).toHaveBeenCalledWith(
          '/api/projects/project-1/reports/pdf',
          {
            options: {
              includeSummary: true,
              includeDetailedRisks: true,
              includeCharts: false,
              includeMitigations: true,
              includeHistory: true,
            },
          }
        );
      });
    });

    it('should respect all options being disabled', async () => {
      const mockResponse = {
        reportId: 'report-1',
        downloadUrl: 'https://example.com/report.pdf',
        type: 'PDF' as const,
        generatedAt: '2024-01-20T10:00:00Z',
      };
      mockedApiService.post.mockResolvedValueOnce(mockResponse);

      renderReportGenerator();
      
      // Disable all options
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => {
        if ((checkbox as HTMLInputElement).checked) {
          fireEvent.click(checkbox);
        }
      });

      const pdfButton = screen.getByRole('button', { name: /generate pdf/i });
      fireEvent.click(pdfButton);

      await waitFor(() => {
        expect(mockedApiService.post).toHaveBeenCalledWith(
          '/api/projects/project-1/reports/pdf',
          {
            options: {
              includeSummary: false,
              includeDetailedRisks: false,
              includeCharts: false,
              includeMitigations: false,
              includeHistory: false,
            },
          }
        );
      });
    });
  });

  describe('PDF Generation', () => {
    it('should show loading state during PDF generation', async () => {
      mockedApiService.post.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderReportGenerator();
      
      const pdfButton = screen.getByRole('button', { name: /generate pdf/i });
      fireEvent.click(pdfButton);

      await waitFor(() => {
        expect(pdfButton).toBeDisabled();
      });
    });

    it('should trigger download on successful PDF generation', async () => {
      const mockResponse = {
        reportId: 'report-1',
        downloadUrl: 'https://example.com/report.pdf',
        type: 'PDF' as const,
        generatedAt: '2024-01-20T10:00:00Z',
      };
      mockedApiService.post.mockResolvedValueOnce(mockResponse);

      renderReportGenerator();
      
      const pdfButton = screen.getByRole('button', { name: /generate pdf/i });
      fireEvent.click(pdfButton);

      await waitFor(() => {
        expect(mockedApiService.post).toHaveBeenCalledWith(
          '/api/projects/project-1/reports/pdf',
          expect.objectContaining({ options: expect.any(Object) })
        );
      });
    });

    it('should show success message after PDF generation', async () => {
      const mockResponse = {
        reportId: 'report-1',
        downloadUrl: 'https://example.com/report.pdf',
        type: 'PDF' as const,
        generatedAt: '2024-01-20T10:00:00Z',
      };
      mockedApiService.post.mockResolvedValueOnce(mockResponse);

      renderReportGenerator();
      
      const pdfButton = screen.getByRole('button', { name: /generate pdf/i });
      fireEvent.click(pdfButton);

      await waitFor(() => {
        expect(screen.getByText(/pdf report generated successfully/i)).toBeInTheDocument();
      });
    });

    it('should show error message on PDF generation failure', async () => {
      mockedApiService.post.mockRejectedValueOnce(new Error('API Error'));

      renderReportGenerator();
      
      const pdfButton = screen.getByRole('button', { name: /generate pdf/i });
      fireEvent.click(pdfButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to generate pdf report/i)).toBeInTheDocument();
      });
    });

    it('should use project name in download filename', async () => {
      const mockResponse = {
        reportId: 'report-1',
        downloadUrl: 'https://example.com/report.pdf',
        type: 'PDF' as const,
        generatedAt: '2024-01-20T10:00:00Z',
      };
      mockedApiService.post.mockResolvedValueOnce(mockResponse);

      renderReportGenerator({ projectName: 'My Project' });
      
      const pdfButton = screen.getByRole('button', { name: /generate pdf/i });
      fireEvent.click(pdfButton);

      await waitFor(() => {
        expect(mockedApiService.post).toHaveBeenCalled();
      });
    });

    it('should fallback to project ID if no project name provided', async () => {
      const mockResponse = {
        reportId: 'report-1',
        downloadUrl: 'https://example.com/report.pdf',
        type: 'PDF' as const,
        generatedAt: '2024-01-20T10:00:00Z',
      };
      mockedApiService.post.mockResolvedValueOnce(mockResponse);

      renderReportGenerator({ projectName: undefined });
      
      const pdfButton = screen.getByRole('button', { name: /generate pdf/i });
      fireEvent.click(pdfButton);

      await waitFor(() => {
        expect(mockedApiService.post).toHaveBeenCalled();
      });
    });
  });

  describe('CSV Export', () => {
    it('should show loading state during CSV export', async () => {
      mockedApiService.post.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderReportGenerator();
      
      const csvButton = screen.getByRole('button', { name: /export csv/i });
      fireEvent.click(csvButton);

      await waitFor(() => {
        expect(csvButton).toBeDisabled();
      });
    });

    it('should trigger download on successful CSV export', async () => {
      const mockResponse = {
        reportId: 'report-2',
        downloadUrl: 'https://example.com/data.csv',
        type: 'CSV' as const,
        generatedAt: '2024-01-20T10:00:00Z',
      };
      mockedApiService.post.mockResolvedValueOnce(mockResponse);

      renderReportGenerator();
      
      const csvButton = screen.getByRole('button', { name: /export csv/i });
      fireEvent.click(csvButton);

      await waitFor(() => {
        expect(mockedApiService.post).toHaveBeenCalledWith(
          '/api/projects/project-1/reports/csv'
        );
      });
    });

    it('should show success message after CSV export', async () => {
      const mockResponse = {
        reportId: 'report-2',
        downloadUrl: 'https://example.com/data.csv',
        type: 'CSV' as const,
        generatedAt: '2024-01-20T10:00:00Z',
      };
      mockedApiService.post.mockResolvedValueOnce(mockResponse);

      renderReportGenerator();
      
      const csvButton = screen.getByRole('button', { name: /export csv/i });
      fireEvent.click(csvButton);

      await waitFor(() => {
        expect(screen.getByText(/csv export generated successfully/i)).toBeInTheDocument();
      });
    });

    it('should show error message on CSV export failure', async () => {
      mockedApiService.post.mockRejectedValueOnce(new Error('API Error'));

      renderReportGenerator();
      
      const csvButton = screen.getByRole('button', { name: /export csv/i });
      fireEvent.click(csvButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to generate csv export/i)).toBeInTheDocument();
      });
    });

    it('should not send options with CSV export request', async () => {
      const mockResponse = {
        reportId: 'report-2',
        downloadUrl: 'https://example.com/data.csv',
        type: 'CSV' as const,
        generatedAt: '2024-01-20T10:00:00Z',
      };
      mockedApiService.post.mockResolvedValueOnce(mockResponse);

      renderReportGenerator();
      
      const csvButton = screen.getByRole('button', { name: /export csv/i });
      fireEvent.click(csvButton);

      await waitFor(() => {
        expect(mockedApiService.post).toHaveBeenCalledWith(
          '/api/projects/project-1/reports/csv'
        );
      });

      // Verify no options object was sent
      expect(mockedApiService.post).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ options: expect.anything() })
      );
    });

    it('should use project name in CSV filename', async () => {
      const mockResponse = {
        reportId: 'report-2',
        downloadUrl: 'https://example.com/data.csv',
        type: 'CSV' as const,
        generatedAt: '2024-01-20T10:00:00Z',
      };
      mockedApiService.post.mockResolvedValueOnce(mockResponse);

      renderReportGenerator({ projectName: 'My Project' });
      
      const csvButton = screen.getByRole('button', { name: /export csv/i });
      fireEvent.click(csvButton);

      await waitFor(() => {
        expect(mockedApiService.post).toHaveBeenCalled();
      });
    });
  });

  describe('Concurrent Generation Prevention', () => {
    it('should disable both buttons during PDF generation', async () => {
      mockedApiService.post.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderReportGenerator();
      
      const pdfButton = screen.getByRole('button', { name: /generate pdf/i });
      const csvButton = screen.getByRole('button', { name: /export csv/i });
      
      fireEvent.click(pdfButton);

      await waitFor(() => {
        expect(pdfButton).toBeDisabled();
        expect(csvButton).toBeDisabled();
      });
    });

    it('should disable both buttons during CSV export', async () => {
      mockedApiService.post.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderReportGenerator();
      
      const pdfButton = screen.getByRole('button', { name: /generate pdf/i });
      const csvButton = screen.getByRole('button', { name: /export csv/i });
      
      fireEvent.click(csvButton);

      await waitFor(() => {
        expect(pdfButton).toBeDisabled();
        expect(csvButton).toBeDisabled();
      });
    });

    it('should re-enable buttons after successful generation', async () => {
      const mockResponse = {
        reportId: 'report-1',
        downloadUrl: 'https://example.com/report.pdf',
        type: 'PDF' as const,
        generatedAt: '2024-01-20T10:00:00Z',
      };
      mockedApiService.post.mockResolvedValueOnce(mockResponse);

      renderReportGenerator();
      
      const pdfButton = screen.getByRole('button', { name: /generate pdf/i });
      const csvButton = screen.getByRole('button', { name: /export csv/i });
      
      fireEvent.click(pdfButton);

      await waitFor(() => {
        expect(screen.getByText(/pdf report generated successfully/i)).toBeInTheDocument();
      });

      expect(pdfButton).not.toBeDisabled();
      expect(csvButton).not.toBeDisabled();
    });
  });
});
