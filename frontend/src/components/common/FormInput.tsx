/**
 * FormInput Component
 * Reusable input field with validation feedback
 */

import React, { InputHTMLAttributes } from 'react';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

const FormInput: React.FC<FormInputProps> = ({
  label,
  error,
  helperText,
  id,
  className = '',
  ...props
}) => {
  const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const hasError = !!error;

  return (
    <div className="mb-4">
      <label
        htmlFor={inputId}
        className="block text-gray-700 text-sm font-bold mb-2"
      >
        {label}
        {props.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        id={inputId}
        className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 transition-colors ${
          hasError
            ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
            : 'focus:ring-blue-500 focus:border-blue-500'
        } ${props.disabled ? 'bg-gray-100 cursor-not-allowed' : ''} ${className}`}
        aria-invalid={hasError}
        aria-describedby={
          hasError ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
        }
        {...props}
      />
      {hasError && (
        <p
          id={`${inputId}-error`}
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
        <p id={`${inputId}-helper`} className="text-gray-500 text-xs mt-1">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default FormInput;
