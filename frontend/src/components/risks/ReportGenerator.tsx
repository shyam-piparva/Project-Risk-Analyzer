/**
 * ReportGenerator Component
 * Handles PDF and CSV report generation with customizable options
 * Requirements: 8.1, 8.4, 8.5, 8.7
 */

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiService } from '../../services/api';

interface ReportOptions {
  includeSummary: boolean;
  includeDetailedRisks: boolean;
  includeCharts: boolean;
  includeMitigations: boolean;
  includeHistory: boolean;
}

interface ReportResponse {
  reportId: string;
  downloadUrl: string;
  type: 'PDF' | 'CSV';
  generatedAt: string;
}

interface ReportGeneratorProps {
  projectId: string;
  projectName?: string;
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({ projectId, projectName }) => {
  const [reportOptions, setReportOptions] = useState<ReportOptions>({
    includeSummary: true,
    includeDetailedRisks: true,
    includeCharts: true,
    includeMitigations: true,
    includeHistory: false,
  });

  const [generationProgress, setGenerationProgress] = useState<{
    isGenerating: boolean;
    type: 'PDF' | 'CSV' | null;
    message: string;
  }>({
    isGenerating: false,
    type: null,
    message: '',
  });

  // PDF generation mutation
  const pdfMutation = useMutation({
    mutationFn: async () => {
      setGenerationProgress({
        isGenerating: true,
        type: 'PDF',
        message: 'Generating PDF report...',
      });
      return await apiService.post<ReportResponse>(
        `/projects/${projectId}/reports/pdf`,
        { options: reportOptions }
      );
    },
    onSuccess: (data) => {
      setGenerationProgress({
        isGenerating: false,
        type: 'PDF',
        message: 'PDF report generated successfully!',
      });
      // Trigger download
      handleDownload(data.downloadUrl, `risk-report-${projectName || projectId}.pdf`);
      // Clear message after 3 seconds
      setTimeout(() => {
        setGenerationProgress({ isGenerating: false, type: null, message: '' });
      }, 3000);
    },
    onError: () => {
      setGenerationProgress({
        isGenerating: false,
        type: 'PDF',
        message: 'Failed to generate PDF report. Please try again.',
      });
      setTimeout(() => {
        setGenerationProgress({ isGenerating: false, type: null, message: '' });
      }, 3000);
    },
  });

  // CSV export mutation
  const csvMutation = useMutation({
    mutationFn: async () => {
      setGenerationProgress({
        isGenerating: true,
        type: 'CSV',
        message: 'Generating CSV export...',
      });
      return await apiService.post<ReportResponse>(
        `/projects/${projectId}/reports/csv`
      );
    },
    onSuccess: (data) => {
      setGenerationProgress({
        isGenerating: false,
        type: 'CSV',
        message: 'CSV export generated successfully!',
      });
      // Trigger download
      handleDownload(data.downloadUrl, `risk-data-${projectName || projectId}.csv`);
      // Clear message after 3 seconds
      setTimeout(() => {
        setGenerationProgress({ isGenerating: false, type: null, message: '' });
      }, 3000);
    },
    onError: () => {
      setGenerationProgress({
        isGenerating: false,
        type: 'CSV',
        message: 'Failed to generate CSV export. Please try again.',
      });
      setTimeout(() => {
        setGenerationProgress({ isGenerating: false, type: null, message: '' });
      }, 3000);
    },
  });

  // Handle download
  const handleDownload = (url: string, filename: string): void => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle option change
  const handleOptionChange = (option: keyof ReportOptions): void => {
    setReportOptions((prev) => ({
      ...prev,
      [option]: !prev[option],
    }));
  };

  // Handle PDF generation
  const handleGeneratePDF = (): void => {
    pdfMutation.mutate();
  };

  // Handle CSV export
  const handleGenerateCSV = (): void => {
    csvMutation.mutate();
  };

  const isGenerating = generationProgress.isGenerating;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Report Generator</h2>
        <p className="text-sm text-gray-600">
          Generate comprehensive reports in PDF or CSV format
        </p>
      </div>

      {/* Report Options (PDF only) */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">PDF Report Options</h3>
        <p className="text-sm text-gray-600 mb-4">
          Customize which sections to include in your PDF report
        </p>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={reportOptions.includeSummary}
              onChange={() => handleOptionChange('includeSummary')}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div>
              <div className="text-sm font-medium text-gray-800">Include Summary</div>
              <div className="text-xs text-gray-600">
                Overall project risk score and key metrics
              </div>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={reportOptions.includeDetailedRisks}
              onChange={() => handleOptionChange('includeDetailedRisks')}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div>
              <div className="text-sm font-medium text-gray-800">Include Detailed Risks</div>
              <div className="text-xs text-gray-600">
                Complete list of all identified risks with descriptions
              </div>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={reportOptions.includeCharts}
              onChange={() => handleOptionChange('includeCharts')}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div>
              <div className="text-sm font-medium text-gray-800">Include Charts</div>
              <div className="text-xs text-gray-600">
                Visual charts showing risk distribution and trends
              </div>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={reportOptions.includeMitigations}
              onChange={() => handleOptionChange('includeMitigations')}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div>
              <div className="text-sm font-medium text-gray-800">Include Mitigation Strategies</div>
              <div className="text-xs text-gray-600">
                Recommended actions to reduce or eliminate risks
              </div>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={reportOptions.includeHistory}
              onChange={() => handleOptionChange('includeHistory')}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div>
              <div className="text-sm font-medium text-gray-800">Include Historical Data</div>
              <div className="text-xs text-gray-600">
                Past analyses and risk evolution over time
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Generation Buttons */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Generate Report</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* PDF Generation */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3 mb-3">
              <svg
                className="w-8 h-8 text-red-600 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <h4 className="text-md font-semibold text-gray-800 mb-1">PDF Report</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Comprehensive report with all selected sections, charts, and visualizations
                </p>
                <button
                  onClick={handleGeneratePDF}
                  disabled={isGenerating}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {generationProgress.type === 'PDF' && isGenerating ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Generating...
                    </span>
                  ) : (
                    'Generate PDF'
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* CSV Export */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3 mb-3">
              <svg
                className="w-8 h-8 text-green-600 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <h4 className="text-md font-semibold text-gray-800 mb-1">CSV Export</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Raw data export for analysis in spreadsheet applications
                </p>
                <button
                  onClick={handleGenerateCSV}
                  disabled={isGenerating}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {generationProgress.type === 'CSV' && isGenerating ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Generating...
                    </span>
                  ) : (
                    'Export CSV'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Generation Progress/Status */}
      {generationProgress.message && (
        <div
          className={`rounded-lg p-4 ${
            generationProgress.message.includes('Failed')
              ? 'bg-red-100 border border-red-400 text-red-700'
              : generationProgress.message.includes('successfully')
              ? 'bg-green-100 border border-green-400 text-green-700'
              : 'bg-blue-100 border border-blue-400 text-blue-700'
          }`}
        >
          <div className="flex items-center gap-2">
            {isGenerating ? (
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : generationProgress.message.includes('successfully') ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <span className="font-medium">{generationProgress.message}</span>
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <svg
            className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Report Information</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>PDF reports include all selected sections with professional formatting</li>
              <li>CSV exports contain raw risk data for further analysis</li>
              <li>Reports are generated based on the latest risk analysis</li>
              <li>Download links are valid for 24 hours</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportGenerator;
