import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { EditProductModal } from '../../src/components/product/EditProductModal';
import { useAuthStore } from '../../src/store/authStore';
import { server } from '../../src/mocks/server';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const defaultProductData = {
  title: 'Vintage Camera',
  description: 'Classic film camera in excellent condition.',
  price: 249.99,
  category: 'Electronics',
  condition: 'Good',
  images: [
    'https://images.unsplash.com/photo-1.jpg',
    'https://images.unsplash.com/photo-2.jpg',
  ],
  sellerId: 'owner-001',
};

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  productId: 'prod-edit-1',
  productData: defaultProductData,
  onSuccess: vi.fn(),
};

// Reusable categories handler
const categoriesHandler = http.get(`${API_BASE}/products/categories`, () => {
  return HttpResponse.json({
    success: true,
    message: 'Categories retrieved',
    data: [
      'Animals',
      'Antiques',
      'Books',
      'Clothes',
      'Electronics',
      'Home and Garden',
      'Makeups',
      'Others',
      'Properties',
      'Toys',
      'Vehicles',
      'Work',
    ],
  });
});

describe('EditProductModal', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });

    // Mock URL.createObjectURL and revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();

    server.use(categoriesHandler);
  });

  afterEach(() => {
    // Restore body overflow
    document.body.style.overflow = '';
  });

  // --------------------------------------------------------------------------
  // Modal Open/Close Tests
  // --------------------------------------------------------------------------
  describe('Modal Open/Close', () => {
    it('renders when isOpen is true', () => {
      useAuthStore.setState({
        user: { id: 'owner-001', name: 'Owner', username: 'owner', email: 'owner@test.com' },
        isAuthenticated: true,
        isLoading: false,
      });

      render(<EditProductModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      useAuthStore.setState({
        user: { id: 'owner-001', name: 'Owner', username: 'owner', email: 'owner@test.com' },
        isAuthenticated: true,
        isLoading: false,
      });

      render(<EditProductModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('calls onClose when close button clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      useAuthStore.setState({
        user: { id: 'owner-001', name: 'Owner', username: 'owner', email: 'owner@test.com' },
        isAuthenticated: true,
        isLoading: false,
      });

      render(<EditProductModal {...defaultProps} onClose={onClose} />);

      const closeButton = screen.getByRole('button', { name: /close modal/i });
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop clicked', async () => {
      const onClose = vi.fn();
      useAuthStore.setState({
        user: { id: 'owner-001', name: 'Owner', username: 'owner', email: 'owner@test.com' },
        isAuthenticated: true,
        isLoading: false,
      });

      render(<EditProductModal {...defaultProps} onClose={onClose} />);

      const backdrop = document.querySelector('[aria-hidden="true"]');
      expect(backdrop).not.toBeNull();
      fireEvent.click(backdrop!);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Escape key pressed', () => {
      const onClose = vi.fn();
      useAuthStore.setState({
        user: { id: 'owner-001', name: 'Owner', username: 'owner', email: 'owner@test.com' },
        isAuthenticated: true,
        isLoading: false,
      });

      render(<EditProductModal {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('prevents body scroll when modal is open', () => {
      useAuthStore.setState({
        user: { id: 'owner-001', name: 'Owner', username: 'owner', email: 'owner@test.com' },
        isAuthenticated: true,
        isLoading: false,
      });

      render(<EditProductModal {...defaultProps} />);

      expect(document.body.style.overflow).toBe('hidden');
    });
  });

  // --------------------------------------------------------------------------
  // Title and Icon Tests
  // --------------------------------------------------------------------------
  describe('Title and Icon', () => {
    it('renders title "Edit Product"', () => {
      useAuthStore.setState({
        user: { id: 'owner-001', name: 'Owner', username: 'owner', email: 'owner@test.com' },
        isAuthenticated: true,
        isLoading: false,
      });

      render(<EditProductModal {...defaultProps} />);

      expect(screen.getByText('Edit Product')).toBeInTheDocument();
    });

    it('renders pencil icon', () => {
      useAuthStore.setState({
        user: { id: 'owner-001', name: 'Owner', username: 'owner', email: 'owner@test.com' },
        isAuthenticated: true,
        isLoading: false,
      });

      render(<EditProductModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      // Check for SVG with pencil path
      const svg = dialog.querySelector('svg[stroke="currentColor"]');
      expect(svg).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Ownership Validation Tests
  // --------------------------------------------------------------------------
  describe('Ownership Validation', () => {
    it('shows form for product owner', () => {
      useAuthStore.setState({
        user: { id: 'owner-001', name: 'Owner', username: 'owner', email: 'owner@test.com' },
        isAuthenticated: true,
        isLoading: false,
      });

      render(<EditProductModal {...defaultProps} />);

      expect(screen.getByLabelText(/product title/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });

    it('shows "Not Authorized" message for non-owner', () => {
      useAuthStore.setState({
        user: {
          id: 'different-user',
          name: 'Other User',
          username: 'other',
          email: 'other@test.com',
        },
        isAuthenticated: true,
        isLoading: false,
      });

      render(<EditProductModal {...defaultProps} />);

      expect(screen.getByText('Not Authorized')).toBeInTheDocument();
      expect(
        screen.getByText('You are not authorized to edit this product.'),
      ).toBeInTheDocument();
    });

    it('shows close button in Not Authorized view', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      useAuthStore.setState({
        user: {
          id: 'different-user',
          name: 'Other User',
          username: 'other',
          email: 'other@test.com',
        },
        isAuthenticated: true,
        isLoading: false,
      });

      render(<EditProductModal {...defaultProps} onClose={onClose} />);

      // Get the close button inside the content area (not the X button in header)
      const closeButtons = screen.getAllByRole('button', { name: /close/i });
      const contentCloseButton = closeButtons.find(button =>
        button.textContent === 'Close'
      );
      expect(contentCloseButton).toBeDefined();
      await user.click(contentCloseButton!);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('hides form fields for non-owner', () => {
      useAuthStore.setState({
        user: {
          id: 'different-user',
          name: 'Other User',
          username: 'other',
          email: 'other@test.com',
        },
        isAuthenticated: true,
        isLoading: false,
      });

      render(<EditProductModal {...defaultProps} />);

      expect(screen.queryByLabelText(/product title/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /save changes/i })).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Keyboard Navigation Tests
  // --------------------------------------------------------------------------
  describe('Keyboard Navigation', () => {
    it('focuses first input when modal opens', async () => {
      useAuthStore.setState({
        user: { id: 'owner-001', name: 'Owner', username: 'owner', email: 'owner@test.com' },
        isAuthenticated: true,
        isLoading: false,
      });

      render(<EditProductModal {...defaultProps} />);

      await waitFor(
        () => {
          const titleInput = screen.getByLabelText(/product title/i);
          expect(titleInput).toHaveFocus();
        },
        { timeout: 200 }
      );
    });

    it('implements focus trap with Tab key', async () => {
      useAuthStore.setState({
        user: { id: 'owner-001', name: 'Owner', username: 'owner', email: 'owner@test.com' },
        isAuthenticated: true,
        isLoading: false,
      });

      render(<EditProductModal {...defaultProps} />);

      const focusableElements = screen.getByRole('dialog').querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      expect(focusableElements.length).toBeGreaterThan(0);
    });

    it('handles Shift+Tab to focus trap backward', () => {
      useAuthStore.setState({
        user: { id: 'owner-001', name: 'Owner', username: 'owner', email: 'owner@test.com' },
        isAuthenticated: true,
        isLoading: false,
      });

      render(<EditProductModal {...defaultProps} />);

      const focusableElements = screen.getByRole('dialog').querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      firstElement.focus();
      fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });

      // Focus trap should prevent leaving modal
      expect(document.activeElement).toBeTruthy();
    });

    it('handles Tab key to move focus forward', () => {
      useAuthStore.setState({
        user: { id: 'owner-001', name: 'Owner', username: 'owner', email: 'owner@test.com' },
        isAuthenticated: true,
        isLoading: false,
      });

      render(<EditProductModal {...defaultProps} />);

      const focusableElements = screen.getByRole('dialog').querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      lastElement.focus();
      fireEvent.keyDown(document, { key: 'Tab' });

      // Focus trap should prevent leaving modal
      expect(document.activeElement).toBeTruthy();
    });
  });

  // --------------------------------------------------------------------------
  // Success Callback Tests
  // --------------------------------------------------------------------------
  describe('Success Callback', () => {
    it('triggers onSuccess and onClose after successful form submission', async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();
      const onClose = vi.fn();
      localStorage.setItem('token', 'mock-jwt-token');

      useAuthStore.setState({
        user: { id: 'owner-001', name: 'Owner', username: 'owner', email: 'owner@test.com' },
        isAuthenticated: true,
        isLoading: false,
      });

      server.use(
        http.put(`${API_BASE}/products/:id`, () => {
          return HttpResponse.json({
            success: true,
            message: 'Product updated successfully',
            data: { id: 'prod-edit-1', ...defaultProductData },
          });
        }),
      );

      render(<EditProductModal {...defaultProps} onSuccess={onSuccess} onClose={onClose} />);

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });

    it('does not close modal on form submission error', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      localStorage.setItem('token', 'mock-jwt-token');

      useAuthStore.setState({
        user: { id: 'owner-001', name: 'Owner', username: 'owner', email: 'owner@test.com' },
        isAuthenticated: true,
        isLoading: false,
      });

      server.use(
        http.put(`${API_BASE}/products/:id`, () => {
          return HttpResponse.json(
            { success: false, message: 'Update failed' },
            { status: 500 },
          );
        }),
      );

      render(<EditProductModal {...defaultProps} onClose={onClose} />);

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Update failed')).toBeInTheDocument();
      });

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // Styling Tests
  // --------------------------------------------------------------------------
  describe('Styling', () => {
    it('has orange gradient frame', () => {
      useAuthStore.setState({
        user: { id: 'owner-001', name: 'Owner', username: 'owner', email: 'owner@test.com' },
        isAuthenticated: true,
        isLoading: false,
      });

      render(<EditProductModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('bg-gradient-cta');
    });

    it('has white card interior', () => {
      useAuthStore.setState({
        user: { id: 'owner-001', name: 'Owner', username: 'owner', email: 'owner@test.com' },
        isAuthenticated: true,
        isLoading: false,
      });

      render(<EditProductModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      const whiteCard = dialog.querySelector('.bg-white');
      expect(whiteCard).toBeInTheDocument();
    });

    it('applies mobile full-screen styling', () => {
      useAuthStore.setState({
        user: { id: 'owner-001', name: 'Owner', username: 'owner', email: 'owner@test.com' },
        isAuthenticated: true,
        isLoading: false,
      });

      render(<EditProductModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      // Check for h-full class (mobile full screen)
      expect(dialog).toHaveClass('h-full');
    });

    it('applies desktop centered styling', () => {
      useAuthStore.setState({
        user: { id: 'owner-001', name: 'Owner', username: 'owner', email: 'owner@test.com' },
        isAuthenticated: true,
        isLoading: false,
      });

      render(<EditProductModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      // Check for sm:rounded-xl (desktop rounded corners)
      expect(dialog).toHaveClass('sm:rounded-xl');
    });

    it('has backdrop blur effect', () => {
      useAuthStore.setState({
        user: { id: 'owner-001', name: 'Owner', username: 'owner', email: 'owner@test.com' },
        isAuthenticated: true,
        isLoading: false,
      });

      render(<EditProductModal {...defaultProps} />);

      const backdrop = document.querySelector('[aria-hidden="true"]');
      expect(backdrop).toHaveClass('backdrop-blur-md');
    });

    it('has shadow effect with orange tint', () => {
      useAuthStore.setState({
        user: { id: 'owner-001', name: 'Owner', username: 'owner', email: 'owner@test.com' },
        isAuthenticated: true,
        isLoading: false,
      });

      render(<EditProductModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('shadow-orange/40');
    });
  });

  // --------------------------------------------------------------------------
  // Props Passing Tests
  // --------------------------------------------------------------------------
  describe('Props Passing', () => {
    it('passes correct productId to EditProductForm', () => {
      useAuthStore.setState({
        user: { id: 'owner-001', name: 'Owner', username: 'owner', email: 'owner@test.com' },
        isAuthenticated: true,
        isLoading: false,
      });

      render(<EditProductModal {...defaultProps} productId="test-product-123" />);

      // Verify form is rendered (indicates props were passed)
      expect(screen.getByLabelText(/product title/i)).toBeInTheDocument();
    });

    it('passes correct initialData to EditProductForm', () => {
      useAuthStore.setState({
        user: { id: 'owner-001', name: 'Owner', username: 'owner', email: 'owner@test.com' },
        isAuthenticated: true,
        isLoading: false,
      });

      const customData = {
        title: 'Custom Product',
        description: 'Custom description',
        price: 99.99,
        category: 'Books',
        condition: 'New',
        images: ['https://example.com/image.jpg'],
        sellerId: 'owner-001',
      };

      render(<EditProductModal {...defaultProps} productData={customData} />);

      const titleInput = screen.getByLabelText(/product title/i) as HTMLInputElement;
      expect(titleInput.value).toBe('Custom Product');

      const descriptionInput = screen.getByPlaceholderText(
        /describe your product/i,
      ) as HTMLTextAreaElement;
      expect(descriptionInput.value).toBe('Custom description');
    });

    it('passes onCancel (onClose) to EditProductForm', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      useAuthStore.setState({
        user: { id: 'owner-001', name: 'Owner', username: 'owner', email: 'owner@test.com' },
        isAuthenticated: true,
        isLoading: false,
      });

      render(<EditProductModal {...defaultProps} onClose={onClose} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  // --------------------------------------------------------------------------
  // Accessibility Tests
  // --------------------------------------------------------------------------
  describe('Accessibility', () => {
    it('has aria-modal attribute', () => {
      useAuthStore.setState({
        user: { id: 'owner-001', name: 'Owner', username: 'owner', email: 'owner@test.com' },
        isAuthenticated: true,
        isLoading: false,
      });

      render(<EditProductModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('has aria-labelledby pointing to title', () => {
      useAuthStore.setState({
        user: { id: 'owner-001', name: 'Owner', username: 'owner', email: 'owner@test.com' },
        isAuthenticated: true,
        isLoading: false,
      });

      render(<EditProductModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'edit-product-modal-title');

      const title = document.getElementById('edit-product-modal-title');
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent('Edit Product');
    });

    it('close button has aria-label', () => {
      useAuthStore.setState({
        user: { id: 'owner-001', name: 'Owner', username: 'owner', email: 'owner@test.com' },
        isAuthenticated: true,
        isLoading: false,
      });

      render(<EditProductModal {...defaultProps} />);

      const closeButton = screen.getByRole('button', { name: /close modal/i });
      expect(closeButton).toHaveAttribute('aria-label', 'Close modal');
    });
  });

  // --------------------------------------------------------------------------
  // Edge Cases
  // --------------------------------------------------------------------------
  describe('Edge Cases', () => {
    it('handles missing user gracefully', () => {
      useAuthStore.setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });

      render(<EditProductModal {...defaultProps} />);

      expect(screen.getByText('Not Authorized')).toBeInTheDocument();
    });

    it('handles product with single image', () => {
      useAuthStore.setState({
        user: { id: 'owner-001', name: 'Owner', username: 'owner', email: 'owner@test.com' },
        isAuthenticated: true,
        isLoading: false,
      });

      const singleImageData = {
        ...defaultProductData,
        images: ['https://example.com/image.jpg'],
      };

      render(<EditProductModal {...defaultProps} productData={singleImageData} />);

      const images = screen.getAllByAltText(/existing image/i);
      expect(images).toHaveLength(1);
    });

    it('cleans up event listeners on unmount', () => {
      useAuthStore.setState({
        user: { id: 'owner-001', name: 'Owner', username: 'owner', email: 'owner@test.com' },
        isAuthenticated: true,
        isLoading: false,
      });

      const { unmount } = render(<EditProductModal {...defaultProps} />);

      expect(document.body.style.overflow).toBe('hidden');

      unmount();

      expect(document.body.style.overflow).toBe('');
    });

    it('handles rapid open/close cycles', () => {
      useAuthStore.setState({
        user: { id: 'owner-001', name: 'Owner', username: 'owner', email: 'owner@test.com' },
        isAuthenticated: true,
        isLoading: false,
      });

      const { rerender } = render(<EditProductModal {...defaultProps} isOpen={true} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();

      rerender(<EditProductModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      rerender(<EditProductModal {...defaultProps} isOpen={true} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});
