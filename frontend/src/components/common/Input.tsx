import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  variant?: 'dark' | 'light';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, variant = 'dark', className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    const labelClasses = variant === 'light'
      ? 'block text-sm font-medium text-gray-700 mb-2'
      : 'block text-sm font-medium text-text-secondary mb-2';

    const inputClasses = variant === 'light'
      ? `w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent transition-all duration-200 ${
          error ? 'border-red-500 focus:ring-red-500' : ''
        }`
      : `w-full px-4 py-3 bg-dark-elevated border border-dark-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent transition-all duration-200 ${
          error ? 'border-red-500 focus:ring-red-500' : ''
        }`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className={labelClasses}
          >
            {label}
            {props.required && <span className="text-orange ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`${inputClasses} ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
