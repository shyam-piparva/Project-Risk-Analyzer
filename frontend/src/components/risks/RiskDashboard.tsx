/**
 * RiskDashboard Component
 * Main dashboard for risk visualization with metrics, filters, and refresh functionality
 * Requirements: 6.1, 6.6
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../services/api';
import RiskCard from './RiskCard';
import { CategoryDistributionChart, SeverityDistributionChart, RiskTimelineChart } from './RiskCharts';

// Types
export type RiskCategory = 'Technical' | 'Resource' | 'Schedule' | 'Budget' | 'External';
export type RiskStatus = 'Open' | 'In Progress' | 'Mitigated' | 'Resolved' | 'Accepted';

export interface Mitigation {
  id: string;
  riskId: string;
  strategy: string;
  priority: 'High' | 'Medium' | 'Low';
  estimatedEffort: string;
  isImplemented: boolean;
  implementedAt: string | null;
  isCustom: boolean;
  createdAt: string;
}

export interface Risk {
  id: string;
  analysisId: string;
  title: string;
  description: string;
  category: RiskCategory;
  score: number;
  probability: number;
  impact: number;
  status: RiskStatus;
  mitigations: Mitigation[];
  detectedAt: string;
  resolvedAt: string | null;
}

export interface RiskAnalysis {
  id: string;
  projectId: string;
  overallScore: number;
  analyzedAt: string;
  risks: Risk[];
  metadata: {
    modelVersion: string;
    engineVersion: string;
    processingTime: number;
    dataCompleteness: number;
  };
}

interface RiskDashboardProps {
  projectId: string;
}

const RiskDashboard: React.FC<RiskDashboardProps> = ({ projectId }) => {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<RiskCategory | null>(null);
  const [autoAnalyzed, setAutoAnalyzed] = useState(false);

  // Fetch risk analysis
  const { data: riskData, isLoading, error } = useQuery<RiskAnalysis>({
    queryKey: ['riskAnalysis', projectId],
    queryFn: async () => {
      return await apiService.get<RiskAnalysis>(`/projects/${projectId}/risks`);
    },
    enabled: !!projectId,
    retry: false, // Don't retry on 404
  });

  // Trigger new analysis mutation
  const analyzeMutation = useMutation({
    mutationFn: async () => {
      return await apiService.post<RiskAnalysis>(`/projects/${projectId}/analyze`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riskAnalysis', projectId] });
      setAutoAnalyzed(true);
    },
  });

  // Auto-trigger analysis if no data exists and haven't auto-analyzed yet
  React.useEffect(() => {
    if (!isLoading && !riskData && !autoAnalyzed && !analyzeMutation.isPending) {
      analyzeMutation.mutate();
    }
  }, [isLoading, riskData, autoAnalyzed, analyzeMutation]);

  // Handle refresh/re-analysis
  const handleRefresh = async (): Promise<void> => {
    await analyzeMutation.mutateAsync();
  };

  // Handle category filter
  const handleCategoryFilter = (category: RiskCategory | null): void => {
    setSelectedCategory(category);
  };

  // Filter risks by selected category
  const filteredRisks = selectedCategory
    ? riskData?.risks.filter((risk) => risk.category === selectedCategory) || []
    : riskData?.risks || [];

  // Calculate key metrics
  const totalRisks = riskData?.risks.length || 0;
  const highPriorityRisks = riskData?.risks.filter((risk) => risk.score >= 70).length || 0;
  const mitigatedRisks = riskData?.risks.filter((risk) => risk.status === 'Mitigated' || risk.status === 'Resolved').length || 0;
  const openRisks = riskData?.risks.filter((risk) => risk.status === 'Open').length || 0;

  // Get severity color
  const getSeverityColor = (score: number): string => {
    if (score >= 70) return 'text-red-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-green-600';
  };

  // Get severity background color


  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-600">Loading risk analysis...</div>
      </div>
    );
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isPermissionError = errorMessage.includes('permission') || errorMessage.includes('403');
    
    return (
      <div className={`border px-4 py-3 rounded ${
        isPermissionError 
          ? 'bg-yellow-100 border-yellow-400 text-yellow-700'
          : 'bg-red-100 border-red-400 text-red-700'
      }`}>
        {isPermissionError 
          ? 'You do not have permission to view this project\'s risk analysis.'
          : 'Error loading risk analysis. Please try again.'}
      </div>
    );
  }

  if (!riskData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">No risk analysis available for this project.</p>
        <button
          onClick={handleRefresh}
          disabled={analyzeMutation.isPending}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg disabled:opacity-50"
        >
          {analyzeMutation.isPending ? 'Analyzing...' : 'Run Analysis'}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header with overall score and refresh button */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Risk Dashboard</h2>
          <button
            onClick={handleRefresh}
            disabled={analyzeMutation.isPending}
            className="bg-blue-500 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {analyzeMutation.isPending ? 'Analyzing...' : 'Refresh Analysis'}
          </button>
        </div>

        {/* Overall Risk Score */}
        <div className="text-center">
          <div className="text-sm text-gray-600 mb-2">Overall Project Risk Score</div>
          <div className={`text-6xl font-bold ${getSeverityColor(riskData.overallScore)}`}>
            {riskData.overallScore.toFixed(1)}
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Last analyzed: {formatDate(riskData.analyzedAt)}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-sm text-gray-600 mb-2">Total Risks</div>
          <div className="text-3xl font-bold text-gray-800">{totalRisks}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-sm text-gray-600 mb-2">High Priority</div>
          <div className="text-3xl font-bold text-red-600">{highPriorityRisks}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-sm text-gray-600 mb-2">Mitigated</div>
          <div className="text-3xl font-bold text-green-600">{mitigatedRisks}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-sm text-gray-600 mb-2">Open Risks</div>
          <div className="text-3xl font-bold text-yellow-600">{openRisks}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Risk Distribution by Category</h3>
          <CategoryDistributionChart
            risks={riskData.risks}
            onCategoryClick={handleCategoryFilter}
          />
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Risk Distribution by Severity</h3>
          <SeverityDistributionChart risks={riskData.risks} />
        </div>
      </div>

      {/* Timeline Chart */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Risk Timeline</h3>
        <RiskTimelineChart risks={riskData.risks} />
      </div>

      {/* Category Filter */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-sm text-gray-600 mb-3">Filter by Category</div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleCategoryFilter(null)}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              selectedCategory === null
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All ({totalRisks})
          </button>
          {(['Technical', 'Resource', 'Schedule', 'Budget', 'External'] as RiskCategory[]).map((category) => {
            const count = riskData.risks.filter((risk) => risk.category === category).length;
            return (
              <button
                key={category}
                onClick={() => handleCategoryFilter(category)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {category} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Risks List using RiskCard */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-800">
          {selectedCategory ? `${selectedCategory} Risks` : 'All Risks'}
        </h3>
        {filteredRisks.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-600">
            No risks found in this category.
          </div>
        ) : (
          filteredRisks.map((risk) => (
            <RiskCard key={risk.id} risk={risk} />
          ))
        )}
      </div>

      {/* Analysis Error */}
      {analyzeMutation.isError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Failed to run analysis.</strong>
          <p className="mt-1 text-sm">
            {analyzeMutation.error instanceof Error 
              ? analyzeMutation.error.message 
              : 'An error occurred while analyzing the project. Please try again.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default RiskDashboard;
