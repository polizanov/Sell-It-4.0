import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { CreateProductFAB } from '../../src/components/common/CreateProductFAB';
import { useAuthStore } from '../../src/store/authStore';

// Mock useNavigate from react-router
const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock useAuthStore
vi.mock('../../src/store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

const renderFAB = () => {
  return render(
    <MemoryRouter>
      <CreateProductFAB />
    </MemoryRouter>,
  );
};

describe('CreateProductFAB', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  describe('Visibility based on user state', () => {
    it('renders FAB for authenticated and verified users', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        isAuthenticated: true,
        user: {
          id: '1',
          name: 'Test User',
          username: 'testuser',
          email: 'test@example.com',
          isVerified: true,
        },
        token: 'mock-jwt-token',
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        setUser: vi.fn(),
        initializeAuth: vi.fn(),
      });

      renderFAB();

      const fabButton = screen.getByRole('button', {
        name: /create new product listing/i,
      });
      expect(fabButton).toBeInTheDocument();
    });

    it('hides FAB for unverified users (isVerified: false)', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        isAuthenticated: true,
        user: {
          id: '1',
          name: 'Test User',
          username: 'testuser',
          email: 'test@example.com',
          isVerified: false,
        },
        token: 'mock-jwt-token',
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        setUser: vi.fn(),
        initializeAuth: vi.fn(),
      });

      const { container } = renderFAB();

      const fabButton = screen.queryByRole('button', {
        name: /create new product listing/i,
      });
      expect(fabButton).not.toBeInTheDocument();
      expect(container.firstChild).toBeNull();
    });

    it('hides FAB for unauthenticated users', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        setUser: vi.fn(),
        initializeAuth: vi.fn(),
      });

      const { container } = renderFAB();

      const fabButton = screen.queryByRole('button', {
        name: /create new product listing/i,
      });
      expect(fabButton).not.toBeInTheDocument();
      expect(container.firstChild).toBeNull();
    });

    it('renders FAB when user is null but isAuthenticated is true (edge case)', () => {
      // Note: The component checks user?.isVerified === false specifically
      // When user is null, this evaluates to undefined === false, which is false
      // So the FAB will render when isAuthenticated is true, even if user is null
      vi.mocked(useAuthStore).mockReturnValue({
        isAuthenticated: true,
        user: null,
        token: 'mock-jwt-token',
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        setUser: vi.fn(),
        initializeAuth: vi.fn(),
      });

      renderFAB();

      const fabButton = screen.queryByRole('button', {
        name: /create new product listing/i,
      });
      // FAB should render because user?.isVerified is undefined, not false
      expect(fabButton).toBeInTheDocument();
    });
  });

  describe('Modal interaction', () => {
    beforeEach(() => {
      vi.mocked(useAuthStore).mockReturnValue({
        isAuthenticated: true,
        user: {
          id: '1',
          name: 'Test User',
          username: 'testuser',
          email: 'test@example.com',
          isVerified: true,
        },
        token: 'mock-jwt-token',
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        setUser: vi.fn(),
        initializeAuth: vi.fn(),
      });
    });

    it('clicking FAB opens modal', async () => {
      const user = userEvent.setup();
      renderFAB();

      const fabButton = screen.getByRole('button', {
        name: /create new product listing/i,
      });

      // Modal should not be visible initially
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      // Click FAB to open modal
      await user.click(fabButton);

      // Modal should now be visible
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('modal displays CreateProductForm with "Add New Product" title', async () => {
      const user = userEvent.setup();
      renderFAB();

      const fabButton = screen.getByRole('button', {
        name: /create new product listing/i,
      });
      await user.click(fabButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Verify modal title
      expect(screen.getByText('Add New Product')).toBeInTheDocument();

      // Verify form fields are present
      expect(screen.getByLabelText(/product title/i)).toBeInTheDocument();
      // Description field doesn't have a proper htmlFor link, so we check by text
      expect(screen.getByText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/price/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/condition/i)).toBeInTheDocument();
      expect(screen.getByText(/product images/i)).toBeInTheDocument();
    });

    it('modal closes on cancel button click', async () => {
      const user = userEvent.setup();
      renderFAB();

      const fabButton = screen.getByRole('button', {
        name: /create new product listing/i,
      });
      await user.click(fabButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Click cancel button in the form
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Modal should be closed
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('modal closes on backdrop click', async () => {
      const user = userEvent.setup();
      renderFAB();

      const fabButton = screen.getByRole('button', {
        name: /create new product listing/i,
      });
      await user.click(fabButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Click the backdrop (the modal's parent container)
      // The backdrop has the onClick handler on the outer div
      const modalContainer = screen.getByRole('dialog').parentElement;
      if (modalContainer) {
        await user.click(modalContainer);
      }

      // Modal should be closed
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('modal closes on Escape key press', async () => {
      const user = userEvent.setup();
      renderFAB();

      const fabButton = screen.getByRole('button', {
        name: /create new product listing/i,
      });
      await user.click(fabButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Press Escape key
      await user.keyboard('{Escape}');

      // Modal should be closed
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('modal closes on X button click', async () => {
      const user = userEvent.setup();
      renderFAB();

      const fabButton = screen.getByRole('button', {
        name: /create new product listing/i,
      });
      await user.click(fabButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Click the close (X) button in modal header
      const closeButton = screen.getByRole('button', { name: /close modal/i });
      await user.click(closeButton);

      // Modal should be closed
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('FAB styling and animations', () => {
    beforeEach(() => {
      vi.mocked(useAuthStore).mockReturnValue({
        isAuthenticated: true,
        user: {
          id: '1',
          name: 'Test User',
          username: 'testuser',
          email: 'test@example.com',
          isVerified: true,
        },
        token: 'mock-jwt-token',
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        setUser: vi.fn(),
        initializeAuth: vi.fn(),
      });
    });

    it('FAB has gradient background styling', () => {
      renderFAB();

      const fabButton = screen.getByRole('button', {
        name: /create new product listing/i,
      });

      expect(fabButton.className).toContain('bg-gradient-cta');
      expect(fabButton.className).toContain('shadow-fab');
    });

    it('FAB has hover animation classes', () => {
      renderFAB();

      const fabButton = screen.getByRole('button', {
        name: /create new product listing/i,
      });

      // Verify hover classes are present
      expect(fabButton.className).toContain('hover:shadow-fab-hover');
      expect(fabButton.className).toContain('hover:scale-110');
      expect(fabButton.className).toContain('transition-all');
      expect(fabButton.className).toContain('duration-300');
    });

    it('FAB icon has rotation animation class', () => {
      const { container } = renderFAB();

      // The SVG icon should have rotation animation on hover
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
      // SVG className is a string, not an array
      expect(icon?.getAttribute('class')).toContain('group-hover:rotate-45');
      expect(icon?.getAttribute('class')).toContain('transition-transform');
    });

    it('FAB is positioned as fixed at bottom-left', () => {
      renderFAB();

      const fabButton = screen.getByRole('button', {
        name: /create new product listing/i,
      });

      expect(fabButton.className).toContain('fixed');
      expect(fabButton.className).toContain('bottom-8');
      expect(fabButton.className).toContain('left-8');
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      vi.mocked(useAuthStore).mockReturnValue({
        isAuthenticated: true,
        user: {
          id: '1',
          name: 'Test User',
          username: 'testuser',
          email: 'test@example.com',
          isVerified: true,
        },
        token: 'mock-jwt-token',
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        setUser: vi.fn(),
        initializeAuth: vi.fn(),
      });
    });

    it('FAB has proper ARIA labels', () => {
      renderFAB();

      const fabButton = screen.getByRole('button', {
        name: /create new product listing/i,
      });

      expect(fabButton).toHaveAttribute('aria-label', 'Create new product listing');
      expect(fabButton).toHaveAttribute('aria-haspopup', 'dialog');
      expect(fabButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('FAB updates aria-expanded when modal is opened', async () => {
      const user = userEvent.setup();
      renderFAB();

      const fabButton = screen.getByRole('button', {
        name: /create new product listing/i,
      });

      expect(fabButton).toHaveAttribute('aria-expanded', 'false');

      await user.click(fabButton);

      await waitFor(() => {
        expect(fabButton).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('FAB has focus ring visible on focus', () => {
      renderFAB();

      const fabButton = screen.getByRole('button', {
        name: /create new product listing/i,
      });

      // Verify focus ring classes
      expect(fabButton.className).toContain('focus:outline-none');
      expect(fabButton.className).toContain('focus:ring-4');
      expect(fabButton.className).toContain('focus:ring-orange');
      expect(fabButton.className).toContain('focus:ring-offset-4');
    });

    it('modal has proper ARIA attributes', async () => {
      const user = userEvent.setup();
      renderFAB();

      const fabButton = screen.getByRole('button', {
        name: /create new product listing/i,
      });
      await user.click(fabButton);

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(dialog).toHaveAttribute('aria-labelledby', 'create-product-modal-title');
      });
    });

    it('modal title is properly linked via aria-labelledby', async () => {
      const user = userEvent.setup();
      renderFAB();

      const fabButton = screen.getByRole('button', {
        name: /create new product listing/i,
      });
      await user.click(fabButton);

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        const titleId = dialog.getAttribute('aria-labelledby');
        expect(titleId).toBe('create-product-modal-title');

        const title = screen.getByText('Add New Product');
        expect(title).toHaveAttribute('id', 'create-product-modal-title');
      });
    });
  });

  describe('Modal white background styling', () => {
    beforeEach(() => {
      vi.mocked(useAuthStore).mockReturnValue({
        isAuthenticated: true,
        user: {
          id: '1',
          name: 'Test User',
          username: 'testuser',
          email: 'test@example.com',
          isVerified: true,
        },
        token: 'mock-jwt-token',
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        setUser: vi.fn(),
        initializeAuth: vi.fn(),
      });
    });

    it('modal has orange gradient frame with white card inside', async () => {
      const user = userEvent.setup();
      const { container } = renderFAB();

      const fabButton = screen.getByRole('button', {
        name: /create new product listing/i,
      });
      await user.click(fabButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Verify outer gradient frame
      const dialog = screen.getByRole('dialog');
      expect(dialog.className).toContain('bg-gradient-cta');

      // Verify inner white card (with responsive classes)
      const whiteCard = container.querySelector('.bg-white');
      expect(whiteCard).toBeTruthy();
      expect(whiteCard?.className).toContain('bg-white');
    });
  });
});
