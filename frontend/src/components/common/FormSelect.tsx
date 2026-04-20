/**
 * FormSelect Component
 * Reusable select dropdown with validation feedback
 */

import React, { SelectHTMLAttributes } from 'react';

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  helperText?: string;
  options: Array<{ value: string | number; label: string }>;
}

const FormSelect: React.FC<FormSelectProps> = ({
  label,
  error,
  helperText,
  options,
  id,
  className = '',
  ...props
}) => {
  const selectId = id || `select-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const hasError = !!error;

  return (
    <div className="mb-4">
      <label
        htmlFor={selectId}
        className="block text-gray-700 text-sm font-bold mb-2"
      >
        {label}
        {props.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        id={selectId}
        className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 transition-colors ${
          hasError
            ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
            : 'focus:ring-blue-500 focus:border-blue-500'
        } ${props.disabled ? 'bg-gray-100 cursor-not-allowed' : ''} ${className}`}
        aria-invalid={hasError}
        aria-describedby={
          hasError ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined
        }
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hasError && (
        <p
          id={`${selectId}-error`}
          className="text-red-500 text-xs mt-1 flex items-center"
          role="alert"
        >
          <svg
            className="w-4 h-4 mr-1 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
      {!hasError && helperText && (
        <p id={`${selectId}-helper`} className="text-gray-500 text-xs mt-1">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default FormSelect;
