import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { http, HttpResponse } from 'msw';
import VerifyEmail from '../../src/pages/VerifyEmail';
import { useAuthStore } from '../../src/store/authStore';
import { server } from '../../src/mocks/server';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const renderVerifyEmail = (url: string) => {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/verify-email" element={<VerifyEmail />} />
      </Routes>
    </MemoryRouter>,
  );
};

describe('VerifyEmail Page', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  it('shows loading spinner initially when token is provided', () => {
    // The default handler will try to find the user in the empty array and fail,
    // but we need a delayed handler to observe the loading state.
    server.use(
      http.get(`${API_BASE}/auth/verify-email/:token`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return HttpResponse.json({
          success: true,
          message: 'Email verified successfully',
        });
      }),
    );

    renderVerifyEmail('/verify-email?token=mock-verification-token');

    expect(screen.getByText('Verifying your email...')).toBeInTheDocument();
  });

  it('shows "Email Verified!" on successful verification with Go to Login link (unauthenticated)', async () => {
    server.use(
      http.get(`${API_BASE}/auth/verify-email/:token`, () => {
        return HttpResponse.json({
          success: true,
          message: 'Email verified successfully',
        });
      }),
    );

    renderVerifyEmail('/verify-email?token=mock-verification-token');

    // Initially shows loading
    expect(screen.getByText('Verifying your email...')).toBeInTheDocument();

    // Then shows success
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /email verified!/i }),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        /your email has been successfully verified/i,
      ),
    ).toBeInTheDocument();

    const loginLink = screen.getByRole('link', { name: /go to login/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  it('shows "Verification Failed" on error with invalid token', async () => {
    server.use(
      http.get(`${API_BASE}/auth/verify-email/:token`, () => {
        return HttpResponse.json(
          {
            success: false,
            message: 'Invalid or expired verification token',
          },
          { status: 400 },
        );
      }),
    );

    renderVerifyEmail('/verify-email?token=invalid-token');

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /verification failed/i }),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText('Invalid or expired verification token'),
    ).toBeInTheDocument();

    // Should still show a Go to Login link
    const loginLink = screen.getByRole('link', { name: /go to login/i });
    expect(loginLink).toBeInTheDocument();
  });

  it('shows "Invalid verification link" when no token in URL', () => {
    renderVerifyEmail('/verify-email');

    expect(
      screen.getByRole('heading', { name: /verification failed/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Invalid verification link'),
    ).toBeInTheDocument();
  });

  it('shows "Verification Failed" with custom error message from server', async () => {
    server.use(
      http.get(`${API_BASE}/auth/verify-email/:token`, () => {
        return HttpResponse.json(
          {
            success: false,
            message: 'Token has expired',
          },
          { status: 400 },
        );
      }),
    );

    renderVerifyEmail('/verify-email?token=expired-token');

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /verification failed/i }),
      ).toBeInTheDocument();
    });

    expect(screen.getByText('Token has expired')).toBeInTheDocument();
  });

  it('shows phone verification note on success when authenticated with unverified phone', async () => {
    // Set up authenticated user with unverified phone
    useAuthStore.setState({
      user: {
        id: '1',
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        isVerified: false,
        phone: '+359888123456',
        isPhoneVerified: false,
      },
      token: 'mock-jwt-token',
      isAuthenticated: true,
      isLoading: false,
    });

    server.use(
      http.get(`${API_BASE}/auth/verify-email/:token`, () => {
        return HttpResponse.json({
          success: true,
          message: 'Email verified successfully',
        });
      }),
    );

    renderVerifyEmail('/verify-email?token=mock-verification-token');

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /email verified!/i }),
      ).toBeInTheDocument();
    });

    // Should show the phone verification note
    expect(
      screen.getByText(/you also need to verify your phone number/i),
    ).toBeInTheDocument();
  });
});
