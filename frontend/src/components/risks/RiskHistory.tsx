/**
 * RiskHistory Component
 * Displays historical risk analyses with comparison functionality
 * Requirements: 7.2, 7.3
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../../services/api';
import { RiskAnalysis } from './RiskDashboard';

interface AnalysisComparison {
  analysis1: RiskAnalysis;
  analysis2: RiskAnalysis;
  overallScoreChange: number;
  riskCountChange: number;
  newRisks: Array<{ id: string; title: string; score: number }>;
  resolvedRisks: Array<{ id: string; title: string; score: number }>;
  changedRisks: Array<{
    id: string;
    title: string;
    oldScore: number;
    newScore: number;
    scoreChange: number;
  }>;
}

interface RiskHistoryProps {
  projectId: string;
}

const RiskHistory: React.FC<RiskHistoryProps> = ({ projectId }) => {
  const [selectedAnalysis1, setSelectedAnalysis1] = useState<string | null>(null);
  const [selectedAnalysis2, setSelectedAnalysis2] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  // Fetch analysis history
  const { data: history, isLoading, error } = useQuery<RiskAnalysis[]>({
    queryKey: ['riskHistory', projectId],
    queryFn: async () => {
      return await apiService.get<RiskAnalysis[]>(`/projects/${projectId}/risks/history`);
    },
    enabled: !!projectId,
  });

  // Fetch comparison data
  const { data: comparison, isLoading: isComparing } = useQuery<AnalysisComparison>({
    queryKey: ['riskComparison', selectedAnalysis1, selectedAnalysis2],
    queryFn: async () => {
      return await apiService.get<AnalysisComparison>(
        `/risks/compare?analysis1=${selectedAnalysis1}&analysis2=${selectedAnalysis2}`
      );
    },
    enabled: showComparison && !!selectedAnalysis1 && !!selectedAnalysis2,
  });

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

  // Get severity color
  const getSeverityColor = (score: number): string => {
    if (score >= 70) return 'text-red-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-green-600';
  };



  // Handle comparison
  const handleCompare = (): void => {
    if (selectedAnalysis1 && selectedAnalysis2) {
      setShowComparison(true);
    }
  };

  // Reset comparison
  const handleResetComparison = (): void => {
    setShowComparison(false);
    setSelectedAnalysis1(null);
    setSelectedAnalysis2(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-600">Loading analysis history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        Error loading analysis history. Please try again.
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-600">No analysis history available for this project.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Risk Analysis History</h2>
        <p className="text-sm text-gray-600">
          View past analyses and compare changes over time
        </p>
      </div>

      {/* Comparison Selector */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Compare Analyses</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Analysis
            </label>
            <select
              value={selectedAnalysis1 || ''}
              onChange={(e) => setSelectedAnalysis1(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select analysis...</option>
              {history.map((analysis) => (
                <option key={analysis.id} value={analysis.id}>
                  {formatDate(analysis.analyzedAt)} - Score: {analysis.overallScore.toFixed(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Second Analysis
            </label>
            <select
              value={selectedAnalysis2 || ''}
              onChange={(e) => setSelectedAnalysis2(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select analysis...</option>
              {history.map((analysis) => (
                <option key={analysis.id} value={analysis.id}>
                  {formatDate(analysis.analyzedAt)} - Score: {analysis.overallScore.toFixed(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleCompare}
              disabled={!selectedAnalysis1 || !selectedAnalysis2}
              className="w-full bg-blue-500 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Compare
            </button>
          </div>
        </div>
      </div>

      {/* Comparison Results */}
      {showComparison && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Comparison Results</h3>
            <button
              onClick={handleResetComparison}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Clear Comparison
            </button>
          </div>

          {isComparing ? (
            <div className="text-center py-8 text-gray-600">Comparing analyses...</div>
          ) : comparison ? (
            <div className="space-y-6">
              {/* Overall Score Change */}
              <div className="border-b pb-4">
                <h4 className="text-md font-semibold text-gray-700 mb-3">Overall Score Change</h4>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-sm text-gray-600">From</div>
                    <div className={`text-2xl font-bold ${getSeverityColor(comparison.analysis1.overallScore)}`}>
                      {comparison.analysis1.overallScore.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(comparison.analysis1.analyzedAt)}
                    </div>
                  </div>
                  <div className="text-2xl text-gray-400">→</div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600">To</div>
                    <div className={`text-2xl font-bold ${getSeverityColor(comparison.analysis2.overallScore)}`}>
                      {comparison.analysis2.overallScore.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(comparison.analysis2.analyzedAt)}
                    </div>
                  </div>
                  <div className="text-center ml-4">
                    <div className="text-sm text-gray-600">Change</div>
                    <div className={`text-2xl font-bold ${
                      comparison.overallScoreChange > 0 ? 'text-red-600' : 
                      comparison.overallScoreChange < 0 ? 'text-green-600' : 
                      'text-gray-600'
                    }`}>
                      {comparison.overallScoreChange > 0 ? '+' : ''}
                      {comparison.overallScoreChange.toFixed(1)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk Count Change */}
              <div className="border-b pb-4">
                <h4 className="text-md font-semibold text-gray-700 mb-3">Risk Count Change</h4>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Previous</div>
                    <div className="text-2xl font-bold text-gray-800">
                      {comparison.analysis1.risks.length}
                    </div>
                  </div>
                  <div className="text-2xl text-gray-400">→</div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Current</div>
                    <div className="text-2xl font-bold text-gray-800">
                      {comparison.analysis2.risks.length}
                    </div>
                  </div>
                  <div className="text-center ml-4">
                    <div className="text-sm text-gray-600">Change</div>
                    <div className={`text-2xl font-bold ${
                      comparison.riskCountChange > 0 ? 'text-red-600' : 
                      comparison.riskCountChange < 0 ? 'text-green-600' : 
                      'text-gray-600'
                    }`}>
                      {comparison.riskCountChange > 0 ? '+' : ''}
                      {comparison.riskCountChange}
                    </div>
                  </div>
                </div>
              </div>

              {/* New Risks */}
              {comparison.newRisks.length > 0 && (
                <div className="border-b pb-4">
                  <h4 className="text-md font-semibold text-gray-700 mb-3">
                    New Risks ({comparison.newRisks.length})
                  </h4>
                  <div className="space-y-2">
                    {comparison.newRisks.map((risk) => (
                      <div key={risk.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                        <span className="text-sm text-gray-800">{risk.title}</span>
                        <span className={`text-sm font-semibold ${getSeverityColor(risk.score)}`}>
                          {risk.score.toFixed(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resolved Risks */}
              {comparison.resolvedRisks.length > 0 && (
                <div className="border-b pb-4">
                  <h4 className="text-md font-semibold text-gray-700 mb-3">
                    Resolved Risks ({comparison.resolvedRisks.length})
                  </h4>
                  <div className="space-y-2">
                    {comparison.resolvedRisks.map((risk) => (
                      <div key={risk.id} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span className="text-sm text-gray-800">{risk.title}</span>
                        <span className={`text-sm font-semibold ${getSeverityColor(risk.score)}`}>
                          {risk.score.toFixed(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Changed Risks */}
              {comparison.changedRisks.length > 0 && (
                <div>
                  <h4 className="text-md font-semibold text-gray-700 mb-3">
                    Changed Risks ({comparison.changedRisks.length})
                  </h4>
                  <div className="space-y-2">
                    {comparison.changedRisks.map((risk) => (
                      <div key={risk.id} className="p-3 bg-yellow-50 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-800">{risk.title}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-semibold ${getSeverityColor(risk.oldScore)}`}>
                              {risk.oldScore.toFixed(1)}
                            </span>
                            <span className="text-sm text-gray-400">→</span>
                            <span className={`text-sm font-semibold ${getSeverityColor(risk.newScore)}`}>
                              {risk.newScore.toFixed(1)}
                            </span>
                            <span className={`text-sm font-semibold ml-2 ${
                              risk.scoreChange > 0 ? 'text-red-600' : 'text-green-600'
                            }`}>
                              ({risk.scoreChange > 0 ? '+' : ''}{risk.scoreChange.toFixed(1)})
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600">
              Failed to load comparison data.
            </div>
          )}
        </div>
      )}

      {/* Analysis History List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Past Analyses ({history.length})
        </h3>
        <div className="space-y-3">
          {history.map((analysis, index) => (
            <div
              key={analysis.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-medium text-gray-600">
                      Analysis #{history.length - index}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatDate(analysis.analyzedAt)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                    <div>
                      <div className="text-xs text-gray-600">Overall Score</div>
                      <div className={`text-lg font-bold ${getSeverityColor(analysis.overallScore)}`}>
                        {analysis.overallScore.toFixed(1)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Total Risks</div>
                      <div className="text-lg font-bold text-gray-800">
                        {analysis.risks.length}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">High Priority</div>
                      <div className="text-lg font-bold text-red-600">
                        {analysis.risks.filter((r) => r.score >= 70).length}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Processing Time</div>
                      <div className="text-lg font-bold text-gray-800">
                        {analysis.metadata.processingTime}ms
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RiskHistory;
