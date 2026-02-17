import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { ChangePasswordModal } from '../../src/components/auth/ChangePasswordModal';
import { server } from '../../src/mocks/server';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

describe('ChangePasswordModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    localStorage.clear();
    localStorage.setItem('token', 'mock-jwt-token');
  });

  const renderModal = (isOpen: boolean) => {
    return render(<ChangePasswordModal isOpen={isOpen} onClose={mockOnClose} />);
  };

  it('does not render when isOpen is false', () => {
    renderModal(false);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('Change Password')).not.toBeInTheDocument();
  });

  it('renders modal when isOpen is true', () => {
    renderModal(true);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /change password/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/enter your current password and choose a new one/i),
    ).toBeInTheDocument();
  });

  it('renders all form fields and buttons', () => {
    renderModal(true);

    expect(screen.getByLabelText('Current Password')).toBeInTheDocument();
    expect(screen.getByLabelText('New Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /change password/i }),
    ).toBeInTheDocument();
  });

  it('shows validation error for short password', async () => {
    const user = userEvent.setup();
    renderModal(true);

    await user.type(screen.getByLabelText('Current Password'), 'Password123!');
    await user.type(screen.getByLabelText('New Password'), 'Short1!');
    await user.type(screen.getByLabelText('Confirm New Password'), 'Short1!');

    await user.click(screen.getByRole('button', { name: /change password/i }));

    expect(
      screen.getByText('Password must be at least 8 characters'),
    ).toBeInTheDocument();
  });

  it('shows validation error for password without uppercase', async () => {
    const user = userEvent.setup();
    renderModal(true);

    await user.type(screen.getByLabelText('Current Password'), 'Password123!');
    await user.type(screen.getByLabelText('New Password'), 'newpassword123!');
    await user.type(screen.getByLabelText('Confirm New Password'), 'newpassword123!');

    await user.click(screen.getByRole('button', { name: /change password/i }));

    expect(
      screen.getByText('Password must contain at least one uppercase letter'),
    ).toBeInTheDocument();
  });

  it('shows validation error for password without number', async () => {
    const user = userEvent.setup();
    renderModal(true);

    await user.type(screen.getByLabelText('Current Password'), 'Password123!');
    await user.type(screen.getByLabelText('New Password'), 'NewPassword!');
    await user.type(screen.getByLabelText('Confirm New Password'), 'NewPassword!');

    await user.click(screen.getByRole('button', { name: /change password/i }));

    expect(
      screen.getByText('Password must contain at least one number'),
    ).toBeInTheDocument();
  });

  it('shows validation error for password without special character', async () => {
    const user = userEvent.setup();
    renderModal(true);

    await user.type(screen.getByLabelText('Current Password'), 'Password123!');
    await user.type(screen.getByLabelText('New Password'), 'NewPassword123');
    await user.type(screen.getByLabelText('Confirm New Password'), 'NewPassword123');

    await user.click(screen.getByRole('button', { name: /change password/i }));

    expect(
      screen.getByText('Password must contain at least one special character'),
    ).toBeInTheDocument();
  });

  it('shows validation error when passwords do not match', async () => {
    const user = userEvent.setup();
    renderModal(true);

    await user.type(screen.getByLabelText('Current Password'), 'Password123!');
    await user.type(screen.getByLabelText('New Password'), 'NewPassword456!');
    await user.type(
      screen.getByLabelText('Confirm New Password'),
      'DifferentPassword789!',
    );

    await user.click(screen.getByRole('button', { name: /change password/i }));

    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
  });

  it('successful password change shows success message', async () => {
    const user = userEvent.setup();

    server.use(
      http.post(`${API_BASE}/auth/change-password`, () => {
        return HttpResponse.json({
          success: true,
          message: 'Password changed successfully',
        });
      }),
    );

    renderModal(true);

    await user.type(screen.getByLabelText('Current Password'), 'Password123!');
    await user.type(screen.getByLabelText('New Password'), 'NewPassword456!');
    await user.type(
      screen.getByLabelText('Confirm New Password'),
      'NewPassword456!',
    );

    await user.click(screen.getByRole('button', { name: /change password/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Password changed successfully'),
      ).toBeInTheDocument();
    });
  });

  it('API error shows error message', async () => {
    const user = userEvent.setup();

    server.use(
      http.post(`${API_BASE}/auth/change-password`, () => {
        return HttpResponse.json(
          { success: false, message: 'Current password is incorrect' },
          { status: 400 },
        );
      }),
    );

    renderModal(true);

    await user.type(screen.getByLabelText('Current Password'), 'WrongPass123!');
    await user.type(screen.getByLabelText('New Password'), 'NewPassword456!');
    await user.type(
      screen.getByLabelText('Confirm New Password'),
      'NewPassword456!',
    );

    await user.click(screen.getByRole('button', { name: /change password/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Current password is incorrect'),
      ).toBeInTheDocument();
    });
  });

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    renderModal(true);

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('shows "Changing..." while submitting', async () => {
    const user = userEvent.setup();

    server.use(
      http.post(`${API_BASE}/auth/change-password`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json({
          success: true,
          message: 'Password changed successfully',
        });
      }),
    );

    renderModal(true);

    await user.type(screen.getByLabelText('Current Password'), 'Password123!');
    await user.type(screen.getByLabelText('New Password'), 'NewPassword456!');
    await user.type(
      screen.getByLabelText('Confirm New Password'),
      'NewPassword456!',
    );

    await user.click(screen.getByRole('button', { name: /change password/i }));

    expect(screen.getByText('Changing...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('Changing...')).not.toBeInTheDocument();
    });
  });
});
