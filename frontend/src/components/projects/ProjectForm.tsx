/**
 * ProjectForm Component
 * Form for creating and editing projects with validation
 */

import React, { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../services/api';

// Types
interface TeamMember {
  role: string;
  count: number;
  experienceLevel: 'Junior' | 'Mid' | 'Senior';
}

interface Technology {
  name: string;
  category: 'Frontend' | 'Backend' | 'Database' | 'DevOps' | 'Other';
  maturity: 'Stable' | 'Emerging' | 'Experimental';
}

interface ProjectFormData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  budget: string;
  teamSize: string;
  teamComposition: TeamMember[];
  technologyStack: Technology[];
  scope: string;
}

interface ValidationErrors {
  [key: string]: string;
}

interface ProjectFormProps {
  projectId?: string;
  onSuccess?: () => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ projectId, onSuccess }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = !!projectId;

  // Form state
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    budget: '',
    teamSize: '',
    teamComposition: [],
    technologyStack: [],
    scope: '',
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(false);

  // Team member form state
  const [newTeamMember, setNewTeamMember] = useState<TeamMember>({
    role: '',
    count: 1,
    experienceLevel: 'Mid',
  });

  // Technology form state
  const [newTechnology, setNewTechnology] = useState<Technology>({
    name: '',
    category: 'Frontend',
    maturity: 'Stable',
  });

  // Fetch existing project if in edit mode
  const { data: existingProjectResponse } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      return await apiService.get<{ message: string; project: any }>(`/projects/${projectId}`);
    },
    enabled: isEditMode,
  });

  // Populate form with existing project data
  useEffect(() => {
    if (existingProjectResponse?.project) {
      const project = existingProjectResponse.project;
      setFormData({
        name: project.name || '',
        description: project.description || '',
        startDate: project.startDate ? project.startDate.split('T')[0] : '',
        endDate: project.endDate ? project.endDate.split('T')[0] : '',
        budget: project.budget?.toString() || '',
        teamSize: project.teamSize?.toString() || '',
        teamComposition: project.teamComposition || [],
        technologyStack: project.technologyStack || [],
        scope: project.scope || '',
      });
    }
  }, [existingProjectResponse]);

  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      const payload = {
        ...data,
        budget: parseFloat(data.budget),
        teamSize: parseInt(data.teamSize, 10),
      };

      if (isEditMode) {
        return await apiService.put(`/projects/${projectId}`, payload);
      } else {
        return await apiService.post('/projects', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/projects');
      }
    },
  });

  // Validate dates
  const validateDates = (): boolean => {
    if (!formData.startDate || !formData.endDate) {
      return true; // Will be caught by required field validation
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);

    if (end <= start) {
      setErrors((prev) => ({
        ...prev,
        endDate: 'End date must be after start date',
      }));
      return false;
    }

    return true;
  };

  // Validate budget
  const validateBudget = (): boolean => {
    const budget = parseFloat(formData.budget);
    if (isNaN(budget) || budget <= 0) {
      setErrors((prev) => ({
        ...prev,
        budget: 'Budget must be a positive number',
      }));
      return false;
    }
    return true;
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (!formData.budget) {
      newErrors.budget = 'Budget is required';
    }

    if (!formData.teamSize) {
      newErrors.teamSize = 'Team size is required';
    } else {
      const teamSize = parseInt(formData.teamSize, 10);
      if (isNaN(teamSize) || teamSize <= 0) {
        newErrors.teamSize = 'Team size must be a positive number';
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return false;
    }

    return validateDates() && validateBudget();
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await mutation.mutateAsync(formData);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to save project';
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  // Handle input change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Add team member
  const handleAddTeamMember = (): void => {
    if (!newTeamMember.role.trim()) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      teamComposition: [...prev.teamComposition, { ...newTeamMember }],
    }));

    setNewTeamMember({
      role: '',
      count: 1,
      experienceLevel: 'Mid',
    });
  };

  // Remove team member
  const handleRemoveTeamMember = (index: number): void => {
    setFormData((prev) => ({
      ...prev,
      teamComposition: prev.teamComposition.filter((_, i) => i !== index),
    }));
  };

  // Add technology
  const handleAddTechnology = (): void => {
    if (!newTechnology.name.trim()) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      technologyStack: [...prev.technologyStack, { ...newTechnology }],
    }));

    setNewTechnology({
      name: '',
      category: 'Frontend',
      maturity: 'Stable',
    });
  };

  // Remove technology
  const handleRemoveTechnology = (index: number): void => {
    setFormData((prev) => ({
      ...prev,
      technologyStack: prev.technologyStack.filter((_, i) => i !== index),
    }));
  };

  // Handle cancel
  const handleCancel = (): void => {
    navigate('/projects');
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white shadow-md rounded-lg px-8 pt-6 pb-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          {isEditMode ? 'Edit Project' : 'Create New Project'}
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Basic Information</h3>

            {/* Project Name */}
            <div className="mb-4">
              <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">
                Project Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : ''
                }`}
                placeholder="Enter project name"
                disabled={loading}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Description */}
            <div className="mb-4">
              <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.description ? 'border-red-500' : ''
                }`}
                placeholder="Enter project description"
                disabled={loading}
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            </div>

            {/* Scope */}
            <div className="mb-4">
              <label htmlFor="scope" className="block text-gray-700 text-sm font-bold mb-2">
                Scope
              </label>
              <textarea
                id="scope"
                name="scope"
                value={formData.scope}
                onChange={handleChange}
                rows={3}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter project scope"
                disabled={loading}
              />
            </div>
          </div>

          {/* Timeline and Budget */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Timeline and Budget</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start Date */}
              <div>
                <label htmlFor="startDate" className="block text-gray-700 text-sm font-bold mb-2">
                  Start Date *
                </label>
                <input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleChange}
                  className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.startDate ? 'border-red-500' : ''
                  }`}
                  disabled={loading}
                />
                {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
              </div>

              {/* End Date */}
              <div>
                <label htmlFor="endDate" className="block text-gray-700 text-sm font-bold mb-2">
                  End Date *
                </label>
                <input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleChange}
                  className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.endDate ? 'border-red-500' : ''
                  }`}
                  disabled={loading}
                />
                {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>}
              </div>

              {/* Budget */}
              <div>
                <label htmlFor="budget" className="block text-gray-700 text-sm font-bold mb-2">
                  Budget (USD) *
                </label>
                <input
                  id="budget"
                  name="budget"
                  type="number"
                  step="0.01"
                  value={formData.budget}
                  onChange={handleChange}
                  className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.budget ? 'border-red-500' : ''
                  }`}
                  placeholder="Enter budget"
                  disabled={loading}
                />
                {errors.budget && <p className="text-red-500 text-xs mt-1">{errors.budget}</p>}
              </div>

              {/* Team Size */}
              <div>
                <label htmlFor="teamSize" className="block text-gray-700 text-sm font-bold mb-2">
                  Team Size *
                </label>
                <input
                  id="teamSize"
                  name="teamSize"
                  type="number"
                  value={formData.teamSize}
                  onChange={handleChange}
                  className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.teamSize ? 'border-red-500' : ''
                  }`}
                  placeholder="Enter team size"
                  disabled={loading}
                />
                {errors.teamSize && <p className="text-red-500 text-xs mt-1">{errors.teamSize}</p>}
              </div>
            </div>
          </div>

          {/* Team Composition */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Team Composition</h3>

            {/* Add Team Member Form */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                <div className="md:col-span-2">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Role</label>
                  <input
                    type="text"
                    value={newTeamMember.role}
                    onChange={(e) => setNewTeamMember({ ...newTeamMember, role: e.target.value })}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Developer, Designer"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Count</label>
                  <input
                    type="number"
                    min="1"
                    value={newTeamMember.count}
                    onChange={(e) =>
                      setNewTeamMember({ ...newTeamMember, count: parseInt(e.target.value, 10) || 1 })
                    }
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Experience</label>
                  <select
                    value={newTeamMember.experienceLevel}
                    onChange={(e) =>
                      setNewTeamMember({
                        ...newTeamMember,
                        experienceLevel: e.target.value as 'Junior' | 'Mid' | 'Senior',
                      })
                    }
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  >
                    <option value="Junior">Junior</option>
                    <option value="Mid">Mid</option>
                    <option value="Senior">Senior</option>
                  </select>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddTeamMember}
                className="bg-green-500 hover:bg-green-600 text-white text-sm font-semibold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={loading}
              >
                Add Team Member
              </button>
            </div>

            {/* Team Members List */}
            {formData.teamComposition.length > 0 && (
              <div className="space-y-2">
                {formData.teamComposition.map((member, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-white border border-gray-200 rounded p-3"
                  >
                    <div className="flex-1">
                      <span className="font-semibold text-gray-700">{member.role}</span>
                      <span className="text-gray-500 ml-2">
                        ({member.count} {member.count === 1 ? 'person' : 'people'} - {member.experienceLevel})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveTeamMember(index)}
                      className="text-red-500 hover:text-red-700 font-semibold"
                      disabled={loading}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Technology Stack */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Technology Stack</h3>

            {/* Add Technology Form */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Technology Name</label>
                  <input
                    type="text"
                    value={newTechnology.name}
                    onChange={(e) => setNewTechnology({ ...newTechnology, name: e.target.value })}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., React, Node.js"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Category</label>
                  <select
                    value={newTechnology.category}
                    onChange={(e) =>
                      setNewTechnology({
                        ...newTechnology,
                        category: e.target.value as Technology['category'],
                      })
                    }
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  >
                    <option value="Frontend">Frontend</option>
                    <option value="Backend">Backend</option>
                    <option value="Database">Database</option>
                    <option value="DevOps">DevOps</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Maturity</label>
                  <select
                    value={newTechnology.maturity}
                    onChange={(e) =>
                      setNewTechnology({
                        ...newTechnology,
                        maturity: e.target.value as Technology['maturity'],
                      })
                    }
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  >
                    <option value="Stable">Stable</option>
                    <option value="Emerging">Emerging</option>
                    <option value="Experimental">Experimental</option>
                  </select>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddTechnology}
                className="bg-green-500 hover:bg-green-600 text-white text-sm font-semibold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={loading}
              >
                Add Technology
              </button>
            </div>

            {/* Technologies List */}
            {formData.technologyStack.length > 0 && (
              <div className="space-y-2">
                {formData.technologyStack.map((tech, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-white border border-gray-200 rounded p-3"
                  >
                    <div className="flex-1">
                      <span className="font-semibold text-gray-700">{tech.name}</span>
                      <span className="text-gray-500 ml-2">
                        ({tech.category} - {tech.maturity})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveTechnology(index)}
                      className="text-red-500 hover:text-red-700 font-semibold"
                      disabled={loading}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {errors.submit}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
            >
              {loading ? 'Saving...' : isEditMode ? 'Update Project' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectForm;
