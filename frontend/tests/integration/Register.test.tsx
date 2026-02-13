import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { http, HttpResponse } from 'msw';
import Register from '../../src/pages/Register';
import { server } from '../../src/mocks/server';

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

  it('renders register form with name, email, password, and confirm password fields', () => {
    renderRegister();

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    // Use getByPlaceholderText to distinguish between Password and Confirm Password
    expect(
      screen.getByPlaceholderText('At least 6 characters'),
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
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(
      screen.getByText('Please confirm your password'),
    ).toBeInTheDocument();
  });

  it('shows "Name is required" when only name is empty', async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.type(
      screen.getByLabelText(/email address/i),
      'test@example.com',
    );
    await user.type(
      screen.getByPlaceholderText('At least 6 characters'),
      'password123',
    );
    await user.type(
      screen.getByPlaceholderText('Re-enter your password'),
      'password123',
    );

    // Use fireEvent.submit to bypass native required on name field
    submitForm();

    expect(screen.getByText('Name is required')).toBeInTheDocument();
  });

  it('shows "Please enter a valid email address" for invalid email', async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText(/full name/i), 'Test User');
    await user.type(screen.getByLabelText(/email address/i), 'invalid-email');
    await user.type(
      screen.getByPlaceholderText('At least 6 characters'),
      'password123',
    );
    await user.type(
      screen.getByPlaceholderText('Re-enter your password'),
      'password123',
    );

    submitForm();

    expect(
      screen.getByText('Please enter a valid email address'),
    ).toBeInTheDocument();
  });

  it('shows "Password must be at least 6 characters" for short password', async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText(/full name/i), 'Test User');
    await user.type(
      screen.getByLabelText(/email address/i),
      'test@example.com',
    );
    await user.type(
      screen.getByPlaceholderText('At least 6 characters'),
      '12345',
    );
    await user.type(
      screen.getByPlaceholderText('Re-enter your password'),
      '12345',
    );

    submitForm();

    expect(
      screen.getByText('Password must be at least 6 characters'),
    ).toBeInTheDocument();
  });

  it('shows "Passwords do not match" for mismatched passwords', async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText(/full name/i), 'Test User');
    await user.type(
      screen.getByLabelText(/email address/i),
      'test@example.com',
    );
    await user.type(
      screen.getByPlaceholderText('At least 6 characters'),
      'password123',
    );
    await user.type(
      screen.getByPlaceholderText('Re-enter your password'),
      'differentpassword',
    );

    submitForm();

    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
  });

  it('successful registration shows Check Your Email screen with Go to Login link', async () => {
    const user = userEvent.setup();

    server.use(
      http.post('/api/auth/register', () => {
        return HttpResponse.json(
          {
            success: true,
            message: 'Registration successful.',
            data: {
              id: '1',
              name: 'Test User',
              email: 'newuser@example.com',
            },
          },
          { status: 201 },
        );
      }),
    );

    renderRegister();

    await user.type(screen.getByLabelText(/full name/i), 'Test User');
    await user.type(
      screen.getByLabelText(/email address/i),
      'newuser@example.com',
    );
    await user.type(
      screen.getByPlaceholderText('At least 6 characters'),
      'password123',
    );
    await user.type(
      screen.getByPlaceholderText('Re-enter your password'),
      'password123',
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
      http.post('/api/auth/register', async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json(
          {
            success: true,
            message: 'Registration successful.',
            data: { id: '1', name: 'Test User', email: 'test@example.com' },
          },
          { status: 201 },
        );
      }),
    );

    renderRegister();

    await user.type(screen.getByLabelText(/full name/i), 'Test User');
    await user.type(
      screen.getByLabelText(/email address/i),
      'test@example.com',
    );
    await user.type(
      screen.getByPlaceholderText('At least 6 characters'),
      'password123',
    );
    await user.type(
      screen.getByPlaceholderText('Re-enter your password'),
      'password123',
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
      http.post('/api/auth/register', () => {
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
    await user.type(
      screen.getByLabelText(/email address/i),
      'existing@example.com',
    );
    await user.type(
      screen.getByPlaceholderText('At least 6 characters'),
      'password123',
    );
    await user.type(
      screen.getByPlaceholderText('Re-enter your password'),
      'password123',
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
});
