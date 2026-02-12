import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  fullWidth?: boolean;
  gradient?: boolean;
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  children,
  fullWidth = false,
  gradient = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) => {
  const baseStyles = 'font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-bg disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles = {
    primary: gradient
      ? 'bg-gradient-cta hover:bg-gradient-cta-hover text-white focus:ring-orange shadow-lg shadow-orange/30'
      : 'bg-orange text-white hover:bg-orange-hover active:bg-orange-dark focus:ring-orange shadow-lg shadow-orange/20',
    secondary: 'bg-transparent border-2 border-dark-border text-text-primary hover:bg-dark-elevated hover:border-text-muted active:bg-dark-surface focus:ring-text-muted',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus:ring-red-500 shadow-lg shadow-red-600/20',
  };

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
