/**
 * Application routes configuration
 * Defines all routes and navigation structure
 */

import { createBrowserRouter, Navigate, useParams } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import ForgotPasswordForm from '../components/auth/ForgotPasswordForm';
import ResetPasswordForm from '../components/auth/ResetPasswordForm';
import ProjectList from '../components/projects/ProjectList';
import ProjectForm from '../components/projects/ProjectForm';
import RiskDashboard from '../components/risks/RiskDashboard';
import RiskHistory from '../components/risks/RiskHistory';
import { ProtectedRoute } from './ProtectedRoute';
import { MainLayout } from './MainLayout';
import { AuthLayout } from './AuthLayout';

// Root landing page
const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 flex items-center space-x-3">
          <span className="text-4xl">🎯</span>
          <h1 className="text-3xl font-bold text-gray-900">Project Risk Analyzer</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-12 px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome to Project Risk Analyzer</h2>
          <p className="text-gray-600 mb-6">
            Proactively identify, assess, and mitigate project risks using artificial intelligence and machine learning.
          </p>
          
          <div className="space-y-4 mb-8">
            <div className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 text-blue-500">✓</div>
              <p className="ml-3 text-gray-700">AI-Powered Risk Analysis</p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 text-blue-500">✓</div>
              <p className="ml-3 text-gray-700">Risk Scoring & Categorization</p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 text-blue-500">✓</div>
              <p className="ml-3 text-gray-700">Mitigation Recommendations</p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 text-blue-500">✓</div>
              <p className="ml-3 text-gray-700">Interactive Dashboard & Reports</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <a
              href="/login"
              className="flex-1 bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline transition-colors text-center"
            >
              Login
            </a>
            <a
              href="/register"
              className="flex-1 bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline transition-colors text-center"
            >
              Register
            </a>
          </div>
        </div>
      </main>
    </div>
  );
};

// Projects page
const ProjectsPage = () => {
  return <ProjectList />;
};

// Create project page
const CreateProjectPage = () => {
  return <ProjectForm />;
};

// Edit project page
const EditProjectPage = () => {
  const { projectId } = useParams();
  return <ProjectForm projectId={projectId} />;
};

// Risk dashboard page
const RiskDashboardPage = () => {
  const { projectId } = useParams();
  if (!projectId) {
    return <Navigate to="/projects" replace />;
  }
  return <RiskDashboard projectId={projectId} />;
};

// Risk history page
const RiskHistoryPage = () => {
  const { projectId } = useParams();
  if (!projectId) {
    return <Navigate to="/projects" replace />;
  }
  return <RiskHistory projectId={projectId} />;
};

// Create router configuration
export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: (
      <AuthLayout>
        <LoginForm />
      </AuthLayout>
    ),
  },
  {
    path: '/register',
    element: (
      <AuthLayout>
        <RegisterForm />
      </AuthLayout>
    ),
  },
  {
    path: '/forgot-password',
    element: (
      <AuthLayout>
        <ForgotPasswordForm />
      </AuthLayout>
    ),
  },
  {
    path: '/reset-password',
    element: (
      <AuthLayout>
        <ResetPasswordForm />
      </AuthLayout>
    ),
  },
  {
    path: '/projects',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <ProjectsPage />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/projects/new',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <CreateProjectPage />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/projects/:projectId/edit',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <EditProjectPage />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/projects/:projectId/dashboard',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <RiskDashboardPage />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/projects/:projectId/history',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <RiskHistoryPage />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export default router;
