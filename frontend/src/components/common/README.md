# Common Components

This directory contains reusable UI components for error handling, user feedback, and form validation.

## Error Handling

### ErrorBoundary

A React error boundary that catches JavaScript errors anywhere in the component tree and displays a fallback UI.

**Usage:**
```tsx
import { ErrorBoundary } from './components/common';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

**Features:**
- Catches and logs React errors
- Displays user-friendly error messages
- Shows detailed error info in development mode
- Provides "Try Again" and "Refresh Page" buttons
- Reports errors to monitoring service (configurable)

## Notification System

### Toast Notifications

Display temporary notification messages for success, error, info, and warning states.

**Usage:**
```tsx
import { useToast } from '../../contexts/ToastContext';

function MyComponent() {
  const { showSuccess, showError, showInfo, showWarning } = useToast();

  const handleSuccess = () => {
    showSuccess('Operation completed successfully!');
  };

  const handleError = () => {
    showError('Something went wrong!', 7000); // Custom duration
  };

  return (
    <button onClick={handleSuccess}>Show Success</button>
  );
}
```

**Available Methods:**
- `showSuccess(message, duration?)` - Green success toast
- `showError(message, duration?)` - Red error toast
- `showInfo(message, duration?)` - Blue info toast
- `showWarning(message, duration?)` - Yellow warning toast
- `showToast(type, message, duration?)` - Generic toast with custom type

**Default Duration:** 5000ms (5 seconds)

### LoadingSpinner

Display loading indicators with optional messages.

**Usage:**
```tsx
import { LoadingSpinner } from './components/common';

// Small spinner
<LoadingSpinner size="small" />

// Medium spinner with message
<LoadingSpinner size="medium" message="Loading data..." />

// Full-screen loading overlay
<LoadingSpinner size="large" message="Processing..." fullScreen />
```

**Props:**
- `size`: 'small' | 'medium' | 'large' (default: 'medium')
- `message`: Optional loading message
- `fullScreen`: Boolean to show as full-screen overlay

## Form Validation Components

### FormInput

Text input field with built-in validation feedback.

**Usage:**
```tsx
import { FormInput } from './components/common';

<FormInput
  label="Email"
  name="email"
  type="email"
  value={formData.email}
  onChange={handleChange}
  error={errors.email}
  helperText="We'll never share your email"
  placeholder="Enter your email"
  required
/>
```

**Props:**
- `label`: Field label (required)
- `error`: Error message to display
- `helperText`: Helper text shown when no error
- All standard HTML input attributes

**Features:**
- Automatic error styling (red border)
- Error icon and message
- Required field indicator (*)
- Accessible with ARIA attributes
- Auto-clears error on input change

### FormTextarea

Textarea field with validation feedback.

**Usage:**
```tsx
import { FormTextarea } from './components/common';

<FormTextarea
  label="Description"
  name="description"
  value={formData.description}
  onChange={handleChange}
  error={errors.description}
  rows={4}
  placeholder="Enter description"
  required
/>
```

**Props:**
- Same as FormInput
- All standard HTML textarea attributes

### FormSelect

Select dropdown with validation feedback.

**Usage:**
```tsx
import { FormSelect } from './components/common';

const options = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
];

<FormSelect
  label="Category"
  name="category"
  value={formData.category}
  onChange={handleChange}
  options={options}
  error={errors.category}
  required
/>
```

**Props:**
- `options`: Array of { value, label } objects (required)
- Same as FormInput for other props

## Complete Form Example

See `FormValidationExample.tsx` for a complete working example demonstrating:
- Form state management
- Validation logic
- Error handling
- Toast notifications
- Loading states
- Accessible form fields

## Best Practices

### Error Handling
1. Always wrap your app root with ErrorBoundary
2. Use toast notifications for user feedback
3. Show loading indicators for async operations

### Form Validation
1. Validate on submit, not on every keystroke
2. Clear errors when user starts typing
3. Show specific, actionable error messages
4. Use helper text for guidance
5. Mark required fields clearly

### Accessibility
- All form components include proper ARIA attributes
- Error messages are announced to screen readers
- Focus management is handled automatically
- Color is not the only indicator of errors (icons included)

## Styling

All components use Tailwind CSS classes and follow the application's design system:
- Primary color: Blue (blue-500, blue-600, blue-700)
- Error color: Red (red-500, red-600)
- Success color: Green (green-500, green-600)
- Warning color: Yellow (yellow-500, yellow-600)
- Info color: Blue (blue-500, blue-600)

## Integration with Existing Forms

To integrate these components into existing forms:

1. Replace standard `<input>` with `<FormInput>`
2. Replace standard `<textarea>` with `<FormTextarea>`
3. Replace standard `<select>` with `<FormSelect>`
4. Use `useToast()` hook for success/error messages
5. Replace inline error divs with the `error` prop

Example migration:
```tsx
// Before
<input
  type="text"
  value={name}
  onChange={handleChange}
  className={errors.name ? 'border-red-500' : ''}
/>
{errors.name && <p className="text-red-500">{errors.name}</p>}

// After
<FormInput
  label="Name"
  name="name"
  value={name}
  onChange={handleChange}
  error={errors.name}
/>
```
