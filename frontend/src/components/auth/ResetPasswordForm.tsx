/**
 * ResetPasswordForm Component
 * Handles password reset with token from email
 */

import React, { useState, FormEvent } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { apiService } from '../../services/api';

interface ResetPasswordFormProps {
  onSuccess?: () => void;
}

const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ onSuccess }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Password strength validation
  const validatePassword = (password: string): boolean => {
    // Password must be at least 8 characters and contain:
    // - At least one uppercase letter
    // - At least one lowercase letter
    // - At least one number
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);

    return minLength && hasUpperCase && hasLowerCase && hasNumber;
  };

  // Get password strength message
  const getPasswordStrengthMessage = (password: string): string => {
    if (!password) return '';
    
    const issues: string[] = [];
    if (password.length < 8) issues.push('at least 8 characters');
    if (!/[A-Z]/.test(password)) issues.push('one uppercase letter');
    if (!/[a-z]/.test(password)) issues.push('one lowercase letter');
    if (!/\d/.test(password)) issues.push('one number');

    if (issues.length === 0) return 'Strong password';
    return `Password must contain ${issues.join(', ')}`;
  };

  // Form validation
  const validateForm = (): boolean => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset link.');
      return false;
    }

    if (!password) {
      setError('Password is required');
      return false;
    }

    if (!validatePassword(password)) {
      setError(getPasswordStrengthMessage(password));
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await apiService.post('/api/auth/reset-password', {
        token,
        newPassword: password,
      });
      
      setSuccess('Password reset successful! Redirecting to login...');
      
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          navigate('/login');
        }
      }, 2000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to reset password. The link may have expired.';
      setError(errorMessage);
      setLoading(false);
    }
  };

  // Show error if no token
  if (!token) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white shadow-md rounded-lg px-8 pt-6 pb-8 mb-4">
          <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Reset Password</h2>
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            Invalid or missing reset token. Please request a new password reset link.
          </div>
          <div className="text-center">
            <Link
              to="/forgot-password"
              className="text-sm text-blue-500 hover:text-blue-800"
            >
              Request New Reset Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white shadow-md rounded-lg px-8 pt-6 pb-8 mb-4">
        <h2 className="text-2xl font-bold text-center mb-2 text-gray-800">Reset Password</h2>
        <p className="text-center text-gray-600 text-sm mb-6">
          Enter your new password below.
        </p>
        
        <form onSubmit={handleSubmit}>
          {/* Password Field */}
          <div className="mb-4">
            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
              New Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your new password"
              disabled={loading}
            />
            {password && (
              <p className={`text-xs mt-1 ${validatePassword(password) ? 'text-green-600' : 'text-gray-600'}`}>
                {getPasswordStrengthMessage(password)}
              </p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-bold mb-2">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Confirm your new password"
              disabled={loading}
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs mt-1 text-red-600">Passwords do not match</p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {success}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed w-full"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>

          {/* Link to Login */}
          <div className="text-center">
            <Link
              to="/login"
              className="text-sm text-blue-500 hover:text-blue-800"
            >
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordForm;
