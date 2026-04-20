/**
 * ProjectList Component
 * Displays list of user's projects with search, filter, and delete functionality
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

// Types
export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  budget: number;
  teamSize: number;
  createdAt: string;
  updatedAt: string;
}

interface ProjectListProps {
  userId?: string;
}

const ProjectList: React.FC<ProjectListProps> = ({ userId: propUserId }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = propUserId || user?.id;

  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Fetch projects
  const { data: response, isLoading, error } = useQuery<{ projects: Project[]; count: number }>({
    queryKey: ['projects', userId],
    queryFn: async () => {
      return await apiService.get<{ projects: Project[]; count: number }>('/projects');
    },
    enabled: !!userId,
  });

  const projects = response?.projects || [];

  // Delete project mutation
  const deleteMutation = useMutation({
    mutationFn: async (projectId: string) => {
      await apiService.delete(`/projects/${projectId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', userId] });
      setDeleteConfirmId(null);
    },
  });

  // Filter projects based on search term
  const filteredProjects = projects.filter((project) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      project.name.toLowerCase().includes(searchLower) ||
      project.description.toLowerCase().includes(searchLower)
    );
  });

  // Handle delete click
  const handleDelete = (projectId: string): void => {
    setDeleteConfirmId(projectId);
  };

  // Confirm delete
  const confirmDelete = async (): Promise<void> => {
    if (deleteConfirmId) {
      await deleteMutation.mutateAsync(deleteConfirmId);
    }
  };

  // Cancel delete
  const cancelDelete = (): void => {
    setDeleteConfirmId(null);
  };

  // Handle edit navigation
  const handleEdit = (projectId: string): void => {
    navigate(`/projects/${projectId}/edit`);
  };

  // Handle view details navigation
  const handleViewDetails = (projectId: string): void => {
    navigate(`/projects/${projectId}/dashboard`);
  };

  // Handle create new project
  const handleCreateNew = (): void => {
    navigate('/projects/new');
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-600">Loading projects...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        Error loading projects. Please try again.
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header with search and create button */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={handleCreateNew}
          className="w-full sm:w-auto bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg focus:outline-none focus:shadow-outline"
        >
          Create New Project
        </button>
      </div>

      {/* Projects list */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">
            {searchTerm ? 'No projects match your search.' : 'No projects yet.'}
          </p>
          {!searchTerm && (
            <button
              onClick={handleCreateNew}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg"
            >
              Create Your First Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6"
            >
              {/* Project header */}
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{project.name}</h3>
                <p className="text-gray-600 text-sm line-clamp-2">{project.description}</p>
              </div>

              {/* Project details */}
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Budget:</span>
                  <span className="font-semibold text-gray-700">{formatCurrency(project.budget)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Team Size:</span>
                  <span className="font-semibold text-gray-700">{project.teamSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Start Date:</span>
                  <span className="font-semibold text-gray-700">{formatDate(project.startDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">End Date:</span>
                  <span className="font-semibold text-gray-700">{formatDate(project.endDate)}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleViewDetails(project.id)}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  View
                </button>
                <button
                  onClick={() => handleEdit(project.id)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white text-sm font-semibold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(project.id)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this project? This action cannot be undone and will remove all associated risk analyses.
            </p>
            <div className="flex gap-4">
              <button
                onClick={cancelDelete}
                disabled={deleteMutation.isPending}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
            {deleteMutation.isError && (
              <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                Failed to delete project. Please try again.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectList;
