import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card = ({ children, className = '', hover = false }: CardProps) => {
  const hoverStyles = hover
    ? 'hover:shadow-xl hover:shadow-orange/10 hover:-translate-y-1 cursor-pointer'
    : '';

  return (
    <div
      className={`bg-dark-surface border border-dark-border rounded-xl p-6 shadow-lg transition-all duration-300 ${hoverStyles} ${className}`}
    >
      {children}
    </div>
  );
};
