import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { http, HttpResponse } from 'msw';
import Register from '../../src/pages/Register';
import { server } from '../../src/mocks/server';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const renderRegister = () => {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <Register />
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

describe('Register Page', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders register form with name, username, email, phone, password, and confirm password fields', () => {
    renderRegister();

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^phone number$/i)).toBeInTheDocument();
    // Use getByPlaceholderText to distinguish between Password and Confirm Password
    expect(
      screen.getByPlaceholderText('8+ chars, uppercase, number, special char'),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Re-enter your password'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /create account/i }),
    ).toBeInTheDocument();
  });

  it('renders Create Account heading and subtitle', () => {
    renderRegister();

    expect(
      screen.getByRole('heading', { name: /create account/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/join sell-it and start trading today/i),
    ).toBeInTheDocument();
  });

  it('renders link to login page', () => {
    renderRegister();

    const loginLink = screen.getByRole('link', { name: /login here/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  it('shows validation errors for all empty fields', () => {
    renderRegister();

    // Use fireEvent.submit to bypass native required validation
    submitForm();

    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Username is required')).toBeInTheDocument();
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Phone number is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(
      screen.getByText('Please confirm your password'),
    ).toBeInTheDocument();
  });

  it('shows "Name is required" when only name is empty', async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(
      screen.getByLabelText(/email address/i),
      'test@example.com',
    );
    await user.type(
      screen.getByPlaceholderText('8+ chars, uppercase, number, special char'),
      'Password123!',
    );
    await user.type(
      screen.getByPlaceholderText('Re-enter your password'),
      'Password123!',
    );

    // Use fireEvent.submit to bypass native required on name field
    submitForm();

    expect(screen.getByText('Name is required')).toBeInTheDocument();
  });

  it('shows "Please enter a valid email address" for invalid email', async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText(/full name/i), 'Test User');
    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(screen.getByLabelText(/email address/i), 'invalid-email');
    await user.type(
      screen.getByPlaceholderText('8+ chars, uppercase, number, special char'),
      'Password123!',
    );
    await user.type(
      screen.getByPlaceholderText('Re-enter your password'),
      'Password123!',
    );

    submitForm();

    expect(
      screen.getByText('Please enter a valid email address'),
    ).toBeInTheDocument();
  });

  it('shows "Password must be at least 8 characters" for short password', async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText(/full name/i), 'Test User');
    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(
      screen.getByLabelText(/email address/i),
      'test@example.com',
    );
    await user.type(
      screen.getByPlaceholderText('8+ chars, uppercase, number, special char'),
      '12345',
    );
    await user.type(
      screen.getByPlaceholderText('Re-enter your password'),
      '12345',
    );

    submitForm();

    expect(
      screen.getByText('Password must be at least 8 characters'),
    ).toBeInTheDocument();
  });

  it('shows "Passwords do not match" for mismatched passwords', async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText(/full name/i), 'Test User');
    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(
      screen.getByLabelText(/email address/i),
      'test@example.com',
    );
    await user.type(
      screen.getByPlaceholderText('8+ chars, uppercase, number, special char'),
      'Password123!',
    );
    await user.type(
      screen.getByPlaceholderText('Re-enter your password'),
      'differentpassword',
    );

    submitForm();

    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
  });

  it('shows "Username is required" when username is empty', async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText(/full name/i), 'Test User');
    await user.type(
      screen.getByLabelText(/email address/i),
      'test@example.com',
    );
    await user.type(
      screen.getByPlaceholderText('8+ chars, uppercase, number, special char'),
      'Password123!',
    );
    await user.type(
      screen.getByPlaceholderText('Re-enter your password'),
      'Password123!',
    );

    submitForm();

    expect(screen.getByText('Username is required')).toBeInTheDocument();
  });

  it('shows "Phone number is required" when phone is empty', async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText(/full name/i), 'Test User');
    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(
      screen.getByLabelText(/email address/i),
      'test@example.com',
    );
    // Do not fill phone
    await user.type(
      screen.getByPlaceholderText('8+ chars, uppercase, number, special char'),
      'Password123!',
    );
    await user.type(
      screen.getByPlaceholderText('Re-enter your password'),
      'Password123!',
    );

    submitForm();

    expect(screen.getByText('Phone number is required')).toBeInTheDocument();
  });

  it('shows "Please enter a valid phone number" for invalid phone input', async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText(/full name/i), 'Test User');
    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(
      screen.getByLabelText(/email address/i),
      'test@example.com',
    );
    // Type an invalid phone number directly into the phone input field
    // The PhoneInput component uses react-phone-number-input which manages the input
    // We need to find the actual input inside the phone input wrapper and type into it
    const phoneInput = screen.getByLabelText(/^phone number$/i);
    await user.type(phoneInput, '123');
    await user.type(
      screen.getByPlaceholderText('8+ chars, uppercase, number, special char'),
      'Password123!',
    );
    await user.type(
      screen.getByPlaceholderText('Re-enter your password'),
      'Password123!',
    );

    submitForm();

    expect(
      screen.getByText('Please enter a valid phone number'),
    ).toBeInTheDocument();
  });

  it('shows validation error for username with invalid characters', async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText(/full name/i), 'Test User');
    await user.type(screen.getByLabelText(/username/i), 'test-user');
    await user.type(
      screen.getByLabelText(/email address/i),
      'test@example.com',
    );
    await user.type(
      screen.getByPlaceholderText('8+ chars, uppercase, number, special char'),
      'Password123!',
    );
    await user.type(
      screen.getByPlaceholderText('Re-enter your password'),
      'Password123!',
    );

    submitForm();

    expect(
      screen.getByText('Username can only contain letters, numbers, and underscores'),
    ).toBeInTheDocument();
  });

  it('successful registration shows Check Your Email screen with Go to Login link', async () => {
    const user = userEvent.setup();

    server.use(
      http.post(`${API_BASE}/auth/register`, () => {
        return HttpResponse.json(
          {
            success: true,
            message: 'Registration successful.',
            data: {
              id: '1',
              name: 'Test User',
              username: 'testuser',
              email: 'newuser@example.com',
              phone: '+359888123456',
              isPhoneVerified: false,
            },
          },
          { status: 201 },
        );
      }),
    );

    renderRegister();

    await user.type(screen.getByLabelText(/full name/i), 'Test User');
    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(
      screen.getByLabelText(/email address/i),
      'newuser@example.com',
    );
    await user.type(screen.getByLabelText(/^phone number$/i), '888123456');
    await user.type(
      screen.getByPlaceholderText('8+ chars, uppercase, number, special char'),
      'Password123!',
    );
    await user.type(
      screen.getByPlaceholderText('Re-enter your password'),
      'Password123!',
    );

    const submitButton = screen.getByRole('button', {
      name: /create account/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /check your email/i }),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText(/we've sent a verification link to your email/i),
    ).toBeInTheDocument();

    const loginLink = screen.getByRole('link', { name: /go to login/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  it('shows "Creating Account..." while submitting', async () => {
    const user = userEvent.setup();

    server.use(
      http.post(`${API_BASE}/auth/register`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json(
          {
            success: true,
            message: 'Registration successful.',
            data: { id: '1', name: 'Test User', username: 'testuser', email: 'test@example.com', phone: '+359888123456', isPhoneVerified: false },
          },
          { status: 201 },
        );
      }),
    );

    renderRegister();

    await user.type(screen.getByLabelText(/full name/i), 'Test User');
    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(
      screen.getByLabelText(/email address/i),
      'test@example.com',
    );
    await user.type(screen.getByLabelText(/^phone number$/i), '888123456');
    await user.type(
      screen.getByPlaceholderText('8+ chars, uppercase, number, special char'),
      'Password123!',
    );
    await user.type(
      screen.getByPlaceholderText('Re-enter your password'),
      'Password123!',
    );

    const submitButton = screen.getByRole('button', {
      name: /create account/i,
    });
    await user.click(submitButton);

    expect(screen.getByText('Creating Account...')).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.queryByText('Creating Account...'),
      ).not.toBeInTheDocument();
    });
  });

  it('failed registration with duplicate email shows error message', async () => {
    const user = userEvent.setup();

    server.use(
      http.post(`${API_BASE}/auth/register`, () => {
        return HttpResponse.json(
          {
            success: false,
            message: 'User already exists with this email',
          },
          { status: 400 },
        );
      }),
    );

    renderRegister();

    await user.type(screen.getByLabelText(/full name/i), 'Test User');
    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(
      screen.getByLabelText(/email address/i),
      'existing@example.com',
    );
    await user.type(screen.getByLabelText(/^phone number$/i), '888123456');
    await user.type(
      screen.getByPlaceholderText('8+ chars, uppercase, number, special char'),
      'Password123!',
    );
    await user.type(
      screen.getByPlaceholderText('Re-enter your password'),
      'Password123!',
    );

    const submitButton = screen.getByRole('button', {
      name: /create account/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('User already exists with this email'),
      ).toBeInTheDocument();
    });
  });

  it('renders white background with mouse-follow gradient on registration form', () => {
    const { container } = renderRegister();

    // Verify white background is present
    const whiteBg = container.querySelector('.bg-white');
    expect(whiteBg).toBeInTheDocument();

    // Verify MouseFollowGradient overlay is rendered
    const gradientOverlay = container.querySelector('.pointer-events-none');
    expect(gradientOverlay).toBeInTheDocument();
    expect(gradientOverlay).toHaveClass('absolute');
    expect(gradientOverlay).toHaveClass('inset-0');
    expect(gradientOverlay).toHaveClass('transition-opacity');

    // Gradient should be in always mode (initially opacity: 1)
    const overlay = gradientOverlay as HTMLElement;
    expect(overlay?.style.opacity).toBe('1');
  });

  it('renders gradient design enhancements on registration form', () => {
    const { container } = renderRegister();

    // Verify icon container with gradient glow is present
    const iconGlowElements = container.querySelectorAll('.bg-gradient-icon-glow');
    expect(iconGlowElements.length).toBeGreaterThan(0);

    // Verify submit button has gradient and shadow classes
    const submitButton = screen.getByRole('button', { name: /create account/i });
    expect(submitButton.className).toContain('shadow-xl');
    expect(submitButton.className).toContain('shadow-orange');
  });

  it('success state displays gradient enhancements and mouse-follow gradient', async () => {
    const user = userEvent.setup();

    server.use(
      http.post(`${API_BASE}/auth/register`, () => {
        return HttpResponse.json(
          {
            success: true,
            message: 'Registration successful.',
            data: {
              id: '1',
              name: 'Test User',
              username: 'testuser',
              email: 'newuser@example.com',
              phone: '+359888123456',
              isPhoneVerified: false,
            },
          },
          { status: 201 },
        );
      }),
    );

    const { container } = renderRegister();

    await user.type(screen.getByLabelText(/full name/i), 'Test User');
    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(
      screen.getByLabelText(/email address/i),
      'newuser@example.com',
    );
    await user.type(screen.getByLabelText(/^phone number$/i), '888123456');
    await user.type(
      screen.getByPlaceholderText('8+ chars, uppercase, number, special char'),
      'Password123!',
    );
    await user.type(
      screen.getByPlaceholderText('Re-enter your password'),
      'Password123!',
    );

    const submitButton = screen.getByRole('button', {
      name: /create account/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /check your email/i }),
      ).toBeInTheDocument();
    });

    // Verify white background is still present in success state
    const whiteBg = container.querySelector('.bg-white');
    expect(whiteBg).toBeInTheDocument();

    // Verify MouseFollowGradient overlay is still rendered in success state
    const gradientOverlay = container.querySelector('.pointer-events-none');
    expect(gradientOverlay).toBeInTheDocument();

    // Verify success icon with gradient background
    const successIconElements = container.querySelectorAll('.bg-gradient-success-icon');
    expect(successIconElements.length).toBeGreaterThan(0);

    // Verify scale-in animation class is present
    const scaleInElements = container.querySelectorAll('.animate-scale-in');
    expect(scaleInElements.length).toBeGreaterThan(0);

    // Verify "Go to Login" button has gradient styling
    const loginButton = screen.getByRole('link', { name: /go to login/i });
    expect(loginButton.className).toContain('bg-gradient-cta');
    expect(loginButton.className).toContain('shadow-xl');
  });
});
