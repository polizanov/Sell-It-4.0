import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { PhoneVerificationModal } from '../../src/components/auth/PhoneVerificationModal';
import { useAuthStore } from '../../src/store/authStore';
import { server } from '../../src/mocks/server';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

describe('PhoneVerificationModal', () => {
  const mockOnClose = vi.fn();
  const mockOnVerified = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
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
        isPhoneVerified: false,
      },
      token: 'mock-jwt-token',
      isAuthenticated: true,
      isLoading: false,
    });
  });

  const renderModal = (isOpen: boolean) => {
    return render(
      <PhoneVerificationModal
        isOpen={isOpen}
        onClose={mockOnClose}
        onVerified={mockOnVerified}
      />,
    );
  };

  it('does not render when isOpen is false', () => {
    renderModal(false);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('Verify Your Phone Number')).not.toBeInTheDocument();
  });

  it('renders when isOpen is true', () => {
    renderModal(true);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Verify Your Phone Number')).toBeInTheDocument();
  });

  it('shows masked phone number', () => {
    renderModal(true);

    // Phone is +359888123456 -> masked as +359****456
    expect(screen.getByText(/\+359\*+456/)).toBeInTheDocument();
  });

  it('submit with valid 6-digit code calls verifyPhone API', async () => {
    const user = userEvent.setup();

    // Register a mock user so the default handler can find them
    server.use(
      http.post(`${API_BASE}/auth/verify-phone`, async ({ request }) => {
        const body = (await request.json()) as { code: string };
        if (body.code === '123456') {
          return HttpResponse.json({
            success: true,
            message: 'Phone number verified successfully',
          });
        }
        return HttpResponse.json(
          { success: false, message: 'Invalid verification code' },
          { status: 400 },
        );
      }),
    );

    renderModal(true);

    const input = screen.getByPlaceholderText('000000');
    await user.type(input, '123456');

    const verifyButton = screen.getByRole('button', { name: /^verify$/i });
    await user.click(verifyButton);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
    expect(mockOnVerified).toHaveBeenCalled();
  });

  it('shows error for invalid code (less than 6 digits)', async () => {
    const user = userEvent.setup();
    renderModal(true);

    const input = screen.getByPlaceholderText('000000');
    await user.type(input, '123');

    // The verify button should be disabled when code is not 6 digits
    const verifyButton = screen.getByRole('button', { name: /^verify$/i });
    expect(verifyButton).toBeDisabled();
  });

  it('shows error when API returns invalid code', async () => {
    const user = userEvent.setup();

    server.use(
      http.post(`${API_BASE}/auth/verify-phone`, async () => {
        return HttpResponse.json(
          { success: false, message: 'Invalid verification code' },
          { status: 400 },
        );
      }),
    );

    renderModal(true);

    const input = screen.getByPlaceholderText('000000');
    await user.type(input, '000000');

    const verifyButton = screen.getByRole('button', { name: /^verify$/i });
    await user.click(verifyButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid verification code')).toBeInTheDocument();
    });
  });

  it('resend button calls sendPhoneVerification', async () => {
    const user = userEvent.setup();

    server.use(
      http.post(`${API_BASE}/auth/send-phone-verification`, () => {
        return HttpResponse.json({
          success: true,
          message: 'Verification code sent to your phone',
        });
      }),
    );

    renderModal(true);

    const resendButton = screen.getByRole('button', { name: /resend code/i });
    await user.click(resendButton);

    await waitFor(() => {
      expect(screen.getByText('Code sent!')).toBeInTheDocument();
    });
  });

  it('closes on backdrop click', async () => {
    const user = userEvent.setup();
    renderModal(true);

    // Click the backdrop (aria-hidden div)
    const backdrop = screen.getByRole('dialog').parentElement?.querySelector('[aria-hidden="true"]');
    expect(backdrop).toBeTruthy();
    await user.click(backdrop!);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('closes on Escape key', async () => {
    const user = userEvent.setup();
    renderModal(true);

    await user.keyboard('{Escape}');

    expect(mockOnClose).toHaveBeenCalled();
  });
});
