import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { VerifiedRoute } from '../../src/components/auth/VerifiedRoute';
import { useAuthStore } from '../../src/store/authStore';

const renderRoute = (initialEntries = ['/protected'], requirePhone = false) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route
          path="/protected"
          element={
            <VerifiedRoute requirePhone={requirePhone}>
              <div>Protected Content</div>
            </VerifiedRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
};

describe('VerifiedRoute', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  it('shows loading spinner when auth is loading', () => {
    useAuthStore.setState({ isLoading: true });
    const { container } = renderRoute();
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('redirects to /login when not authenticated', () => {
    renderRoute();
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('shows VerificationRequired when authenticated but not email-verified', () => {
    useAuthStore.setState({
      user: { id: '1', name: 'Test', username: 'test', email: 'test@example.com', isVerified: false, phone: '+359888123456', isPhoneVerified: false },
      token: 'mock-jwt-token',
      isAuthenticated: true,
      isLoading: false,
    });

    renderRoute();
    expect(
      screen.getByRole('heading', { name: /email verification required/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children when authenticated and email-verified (without requirePhone)', () => {
    useAuthStore.setState({
      user: { id: '1', name: 'Test', username: 'test', email: 'test@example.com', isVerified: true, phone: '+359888123456', isPhoneVerified: true },
      token: 'mock-jwt-token',
      isAuthenticated: true,
      isLoading: false,
    });

    renderRoute();
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('without requirePhone, passes when only email verified (even if phone unverified)', () => {
    useAuthStore.setState({
      user: { id: '1', name: 'Test', username: 'test', email: 'test@example.com', isVerified: true, phone: '+359888123456', isPhoneVerified: false },
      token: 'mock-jwt-token',
      isAuthenticated: true,
      isLoading: false,
    });

    renderRoute();
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('requirePhone prop blocks when isPhoneVerified is false', () => {
    useAuthStore.setState({
      user: { id: '1', name: 'Test', username: 'test', email: 'test@example.com', isVerified: true, phone: '+359888123456', isPhoneVerified: false },
      token: 'mock-jwt-token',
      isAuthenticated: true,
      isLoading: false,
    });

    renderRoute(['/protected'], true);
    expect(
      screen.getByRole('heading', { name: /phone verification required/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('requirePhone prop passes when both email and phone are verified', () => {
    useAuthStore.setState({
      user: { id: '1', name: 'Test', username: 'test', email: 'test@example.com', isVerified: true, phone: '+359888123456', isPhoneVerified: true },
      token: 'mock-jwt-token',
      isAuthenticated: true,
      isLoading: false,
    });

    renderRoute(['/protected'], true);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
