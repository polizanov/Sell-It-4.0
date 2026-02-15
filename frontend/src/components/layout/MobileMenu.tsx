import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useAuthStore } from '../../store/authStore';
import { Logo } from '../common/Logo';
import { Button } from '../common/Button';

export const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const isActive = (path: string) => location.pathname === path;

  const linkStyles = (path: string) =>
    `block px-6 py-4 text-lg font-medium rounded-lg transition-all duration-200 ${
      isActive(path)
        ? 'text-orange bg-orange/10 border-l-4 border-orange'
        : 'text-text-secondary hover:text-text-primary hover:bg-dark-elevated'
    }`;

  const handleLogout = () => {
    logout();
    closeMenu();
    navigate('/');
  };

  return (
    <div className="md:hidden">
      {/* Top Bar with Logo and Burger */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-dark-surface/95 backdrop-blur-sm border-b border-dark-border">
        <div className="px-4 py-4 flex items-center justify-between">
          <Logo size="sm" />

          {/* Hamburger Button */}
          <button
            onClick={toggleMenu}
            className="p-2 text-text-primary hover:text-orange focus:outline-none focus:ring-2 focus:ring-orange rounded-lg transition-colors"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isOpen}
          >
            <div className="w-6 h-5 flex flex-col justify-between">
              <span
                className={`w-full h-0.5 bg-current transform transition-all duration-300 ${
                  isOpen ? 'rotate-45 translate-y-2' : ''
                }`}
              />
              <span
                className={`w-full h-0.5 bg-current transition-all duration-300 ${
                  isOpen ? 'opacity-0' : 'opacity-100'
                }`}
              />
              <span
                className={`w-full h-0.5 bg-current transform transition-all duration-300 ${
                  isOpen ? '-rotate-45 -translate-y-2' : ''
                }`}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      {/* Slide-in Menu Panel */}
      <div
        className={`fixed top-0 left-0 bottom-0 w-4/5 max-w-sm bg-dark-surface border-r border-dark-border z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Menu Header */}
          <div className="px-6 py-6 border-b border-dark-border">
            <Logo size="md" linkToHome={false} />
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto py-6">
            {isAuthenticated ? (
              <>
                <Link to="/profile" className={linkStyles('/profile')} onClick={closeMenu}>
                  My Profile
                </Link>
                {user?.isVerified !== false && (
                  <Link to="/favourites" className={linkStyles('/favourites')} onClick={closeMenu}>
                    My Favourites
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link to="/login" className={linkStyles('/login')} onClick={closeMenu}>
                  Login
                </Link>
                <Link to="/register" className={linkStyles('/register')} onClick={closeMenu}>
                  Register
                </Link>
              </>
            )}
          </nav>

          {/* Logout Button (if authenticated) */}
          {isAuthenticated && (
            <div className="p-6 border-t border-dark-border">
              <Button
                variant="danger"
                size="md"
                fullWidth
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
