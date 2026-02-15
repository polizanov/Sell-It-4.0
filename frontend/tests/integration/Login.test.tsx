import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { http, HttpResponse } from 'msw';
import Login from '../../src/pages/Login';
import { useAuthStore } from '../../src/store/authStore';
import { server } from '../../src/mocks/server';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderLogin = () => {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Login />
    </MemoryRouter>,
  );
};

/**
 * Helper to submit the form by dispatching a submit event directly.
 * This bypasses native HTML5 constraint validation (required attributes)
 * so we can test the component's own validation logic.
 */
const submitForm = () => {
  const form = document.querySelector('form');
  if (!form) throw new Error('Form not found');
  fireEvent.submit(form);
};

describe('Login Page', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
    mockNavigate.mockClear();
  });

  it('renders login form with email, password fields and Login button', () => {
    renderLogin();

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /login/i }),
    ).toBeInTheDocument();
  });

  it('renders Welcome Back heading and subtitle', () => {
    renderLogin();

    expect(
      screen.getByRole('heading', { name: /welcome back/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/login to your sell-it account/i),
    ).toBeInTheDocument();
  });

  it('renders link to register page', () => {
    renderLogin();

    const registerLink = screen.getByRole('link', { name: /register here/i });
    expect(registerLink).toBeInTheDocument();
    expect(registerLink).toHaveAttribute('href', '/register');
  });

  it('shows "Email is required" when submitting with empty email', async () => {
    const user = userEvent.setup();
    renderLogin();

    const passwordInput = screen.getByLabelText(/password/i);
    await user.type(passwordInput, 'password123');

    // Use fireEvent.submit to bypass native required validation
    submitForm();

    expect(screen.getByText('Email is required')).toBeInTheDocument();
  });

  it('shows "Password is required" when submitting with empty password', async () => {
    const user = userEvent.setup();
    renderLogin();

    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'test@example.com');

    // Use fireEvent.submit to bypass native required validation
    submitForm();

    expect(screen.getByText('Password is required')).toBeInTheDocument();
  });

  it('shows "Please enter a valid email address" for invalid email format', async () => {
    const user = userEvent.setup();
    renderLogin();

    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'notanemail');

    const passwordInput = screen.getByLabelText(/password/i);
    await user.type(passwordInput, 'password123');

    submitForm();

    expect(
      screen.getByText('Please enter a valid email address'),
    ).toBeInTheDocument();
  });

  it('shows both validation errors when submitting with all empty fields', () => {
    renderLogin();

    // Use fireEvent.submit to bypass native required validation
    submitForm();

    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
  });

  it('successful login updates store and navigates to home', async () => {
    const user = userEvent.setup();

    // Set up a one-time handler that returns a successful login
    server.use(
      http.post(`${API_BASE}/auth/login`, () => {
        return HttpResponse.json({
          success: true,
          message: 'Login successful',
          data: {
            id: '1',
            name: 'Test User',
            username: 'testuser',
            email: 'test@example.com',
            isVerified: true,
            token: 'mock-jwt-token',
          },
        });
      }),
    );

    renderLogin();

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    const submitButton = screen.getByRole('button', { name: /login/i });
    await user.click(submitButton);

    await waitFor(() => {
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.email).toBe('test@example.com');
      expect(state.token).toBe('mock-jwt-token');
    });

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('shows "Logging in..." while submitting', async () => {
    const user = userEvent.setup();

    // Use a delayed response to observe the loading state
    server.use(
      http.post(`${API_BASE}/auth/login`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json({
          success: true,
          message: 'Login successful',
          data: {
            id: '1',
            name: 'Test User',
            username: 'testuser',
            email: 'test@example.com',
            isVerified: true,
            token: 'mock-jwt-token',
          },
        });
      }),
    );

    renderLogin();

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    const submitButton = screen.getByRole('button', { name: /login/i });
    await user.click(submitButton);

    expect(screen.getByText('Logging in...')).toBeInTheDocument();

    // Wait for the request to complete
    await waitFor(() => {
      expect(screen.queryByText('Logging in...')).not.toBeInTheDocument();
    });
  });

  it('failed login (401) shows error message', async () => {
    const user = userEvent.setup();

    server.use(
      http.post(`${API_BASE}/auth/login`, () => {
        return HttpResponse.json(
          { success: false, message: 'Invalid email or password' },
          { status: 401 },
        );
      }),
    );

    renderLogin();

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await user.type(emailInput, 'wrong@example.com');
    await user.type(passwordInput, 'wrongpassword');

    const submitButton = screen.getByRole('button', { name: /login/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Invalid email or password'),
      ).toBeInTheDocument();
    });
  });

  it('unverified user login (403) shows verification message', async () => {
    const user = userEvent.setup();

    server.use(
      http.post(`${API_BASE}/auth/login`, () => {
        return HttpResponse.json(
          {
            success: false,
            message: 'Please verify your email before logging in',
          },
          { status: 403 },
        );
      }),
    );

    renderLogin();

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await user.type(emailInput, 'unverified@example.com');
    await user.type(passwordInput, 'password123');

    const submitButton = screen.getByRole('button', { name: /login/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Please verify your email before logging in'),
      ).toBeInTheDocument();
    });
  });

  it('renders white background with mouse-follow gradient', () => {
    const { container } = renderLogin();

    // Verify white background is present
    const whiteBg = container.querySelector('.bg-white');
    expect(whiteBg).toBeInTheDocument();

    // Verify MouseFollowGradient overlay is rendered
    const gradientOverlay = container.querySelector('.pointer-events-none');
    expect(gradientOverlay).toBeInTheDocument();
    expect(gradientOverlay).toHaveClass('absolute');
    expect(gradientOverlay).toHaveClass('inset-0');
    expect(gradientOverlay).toHaveClass('transition-opacity');

    // Gradient should be in hover mode (initially opacity: 0)
    const overlay = gradientOverlay as HTMLElement;
    expect(overlay?.style.opacity).toBe('0');
  });

  it('renders gradient design enhancements', () => {
    const { container } = renderLogin();

    // Verify icon container with gradient glow is present
    const iconGlowElements = container.querySelectorAll('.bg-gradient-icon-glow');
    expect(iconGlowElements.length).toBeGreaterThan(0);

    // Verify submit button has gradient and shadow classes
    const submitButton = screen.getByRole('button', { name: /login/i });
    expect(submitButton.className).toContain('shadow-xl');
    expect(submitButton.className).toContain('shadow-orange');
  });

  it('login button has gradient styling when rendered', () => {
    const { container } = renderLogin();

    const submitButton = screen.getByRole('button', { name: /login/i });

    // Verify gradient classes are applied
    expect(submitButton.className).toContain('bg-gradient-cta');
    expect(submitButton.className).toContain('shadow-xl');
    expect(submitButton.className).toContain('shadow-orange/40');
  });
});
