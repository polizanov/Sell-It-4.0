import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { ProfilePhotoModal } from '../../src/components/auth/ProfilePhotoModal';
import { useAuthStore } from '../../src/store/authStore';
import { server } from '../../src/mocks/server';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Mock URL.createObjectURL and URL.revokeObjectURL since jsdom doesn't support them.
// These must persist for the entire file because React effect cleanups may call
// revokeObjectURL after the test has finished (during component teardown).
const mockObjectUrl = 'blob:http://localhost/mock-preview-url';
URL.createObjectURL = vi.fn(() => mockObjectUrl);
URL.revokeObjectURL = vi.fn();

describe('ProfilePhotoModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    vi.mocked(URL.createObjectURL).mockClear();
    vi.mocked(URL.revokeObjectURL).mockClear();
    localStorage.clear();
    localStorage.setItem('token', 'mock-jwt-token');

    // Set up a mock user in the auth store
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
    return render(<ProfilePhotoModal isOpen={isOpen} onClose={mockOnClose} />);
  };

  it('does not render when isOpen is false', () => {
    renderModal(false);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('Change Profile Photo')).not.toBeInTheDocument();
  });

  it('renders modal when isOpen is true', () => {
    renderModal(true);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /change profile photo/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/upload a new profile photo/i),
    ).toBeInTheDocument();
  });

  it('shows file input / upload area', () => {
    renderModal(true);

    expect(screen.getByText('Click to select an image')).toBeInTheDocument();
  });

  it('shows cancel and upload buttons', () => {
    renderModal(true);

    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /upload photo/i }),
    ).toBeInTheDocument();
  });

  it('shows user initials when no profile photo', () => {
    renderModal(true);

    // User name is "Test User", so initials should be "TU"
    expect(screen.getByText('TU')).toBeInTheDocument();
  });

  it('shows preview after selecting a file', async () => {
    renderModal(true);

    const file = new File(['fake image data'], 'photo.jpg', {
      type: 'image/jpeg',
    });

    // The actual file input is hidden, find it
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeTruthy();

    // Simulate file selection
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Should show the file name instead of "Click to select an image"
    await waitFor(() => {
      expect(screen.getByText('photo.jpg')).toBeInTheDocument();
    });

    // Should show preview image
    const previewImg = screen.getByAltText('Preview');
    expect(previewImg).toBeInTheDocument();
    expect(previewImg).toHaveAttribute('src', mockObjectUrl);
  });

  it('successful upload updates user state', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    server.use(
      http.post(`${API_BASE}/auth/profile-photo`, () => {
        return HttpResponse.json({
          success: true,
          message: 'Profile photo updated successfully',
          data: {
            profilePhoto: 'https://cloudinary.com/test/photo.jpg',
          },
        });
      }),
    );

    renderModal(true);

    const file = new File(['fake image data'], 'photo.jpg', {
      type: 'image/jpeg',
    });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('photo.jpg')).toBeInTheDocument();
    });

    const uploadButton = screen.getByRole('button', { name: /upload photo/i });
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(
        screen.getByText('Profile photo updated successfully'),
      ).toBeInTheDocument();
    });

    // Verify user state was updated
    const state = useAuthStore.getState();
    expect(state.user?.profilePhoto).toBe('https://cloudinary.com/test/photo.jpg');

    vi.useRealTimers();
  });

  it('API error shows error message', async () => {
    server.use(
      http.post(`${API_BASE}/auth/profile-photo`, () => {
        return HttpResponse.json(
          { success: false, message: 'File too large' },
          { status: 400 },
        );
      }),
    );

    renderModal(true);

    const file = new File(['fake image data'], 'photo.jpg', {
      type: 'image/jpeg',
    });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('photo.jpg')).toBeInTheDocument();
    });

    const uploadButton = screen.getByRole('button', { name: /upload photo/i });
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText('File too large')).toBeInTheDocument();
    });
  });

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    renderModal(true);

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('upload button is disabled when no file is selected', () => {
    renderModal(true);

    const uploadButton = screen.getByRole('button', { name: /upload photo/i });
    expect(uploadButton).toBeDisabled();
  });

  it('shows "Uploading..." while submitting', async () => {
    server.use(
      http.post(`${API_BASE}/auth/profile-photo`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json({
          success: true,
          message: 'Profile photo updated successfully',
          data: {
            profilePhoto: 'https://cloudinary.com/test/photo.jpg',
          },
        });
      }),
    );

    renderModal(true);

    const file = new File(['fake image data'], 'photo.jpg', {
      type: 'image/jpeg',
    });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('photo.jpg')).toBeInTheDocument();
    });

    const uploadButton = screen.getByRole('button', { name: /upload photo/i });
    fireEvent.click(uploadButton);

    expect(screen.getByText('Uploading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('Uploading...')).not.toBeInTheDocument();
    });
  });
});
