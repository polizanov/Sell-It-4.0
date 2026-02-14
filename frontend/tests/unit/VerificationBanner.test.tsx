import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { VerificationBanner } from '../../src/components/common/VerificationBanner';
import { useAuthStore } from '../../src/store/authStore';

const renderBanner = () => {
  return render(
    <MemoryRouter>
      <VerificationBanner />
    </MemoryRouter>,
  );
};

describe('VerificationBanner', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  it('does not render when user is not authenticated', () => {
    renderBanner();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('does not render when user is verified', () => {
    useAuthStore.setState({
      user: { id: '1', name: 'Test', username: 'test', email: 'test@example.com', isVerified: true },
      token: 'mock-jwt-token',
      isAuthenticated: true,
      isLoading: false,
    });

    renderBanner();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders warning banner for unverified authenticated user', () => {
    useAuthStore.setState({
      user: { id: '1', name: 'Test', username: 'test', email: 'test@example.com', isVerified: false },
      token: 'mock-jwt-token',
      isAuthenticated: true,
      isLoading: false,
    });

    renderBanner();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/your email is not verified/i)).toBeInTheDocument();
  });

  it('can be dismissed by clicking the X button', async () => {
    useAuthStore.setState({
      user: { id: '1', name: 'Test', username: 'test', email: 'test@example.com', isVerified: false },
      token: 'mock-jwt-token',
      isAuthenticated: true,
      isLoading: false,
    });

    renderBanner();
    expect(screen.getByRole('alert')).toBeInTheDocument();

    const dismissButton = screen.getByLabelText(/dismiss/i);
    await userEvent.click(dismissButton);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
