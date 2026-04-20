/**
 * RiskCard Component
 * Display individual risk details with mitigation strategies and actions
 * Requirements: 4.1, 4.3, 5.2, 5.3, 5.4
 */

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../services/api';
import { Risk, Mitigation } from './RiskDashboard';

interface RiskCardProps {
  risk: Risk;
  onMitigationUpdate?: (riskId: string, mitigation: Mitigation) => void;
}

const RiskCard: React.FC<RiskCardProps> = ({ risk, onMitigationUpdate }) => {
  const queryClient = useQueryClient();
  const [showAddMitigation, setShowAddMitigation] = useState(false);
  const [newMitigationStrategy, setNewMitigationStrategy] = useState('');
  const [newMitigationPriority, setNewMitigationPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [newMitigationEffort, setNewMitigationEffort] = useState('');

  // Mark mitigation as implemented mutation
  const implementMutation = useMutation({
    mutationFn: async (mitigationId: string) => {
      return await apiService.put<Mitigation>(`/mitigations/${mitigationId}/implement`);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['riskAnalysis'] });
      if (onMitigationUpdate) {
        onMitigationUpdate(risk.id, data);
      }
    },
  });

  // Add custom mitigation mutation
  const addMitigationMutation = useMutation({
    mutationFn: async (mitigationData: { strategy: string; priority: string; estimatedEffort: string }) => {
      return await apiService.post<Mitigation>(`/risks/${risk.id}/mitigations`, mitigationData);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['riskAnalysis'] });
      setShowAddMitigation(false);
      setNewMitigationStrategy('');
      setNewMitigationPriority('Medium');
      setNewMitigationEffort('');
      if (onMitigationUpdate) {
        onMitigationUpdate(risk.id, data);
      }
    },
  });

  // Get severity color
  const getSeverityColor = (score: number): string => {
    if (score >= 70) return 'text-red-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-green-600';
  };

  // Get severity background color
  const getSeverityBgColor = (score: number): string => {
    if (score >= 70) return 'bg-red-100';
    if (score >= 40) return 'bg-yellow-100';
    return 'bg-green-100';
  };

  // Get severity border color
  const getSeverityBorderColor = (score: number): string => {
    if (score >= 70) return 'border-red-500';
    if (score >= 40) return 'border-yellow-500';
    return 'border-green-500';
  };

  // Get priority color
  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle mark mitigation as implemented
  const handleMarkImplemented = async (mitigationId: string): Promise<void> => {
    await implementMutation.mutateAsync(mitigationId);
  };

  // Handle add custom mitigation
  const handleAddMitigation = async (): Promise<void> => {
    if (!newMitigationStrategy.trim()) {
      return;
    }

    await addMitigationMutation.mutateAsync({
      strategy: newMitigationStrategy,
      priority: newMitigationPriority,
      estimatedEffort: newMitigationEffort,
    });
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${getSeverityBorderColor(risk.score)}`}>
      {/* Risk Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-800 mb-2">{risk.title}</h3>
          <p className="text-gray-600">{risk.description}</p>
        </div>
        <div className={`ml-4 px-4 py-2 rounded-full text-lg font-bold ${getSeverityBgColor(risk.score)} ${getSeverityColor(risk.score)}`}>
          {risk.score.toFixed(1)}
        </div>
      </div>

      {/* Risk Details */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
        <div>
          <div className="text-gray-500">Category</div>
          <div className="font-semibold text-gray-800">{risk.category}</div>
        </div>
        <div>
          <div className="text-gray-500">Status</div>
          <div className="font-semibold text-gray-800">{risk.status}</div>
        </div>
        <div>
          <div className="text-gray-500">Probability</div>
          <div className="font-semibold text-gray-800">{(risk.probability * 100).toFixed(0)}%</div>
        </div>
        <div>
          <div className="text-gray-500">Impact</div>
          <div className="font-semibold text-gray-800">{(risk.impact * 100).toFixed(0)}%</div>
        </div>
      </div>

      {/* Mitigation Strategies */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-lg font-semibold text-gray-800">Mitigation Strategies</h4>
          <button
            onClick={() => setShowAddMitigation(!showAddMitigation)}
            className="text-blue-500 hover:text-blue-700 text-sm font-semibold"
          >
            {showAddMitigation ? 'Cancel' : '+ Add Custom'}
          </button>
        </div>

        {/* Add Custom Mitigation Form */}
        {showAddMitigation && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Strategy Description
                </label>
                <textarea
                  value={newMitigationStrategy}
                  onChange={(e) => setNewMitigationStrategy(e.target.value)}
                  placeholder="Describe the mitigation strategy..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={newMitigationPriority}
                    onChange={(e) => setNewMitigationPriority(e.target.value as 'High' | 'Medium' | 'Low')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Effort
                  </label>
                  <input
                    type="text"
                    value={newMitigationEffort}
                    onChange={(e) => setNewMitigationEffort(e.target.value)}
                    placeholder="e.g., 2 days"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowAddMitigation(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMitigation}
                  disabled={!newMitigationStrategy.trim() || addMitigationMutation.isPending}
                  className="px-4 py-2 text-white bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold disabled:opacity-50"
                >
                  {addMitigationMutation.isPending ? 'Adding...' : 'Add Mitigation'}
                </button>
              </div>
            </div>
            {addMitigationMutation.isError && (
              <div className="mt-2 text-sm text-red-600">
                Failed to add mitigation. Please try again.
              </div>
            )}
          </div>
        )}

        {/* Mitigation List */}
        {risk.mitigations.length === 0 ? (
          <div className="text-gray-500 text-sm">No mitigation strategies available.</div>
        ) : (
          <div className="space-y-3">
            {risk.mitigations.map((mitigation) => (
              <div
                key={mitigation.id}
                className={`p-4 rounded-lg border ${
                  mitigation.isImplemented
                    ? 'bg-green-50 border-green-200'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <p className={`text-gray-800 ${mitigation.isImplemented ? 'line-through' : ''}`}>
                      {mitigation.strategy}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(mitigation.priority)}`}>
                      {mitigation.priority}
                    </span>
                    {mitigation.isCustom && (
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                        Custom
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <div className="text-gray-600">
                    {mitigation.estimatedEffort && (
                      <span>Effort: {mitigation.estimatedEffort}</span>
                    )}
                  </div>
                  {!mitigation.isImplemented ? (
                    <button
                      onClick={() => handleMarkImplemented(mitigation.id)}
                      disabled={implementMutation.isPending}
                      className="text-blue-500 hover:text-blue-700 font-semibold disabled:opacity-50"
                    >
                      {implementMutation.isPending ? 'Marking...' : 'Mark as Implemented'}
                    </button>
                  ) : (
                    <span className="text-green-600 font-semibold">
                      ✓ Implemented
                      {mitigation.implementedAt && (
                        <span className="text-gray-500 ml-2">
                          {new Date(mitigation.implementedAt).toLocaleDateString()}
                        </span>
                      )}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error Messages */}
      {implementMutation.isError && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          Failed to mark mitigation as implemented. Please try again.
        </div>
      )}
    </div>
  );
};

export default RiskCard;
