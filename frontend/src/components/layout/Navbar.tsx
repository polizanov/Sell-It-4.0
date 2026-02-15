import { Link, useLocation, useNavigate } from 'react-router';
import { useAuthStore } from '../../store/authStore';
import { Logo } from '../common/Logo';
import { Button } from '../common/Button';

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();

  const isActive = (path: string) => location.pathname === path;

  const linkStyles = (path: string) =>
    `px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
      isActive(path)
        ? 'text-orange bg-orange/10 border-b-2 border-orange'
        : 'text-text-secondary hover:text-text-primary hover:bg-dark-elevated'
    }`;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-dark-surface/95 backdrop-blur-sm border-b border-dark-border">
      <div className="max-w-7xl mx-auto w-full px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Logo size="md" />

        {/* Navigation Links */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              {user?.isVerified !== false && (
                <Link to="/create-product" className={linkStyles('/create-product')}>
                  Create Product
                </Link>
              )}
              <Link to="/profile" className={linkStyles('/profile')}>
                My Profile
              </Link>
              {user?.isVerified !== false && (
                <Link to="/favourites" className={linkStyles('/favourites')}>
                  My Favourites
                </Link>
              )}
              <Button
                variant="danger"
                size="sm"
                onClick={handleLogout}
                className="ml-4"
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className={linkStyles('/login')}>
                Login
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm" className="ml-4">
                  Register
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
