/**
 * Unit tests for ForgotPasswordForm component
 * Tests form validation, API integration, and error handling
 * Requirements: 1.5
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ForgotPasswordForm from './ForgotPasswordForm';
import { apiService } from '../../services/api';

// Mock the API service
jest.mock('../../services/api', () => ({
  apiService: {
    post: jest.fn(),
  },
}));

const mockApiPost = apiService.post as jest.MockedFunction<typeof apiService.post>;

describe('ForgotPasswordForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  const renderForgotPasswordForm = (props = {}) => {
    return render(
      <BrowserRouter>
        <ForgotPasswordForm {...props} />
      </BrowserRouter>
    );
  };

  describe('Form Rendering', () => {
    it('should render email field and submit button', () => {
      renderForgotPasswordForm();
      
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
    });

    it('should render description text', () => {
      renderForgotPasswordForm();
      
      expect(screen.getByText(/enter your email address/i)).toBeInTheDocument();
    });

    it('should render link back to login', () => {
      renderForgotPasswordForm();
      
      expect(screen.getByRole('link', { name: /back to login/i })).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show error when email is empty', async () => {
      renderForgotPasswordForm();
      
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
      
      expect(mockApiPost).not.toHaveBeenCalled();
    });

    it('should accept valid email format', async () => {
      mockApiPost.mockResolvedValueOnce({});
      renderForgotPasswordForm();
      
      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockApiPost).toHaveBeenCalledWith('/api/auth/forgot-password', {
          email: 'test@example.com',
        });
      });
    });
  });

  describe('API Integration', () => {
    it('should call API with correct email on submit', async () => {
      mockApiPost.mockResolvedValueOnce({});
      renderForgotPasswordForm();
      
      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockApiPost).toHaveBeenCalledWith('/api/auth/forgot-password', {
          email: 'user@example.com',
        });
      });
    });

    it('should show success message after successful submission', async () => {
      mockApiPost.mockResolvedValueOnce({});
      renderForgotPasswordForm();
      
      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password reset link has been sent/i)).toBeInTheDocument();
      });
    });

    it('should clear email field after successful submission', async () => {
      mockApiPost.mockResolvedValueOnce({});
      renderForgotPasswordForm();
      
      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(emailInput.value).toBe('');
      });
    });

    it('should call onSuccess callback after delay', async () => {
      mockApiPost.mockResolvedValueOnce({});
      const onSuccess = jest.fn();
      renderForgotPasswordForm({ onSuccess });
      
      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password reset link has been sent/i)).toBeInTheDocument();
      });

      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    it('should show loading state during submission', async () => {
      mockApiPost.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      renderForgotPasswordForm();
      
      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      expect(screen.getByText(/sending/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('should disable email input during submission', async () => {
      mockApiPost.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      renderForgotPasswordForm();
      
      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      expect(emailInput).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should display error message on API failure', async () => {
      const errorMessage = 'Email not found';
      mockApiPost.mockRejectedValueOnce({
        response: { data: { message: errorMessage } },
      });
      
      renderForgotPasswordForm();
      
      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      fireEvent.change(emailInput, { target: { value: 'notfound@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should display generic error message when API error has no message', async () => {
      mockApiPost.mockRejectedValueOnce(new Error('Network error'));
      
      renderForgotPasswordForm();
      
      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to send reset link/i)).toBeInTheDocument();
      });
    });

    it('should clear error message on new submission', async () => {
      mockApiPost.mockRejectedValueOnce({
        response: { data: { message: 'Email not found' } },
      });
      
      renderForgotPasswordForm();
      
      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      // First submission with error
      fireEvent.change(emailInput, { target: { value: 'notfound@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email not found/i)).toBeInTheDocument();
      });

      // Second submission should clear error
      mockApiPost.mockResolvedValueOnce({});
      fireEvent.change(emailInput, { target: { value: 'found@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText(/email not found/i)).not.toBeInTheDocument();
      });
    });

    it('should re-enable form after error', async () => {
      mockApiPost.mockRejectedValueOnce({
        response: { data: { message: 'Email not found' } },
      });
      
      renderForgotPasswordForm();
      
      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /send reset link/i }) as HTMLButtonElement;

      fireEvent.change(emailInput, { target: { value: 'notfound@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email not found/i)).toBeInTheDocument();
      });

      expect(emailInput).not.toBeDisabled();
      expect(submitButton).not.toBeDisabled();
    });
  });
});
