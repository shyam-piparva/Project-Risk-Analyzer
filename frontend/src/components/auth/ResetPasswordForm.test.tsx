/**
 * Unit tests for ResetPasswordForm component
 * Tests form validation, API integration, and error handling
 * Requirements: 1.5
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ResetPasswordForm from './ResetPasswordForm';
import { apiService } from '../../services/api';

// Mock the API service
jest.mock('../../services/api', () => ({
  apiService: {
    post: jest.fn(),
  },
}));

const mockApiPost = apiService.post as jest.MockedFunction<typeof apiService.post>;
const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  const renderResetPasswordForm = (token = 'valid-token', props = {}) => {
    return render(
      <MemoryRouter initialEntries={[`/reset-password?token=${token}`]}>
        <ResetPasswordForm {...props} />
      </MemoryRouter>
    );
  };

  describe('Form Rendering', () => {
    it('should render password fields when token is present', () => {
      renderResetPasswordForm();
      
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
    });

    it('should render description text', () => {
      renderResetPasswordForm();
      
      expect(screen.getByText(/enter your new password below/i)).toBeInTheDocument();
    });

    it('should render link back to login', () => {
      renderResetPasswordForm();
      
      expect(screen.getByRole('link', { name: /back to login/i })).toBeInTheDocument();
    });

    it('should show error message when token is missing', () => {
      renderResetPasswordForm('');
      
      expect(screen.getByText(/invalid or missing reset token/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/new password/i)).not.toBeInTheDocument();
    });

    it('should render link to request new reset when token is missing', () => {
      renderResetPasswordForm('');
      
      expect(screen.getByRole('link', { name: /request new reset link/i })).toBeInTheDocument();
    });
  });

  describe('Form Validation - Password Requirements', () => {
    it('should show error when password is empty', async () => {
      renderResetPasswordForm();
      
      const submitButton = screen.getByRole('button', { name: /reset password/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
      
      expect(mockApiPost).not.toHaveBeenCalled();
    });

    it('should reject password shorter than 8 characters', async () => {
      renderResetPasswordForm();
      
      const passwordInput = screen.getByLabelText(/^new password$/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      fireEvent.change(passwordInput, { target: { value: 'Pass1' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
      });
      
      expect(mockApiPost).not.toHaveBeenCalled();
    });

    it('should reject password without uppercase letter', async () => {
      renderResetPasswordForm();
      
      const passwordInput = screen.getByLabelText(/^new password$/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/one uppercase letter/i)).toBeInTheDocument();
      });
      
      expect(mockApiPost).not.toHaveBeenCalled();
    });

    it('should reject password without lowercase letter', async () => {
      renderResetPasswordForm();
      
      const passwordInput = screen.getByLabelText(/^new password$/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      fireEvent.change(passwordInput, { target: { value: 'PASSWORD123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/one lowercase letter/i)).toBeInTheDocument();
      });
      
      expect(mockApiPost).not.toHaveBeenCalled();
    });

    it('should reject password without number', async () => {
      renderResetPasswordForm();
      
      const passwordInput = screen.getByLabelText(/^new password$/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      fireEvent.change(passwordInput, { target: { value: 'PasswordOnly' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/one number/i)).toBeInTheDocument();
      });
      
      expect(mockApiPost).not.toHaveBeenCalled();
    });

    it('should show password strength indicator', () => {
      renderResetPasswordForm();
      
      const passwordInput = screen.getByLabelText(/^new password$/i);

      fireEvent.change(passwordInput, { target: { value: 'weak' } });
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();

      fireEvent.change(passwordInput, { target: { value: 'Password123' } });
      expect(screen.getByText(/strong password/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation - Password Confirmation', () => {
    it('should show error when passwords do not match', async () => {
      renderResetPasswordForm();
      
      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      fireEvent.change(passwordInput, { target: { value: 'Password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPassword123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
      
      expect(mockApiPost).not.toHaveBeenCalled();
    });

    it('should show inline error when confirm password does not match', () => {
      renderResetPasswordForm();
      
      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

      fireEvent.change(passwordInput, { target: { value: 'Password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'Different' } });

      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  describe('API Integration', () => {
    it('should call API with token and new password on submit', async () => {
      mockApiPost.mockResolvedValueOnce({});
      renderResetPasswordForm('test-token-123');
      
      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      fireEvent.change(passwordInput, { target: { value: 'NewPassword123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'NewPassword123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockApiPost).toHaveBeenCalledWith('/api/auth/reset-password', {
          token: 'test-token-123',
          newPassword: 'NewPassword123',
        });
      });
    });

    it('should show success message after successful reset', async () => {
      mockApiPost.mockResolvedValueOnce({});
      renderResetPasswordForm();
      
      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      fireEvent.change(passwordInput, { target: { value: 'NewPassword123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'NewPassword123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password reset successful/i)).toBeInTheDocument();
      });
    });

    it('should navigate to login after successful reset', async () => {
      mockApiPost.mockResolvedValueOnce({});
      renderResetPasswordForm();
      
      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      fireEvent.change(passwordInput, { target: { value: 'NewPassword123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'NewPassword123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password reset successful/i)).toBeInTheDocument();
      });

      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    it('should call onSuccess callback when provided', async () => {
      mockApiPost.mockResolvedValueOnce({});
      const onSuccess = jest.fn();
      renderResetPasswordForm('test-token', { onSuccess });
      
      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      fireEvent.change(passwordInput, { target: { value: 'NewPassword123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'NewPassword123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password reset successful/i)).toBeInTheDocument();
      });

      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
      
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should show loading state during reset', async () => {
      mockApiPost.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      renderResetPasswordForm();
      
      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      fireEvent.change(passwordInput, { target: { value: 'NewPassword123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'NewPassword123' } });
      fireEvent.click(submitButton);

      expect(screen.getByText(/resetting/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('should disable form inputs during reset', async () => {
      mockApiPost.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      renderResetPasswordForm();
      
      const passwordInput = screen.getByLabelText(/^new password$/i) as HTMLInputElement;
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i) as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      fireEvent.change(passwordInput, { target: { value: 'NewPassword123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'NewPassword123' } });
      fireEvent.click(submitButton);

      expect(passwordInput).toBeDisabled();
      expect(confirmPasswordInput).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should display error message on API failure', async () => {
      const errorMessage = 'Reset token has expired';
      mockApiPost.mockRejectedValueOnce({
        response: { data: { message: errorMessage } },
      });
      
      renderResetPasswordForm();
      
      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      fireEvent.change(passwordInput, { target: { value: 'NewPassword123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'NewPassword123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should display generic error message when API error has no message', async () => {
      mockApiPost.mockRejectedValueOnce(new Error('Network error'));
      
      renderResetPasswordForm();
      
      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      fireEvent.change(passwordInput, { target: { value: 'NewPassword123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'NewPassword123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to reset password/i)).toBeInTheDocument();
      });
    });

    it('should clear error message on new submission', async () => {
      mockApiPost.mockRejectedValueOnce({
        response: { data: { message: 'Reset token has expired' } },
      });
      
      renderResetPasswordForm();
      
      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      // First submission with error
      fireEvent.change(passwordInput, { target: { value: 'NewPassword123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'NewPassword123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/reset token has expired/i)).toBeInTheDocument();
      });

      // Second submission should clear error
      mockApiPost.mockResolvedValueOnce({});
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText(/reset token has expired/i)).not.toBeInTheDocument();
      });
    });

    it('should re-enable form after error', async () => {
      mockApiPost.mockRejectedValueOnce({
        response: { data: { message: 'Reset token has expired' } },
      });
      
      renderResetPasswordForm();
      
      const passwordInput = screen.getByLabelText(/^new password$/i) as HTMLInputElement;
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i) as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /reset password/i }) as HTMLButtonElement;

      fireEvent.change(passwordInput, { target: { value: 'NewPassword123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'NewPassword123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/reset token has expired/i)).toBeInTheDocument();
      });

      expect(passwordInput).not.toBeDisabled();
      expect(confirmPasswordInput).not.toBeDisabled();
      expect(submitButton).not.toBeDisabled();
    });
  });
});
