import { Link } from 'react-router';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  linkToHome?: boolean;
}

export const Logo = ({ size = 'md', linkToHome = true }: LogoProps) => {
  const sizeStyles = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  const logoContent = (
    <span className={`font-bold ${sizeStyles[size]}`}>
      <span className="text-white">Sell</span>
      <span className="text-orange">-It</span>
    </span>
  );

  if (linkToHome) {
    return (
      <Link to="/" className="hover:opacity-80 transition-opacity duration-200">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
};
