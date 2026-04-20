# Authentication Components

This directory contains all authentication-related components for the AI Project Risk Analyzer frontend.

## Components

### AuthContext (`../../contexts/AuthContext.tsx`)
Global authentication context that provides:
- User state management
- JWT token storage in localStorage
- Automatic token refresh every 14 minutes
- Login, register, and logout methods
- `useAuth()` hook for accessing auth state

### LoginForm
Handles user login with email and password validation.
- Client-side email validation
- Error message display
- Redirects to projects page on success
- Links to register and forgot password pages

### RegisterForm
Handles user registration with comprehensive validation.
- Name, email, password, and confirm password fields
- Password strength validation (8+ chars, uppercase, lowercase, number)
- Real-time password strength feedback
- Success message with auto-redirect
- Link to login page

### ForgotPasswordForm
Initiates password reset flow.
- Email validation
- Sends reset link to user's email
- Success confirmation message
- Link back to login page

### ResetPasswordForm
Completes password reset with token from email.
- Reads reset token from URL query parameters
- Password strength validation
- Confirm password matching
- Success message with redirect to login
- Handles invalid/expired tokens

## Usage

All components are integrated into the routing system and wrapped with the AuthProvider in App.tsx.

### Routes
- `/login` - Login page
- `/register` - Registration page
- `/forgot-password` - Forgot password page
- `/reset-password?token=xxx` - Reset password page (requires token)

### Using the Auth Hook

```typescript
import { useAuth } from '../../contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  // Check if user is logged in
  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }
  
  return <div>Welcome, {user?.name}!</div>;
}
```

## API Integration

All components use the centralized `apiService` from `../../services/api.ts` which:
- Automatically adds JWT tokens to requests
- Handles 401 errors by redirecting to login
- Provides consistent error handling

## Token Management

- Tokens are stored in localStorage with keys:
  - `authToken` - JWT access token
  - `refreshToken` - Refresh token for token renewal
  - `user` - User object (JSON stringified)
- Automatic refresh occurs every 14 minutes (tokens expire in 15 minutes)
- On logout or auth failure, all tokens are cleared

## Validation Rules

### Email
- Must be valid email format (regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)

### Password
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

## Requirements Satisfied

- **Requirement 1.1**: User registration with email validation
- **Requirement 1.2**: User login with credential verification
- **Requirement 1.3**: JWT token-based authentication
- **Requirement 1.4**: Automatic token refresh and expiration handling
- **Requirement 1.5**: Password reset flow with secure tokens
