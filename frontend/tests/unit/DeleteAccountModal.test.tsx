import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { http, HttpResponse } from 'msw';
import { DeleteAccountModal } from '../../src/components/auth/DeleteAccountModal';
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

describe('DeleteAccountModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockNavigate.mockClear();
    localStorage.clear();
    localStorage.setItem('token', 'mock-jwt-token');

    useAuthStore.setState({
      user: {
        id: '1',
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        isVerified: true,
        phone: '+359888123456',
        isPhoneVerified: true,
      },
      token: 'mock-jwt-token',
      isAuthenticated: true,
      isLoading: false,
    });
  });

  const renderModal = (isOpen: boolean) => {
    return render(
      <MemoryRouter>
        <DeleteAccountModal isOpen={isOpen} onClose={mockOnClose} />
      </MemoryRouter>,
    );
  };

  it('does not render when isOpen is false', () => {
    renderModal(false);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete Account')).not.toBeInTheDocument();
  });

  it('renders modal when isOpen is true', () => {
    renderModal(true);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /delete account/i }),
    ).toBeInTheDocument();
  });

  it('shows warning text about permanent deletion', () => {
    renderModal(true);

    expect(
      screen.getByText(/this action is permanent and cannot be undone/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/all your data, listings, and account information will be permanently deleted/i),
    ).toBeInTheDocument();
  });

  it('shows password field', () => {
    renderModal(true);

    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument();
  });

  it('shows cancel and delete buttons', () => {
    renderModal(true);

    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /delete account/i }),
    ).toBeInTheDocument();
  });

  it('delete button is disabled when password is empty', () => {
    renderModal(true);

    const deleteButton = screen.getByRole('button', { name: /delete account/i });
    expect(deleteButton).toBeDisabled();
  });

  it('successful deletion calls logout and redirects', async () => {
    const user = userEvent.setup();

    server.use(
      http.delete(`${API_BASE}/auth/account`, () => {
        return HttpResponse.json({
          success: true,
          message: 'Account deleted successfully',
        });
      }),
    );

    renderModal(true);

    await user.type(screen.getByLabelText(/password/i), 'Password123!');
    await user.click(screen.getByRole('button', { name: /delete account/i }));

    await waitFor(() => {
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
    });

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('API error shows error message', async () => {
    const user = userEvent.setup();

    server.use(
      http.delete(`${API_BASE}/auth/account`, () => {
        return HttpResponse.json(
          { success: false, message: 'Password is incorrect' },
          { status: 400 },
        );
      }),
    );

    renderModal(true);

    await user.type(screen.getByLabelText(/password/i), 'WrongPass123!');
    await user.click(screen.getByRole('button', { name: /delete account/i }));

    await waitFor(() => {
      expect(screen.getByText('Password is incorrect')).toBeInTheDocument();
    });
  });

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    renderModal(true);

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('shows confirmation prompt text', () => {
    renderModal(true);

    expect(
      screen.getByText(/enter your password to confirm account deletion/i),
    ).toBeInTheDocument();
  });

  it('shows "Deleting..." while submitting', async () => {
    const user = userEvent.setup();

    server.use(
      http.delete(`${API_BASE}/auth/account`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json({
          success: true,
          message: 'Account deleted successfully',
        });
      }),
    );

    renderModal(true);

    await user.type(screen.getByLabelText(/password/i), 'Password123!');
    await user.click(screen.getByRole('button', { name: /delete account/i }));

    expect(screen.getByText('Deleting...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('Deleting...')).not.toBeInTheDocument();
    });
  });
});
