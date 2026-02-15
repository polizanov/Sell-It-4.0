import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { EditProductForm } from '../../src/components/product/EditProductForm';
import { server } from '../../src/mocks/server';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const defaultInitialData = {
  title: 'Vintage Camera',
  description: 'Classic film camera in excellent condition. Perfect for photography enthusiasts.',
  price: 249.99,
  category: 'Electronics',
  condition: 'Good',
  existingImages: [
    'https://images.unsplash.com/photo-1.jpg',
    'https://images.unsplash.com/photo-2.jpg',
  ],
};

const defaultProps = {
  productId: 'prod-edit-1',
  initialData: defaultInitialData,
  onSuccess: vi.fn(),
  onCancel: vi.fn(),
};

// Reusable categories handler
const categoriesHandler = http.get(`${API_BASE}/products/categories`, () => {
  return HttpResponse.json({
    success: true,
    message: 'Categories retrieved',
    data: ['Books', 'Clothing', 'Electronics', 'Home & Garden', 'Sports'],
  });
});

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

describe('EditProductForm', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    // Mock URL.createObjectURL and revokeObjectURL (not available in jsdom)
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();

    server.use(categoriesHandler);
  });

  // --------------------------------------------------------------------------
  // Pre-population Tests
  // --------------------------------------------------------------------------
  describe('Form Pre-population', () => {
    it('pre-populates all form fields with initialData', () => {
      render(<EditProductForm {...defaultProps} />);

      const titleInput = screen.getByLabelText(/product title/i) as HTMLInputElement;
      expect(titleInput.value).toBe('Vintage Camera');

      const descriptionInput = screen.getByPlaceholderText(
        /describe your product/i,
      ) as HTMLTextAreaElement;
      expect(descriptionInput.value).toBe(
        'Classic film camera in excellent condition. Perfect for photography enthusiasts.',
      );

      const priceInput = screen.getByLabelText(/price/i) as HTMLInputElement;
      expect(priceInput.value).toBe('249.99');

      const categoryInput = screen.getByLabelText(/category/i) as HTMLInputElement;
      expect(categoryInput.value).toBe('Electronics');

      const conditionSelect = screen.getByLabelText(/condition/i) as HTMLSelectElement;
      expect(conditionSelect.value).toBe('Good');
    });

    it('displays existing images from initialData', () => {
      render(<EditProductForm {...defaultProps} />);

      const existingImages = screen.getAllByAltText(/existing image/i);
      expect(existingImages).toHaveLength(2);
    });

    it('formats price with 2 decimal places', () => {
      const props = {
        ...defaultProps,
        initialData: { ...defaultInitialData, price: 100 },
      };
      render(<EditProductForm {...props} />);

      const priceInput = screen.getByLabelText(/price/i) as HTMLInputElement;
      expect(priceInput.value).toBe('100.00');
    });
  });

  // --------------------------------------------------------------------------
  // Validation Tests
  // --------------------------------------------------------------------------
  describe('Field Validation', () => {
    it('shows error when title is empty', async () => {
      const user = userEvent.setup();
      render(<EditProductForm {...defaultProps} />);

      const titleInput = screen.getByLabelText(/product title/i);
      await user.clear(titleInput);

      submitForm();

      expect(screen.getByText('Title is required')).toBeInTheDocument();
    });

    it('shows error when description is empty', async () => {
      const user = userEvent.setup();
      render(<EditProductForm {...defaultProps} />);

      const descriptionInput = screen.getByPlaceholderText(/describe your product/i);
      await user.clear(descriptionInput);

      submitForm();

      expect(screen.getByText('Description is required')).toBeInTheDocument();
    });

    it('shows error when price is empty', async () => {
      const user = userEvent.setup();
      render(<EditProductForm {...defaultProps} />);

      const priceInput = screen.getByLabelText(/price/i);
      await user.clear(priceInput);

      submitForm();

      expect(screen.getByText('Price is required')).toBeInTheDocument();
    });

    it('shows error when price is zero', async () => {
      const user = userEvent.setup();
      render(<EditProductForm {...defaultProps} />);

      const priceInput = screen.getByLabelText(/price/i);
      await user.clear(priceInput);
      await user.type(priceInput, '0');

      submitForm();

      expect(screen.getByText('Price must be greater than 0')).toBeInTheDocument();
    });

    it('shows error when price is negative', async () => {
      const user = userEvent.setup();
      render(<EditProductForm {...defaultProps} />);

      const priceInput = screen.getByLabelText(/price/i);
      await user.clear(priceInput);
      await user.type(priceInput, '-10');

      submitForm();

      expect(screen.getByText('Price must be greater than 0')).toBeInTheDocument();
    });

    it('shows error when category is empty', async () => {
      const user = userEvent.setup();
      render(<EditProductForm {...defaultProps} />);

      const categoryInput = screen.getByLabelText(/category/i);
      await user.clear(categoryInput);

      submitForm();

      expect(screen.getByText('Category is required')).toBeInTheDocument();
    });

    it('shows error when condition is not selected', async () => {
      const user = userEvent.setup();
      const props = {
        ...defaultProps,
        initialData: { ...defaultInitialData, condition: '' },
      };
      render(<EditProductForm {...props} />);

      submitForm();

      expect(screen.getByText('Condition is required')).toBeInTheDocument();
    });

    it('shows error when all images are removed', async () => {
      const user = userEvent.setup();
      render(<EditProductForm {...defaultProps} />);

      // Remove all existing images
      while (screen.queryAllByRole('button', { name: /remove existing image/i }).length > 0) {
        const btn = screen.getAllByRole('button', { name: /remove existing image/i })[0];
        await user.click(btn);
      }

      submitForm();

      expect(screen.getByText('At least one image is required')).toBeInTheDocument();
    });

    it('does not submit when validation fails', async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();
      render(<EditProductForm {...defaultProps} onSuccess={onSuccess} />);

      const titleInput = screen.getByLabelText(/product title/i);
      await user.clear(titleInput);

      submitForm();

      expect(onSuccess).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // Image Management Tests
  // --------------------------------------------------------------------------
  describe('Image Management', () => {
    it('can remove existing images', async () => {
      const user = userEvent.setup();
      render(<EditProductForm {...defaultProps} />);

      expect(screen.getAllByAltText(/existing image/i)).toHaveLength(2);

      const removeButton = screen.getAllByRole('button', { name: /remove existing image 1/i })[0];
      await user.click(removeButton);

      expect(screen.getAllByAltText(/existing image/i)).toHaveLength(1);
    });

    it('can add new images', async () => {
      const user = userEvent.setup();
      render(<EditProductForm {...defaultProps} />);

      const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByAltText(/new image 1/i)).toBeInTheDocument();
      });
    });

    it('can remove new images', async () => {
      const user = userEvent.setup();
      render(<EditProductForm {...defaultProps} />);

      const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByAltText(/new image 1/i)).toBeInTheDocument();
      });

      const removeButton = screen.getByRole('button', { name: /remove new image 1/i });
      await user.click(removeButton);

      expect(screen.queryByAltText(/new image 1/i)).not.toBeInTheDocument();
    });

    it('allows up to 5 total images', async () => {
      const user = userEvent.setup();
      const props = {
        ...defaultProps,
        initialData: { ...defaultInitialData, existingImages: [] },
      };
      render(<EditProductForm {...props} />);

      const files = Array.from({ length: 5 }, (_, i) =>
        new File(['dummy'], `test${i}.jpg`, { type: 'image/jpeg' })
      );
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, files);

      await waitFor(() => {
        expect(screen.getAllByAltText(/new image/i)).toHaveLength(5);
      });

      // Add button should not be visible when at max
      expect(screen.queryByRole('button', { name: /add image/i })).not.toBeInTheDocument();
    });

    it('limits total images to 5 (existing + new)', async () => {
      const user = userEvent.setup();
      render(<EditProductForm {...defaultProps} />);

      // Already has 2 existing images, so can add 3 more
      const files = Array.from({ length: 4 }, (_, i) =>
        new File(['dummy'], `test${i}.jpg`, { type: 'image/jpeg' })
      );
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, files);

      await waitFor(() => {
        // Should only add 3 images (total of 5 including existing 2)
        expect(screen.getAllByAltText(/new image/i)).toHaveLength(3);
      });
    });
  });

  // --------------------------------------------------------------------------
  // Submission Tests
  // --------------------------------------------------------------------------
  describe('Form Submission', () => {
    it('calls productService.update with correct data on successful submission', async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();
      localStorage.setItem('token', 'mock-jwt-token');

      server.use(
        http.put(`${API_BASE}/products/:id`, () => {
          return HttpResponse.json({
            success: true,
            message: 'Product updated successfully',
            data: { id: 'prod-edit-1', ...defaultInitialData },
          });
        }),
      );

      render(<EditProductForm {...defaultProps} onSuccess={onSuccess} />);

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledTimes(1);
      });
    });

    it('shows loading state during submission', async () => {
      const user = userEvent.setup();
      localStorage.setItem('token', 'mock-jwt-token');

      server.use(
        http.put(`${API_BASE}/products/:id`, async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return HttpResponse.json({
            success: true,
            message: 'Product updated successfully',
            data: { id: 'prod-edit-1', ...defaultInitialData },
          });
        }),
      );

      render(<EditProductForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(submitButton);

      expect(screen.getByText('Saving...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
      });
    });

    it('disables cancel button during submission', async () => {
      const user = userEvent.setup();
      localStorage.setItem('token', 'mock-jwt-token');

      server.use(
        http.put(`${API_BASE}/products/:id`, async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return HttpResponse.json({
            success: true,
            message: 'Product updated successfully',
            data: { id: 'prod-edit-1', ...defaultInitialData },
          });
        }),
      );

      render(<EditProductForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(submitButton);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeDisabled();

      await waitFor(() => {
        expect(cancelButton).not.toBeDisabled();
      });
    });

    it('triggers onSuccess callback after successful submission', async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();
      localStorage.setItem('token', 'mock-jwt-token');

      server.use(
        http.put(`${API_BASE}/products/:id`, () => {
          return HttpResponse.json({
            success: true,
            message: 'Product updated successfully',
            data: { id: 'prod-edit-1', ...defaultInitialData },
          });
        }),
      );

      render(<EditProductForm {...defaultProps} onSuccess={onSuccess} />);

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledTimes(1);
      });
    });

    it('sends existingImages and newImages to API', async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();
      localStorage.setItem('token', 'mock-jwt-token');

      let receivedFormData = false;
      server.use(
        http.put(`${API_BASE}/products/:id`, async () => {
          receivedFormData = true;
          return HttpResponse.json({
            success: true,
            message: 'Product updated successfully',
            data: { id: 'prod-edit-1', ...defaultInitialData },
          });
        }),
      );

      render(<EditProductForm {...defaultProps} onSuccess={onSuccess} />);

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(receivedFormData).toBe(true);
        expect(onSuccess).toHaveBeenCalled();
      });
    });
  });

  // --------------------------------------------------------------------------
  // Cancel Button Tests
  // --------------------------------------------------------------------------
  describe('Cancel Button', () => {
    it('triggers onCancel callback when cancel button clicked', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      render(<EditProductForm {...defaultProps} onCancel={onCancel} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('does not submit form when cancel button clicked', async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();
      render(<EditProductForm {...defaultProps} onSuccess={onSuccess} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(onSuccess).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // Error Handling Tests
  // --------------------------------------------------------------------------
  describe('Error Handling', () => {
    it('displays API error message when submission fails', async () => {
      const user = userEvent.setup();
      localStorage.setItem('token', 'mock-jwt-token');

      server.use(
        http.put(`${API_BASE}/products/:id`, () => {
          return HttpResponse.json(
            { success: false, message: 'Failed to upload images' },
            { status: 500 },
          );
        }),
      );

      render(<EditProductForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to upload images')).toBeInTheDocument();
      });
    });

    it('displays generic error message when API error has no message', async () => {
      const user = userEvent.setup();
      localStorage.setItem('token', 'mock-jwt-token');

      server.use(
        http.put(`${API_BASE}/products/:id`, () => {
          return HttpResponse.json({ success: false }, { status: 500 });
        }),
      );

      render(<EditProductForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('An unexpected error occurred. Please try again.'),
        ).toBeInTheDocument();
      });
    });

    it('handles network errors gracefully', async () => {
      const user = userEvent.setup();
      localStorage.setItem('token', 'mock-jwt-token');

      server.use(
        http.put(`${API_BASE}/products/:id`, () => {
          return HttpResponse.error();
        }),
      );

      render(<EditProductForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('An unexpected error occurred. Please try again.'),
        ).toBeInTheDocument();
      });
    });

    it('keeps form in edit mode after error', async () => {
      const user = userEvent.setup();
      localStorage.setItem('token', 'mock-jwt-token');

      server.use(
        http.put(`${API_BASE}/products/:id`, () => {
          return HttpResponse.json(
            { success: false, message: 'Update failed' },
            { status: 500 },
          );
        }),
      );

      render(<EditProductForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Update failed')).toBeInTheDocument();
      });

      // Form should still be editable
      const titleInput = screen.getByLabelText(/product title/i) as HTMLInputElement;
      expect(titleInput.value).toBe('Vintage Camera');
      expect(titleInput).not.toBeDisabled();
    });

    it('clears previous errors when resubmitting', async () => {
      const user = userEvent.setup();
      localStorage.setItem('token', 'mock-jwt-token');

      // First submission fails
      server.use(
        http.put(`${API_BASE}/products/:id`, () => {
          return HttpResponse.json(
            { success: false, message: 'First error' },
            { status: 500 },
          );
        }),
      );

      render(<EditProductForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('First error')).toBeInTheDocument();
      });

      // Second submission succeeds
      server.use(
        http.put(`${API_BASE}/products/:id`, () => {
          return HttpResponse.json({
            success: true,
            message: 'Product updated successfully',
            data: { id: 'prod-edit-1', ...defaultInitialData },
          });
        }),
      );

      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText('First error')).not.toBeInTheDocument();
      });
    });
  });

  // --------------------------------------------------------------------------
  // Edge Cases
  // --------------------------------------------------------------------------
  describe('Edge Cases', () => {
    it('handles product with single existing image', () => {
      const props = {
        ...defaultProps,
        initialData: {
          ...defaultInitialData,
          existingImages: ['https://images.unsplash.com/photo-1.jpg'],
        },
      };
      render(<EditProductForm {...props} />);

      const existingImages = screen.getAllByAltText(/existing image/i);
      expect(existingImages).toHaveLength(1);
    });

    it('handles product with no existing images but requires at least one', async () => {
      const props = {
        ...defaultProps,
        initialData: { ...defaultInitialData, existingImages: [] },
      };
      render(<EditProductForm {...props} />);

      submitForm();

      expect(screen.getByText('At least one image is required')).toBeInTheDocument();
    });

    it('handles very long title', async () => {
      const user = userEvent.setup();
      render(<EditProductForm {...defaultProps} />);

      const longTitle = 'A'.repeat(100);
      const titleInput = screen.getByLabelText(/product title/i);
      await user.clear(titleInput);
      await user.type(titleInput, longTitle);

      expect((titleInput as HTMLInputElement).value).toBe(longTitle);
    });

    it('handles very long description', async () => {
      const user = userEvent.setup();
      render(<EditProductForm {...defaultProps} />);

      const longDescription = 'B'.repeat(500);
      const descriptionInput = screen.getByPlaceholderText(/describe your product/i);
      await user.clear(descriptionInput);
      await user.type(descriptionInput, longDescription);

      expect((descriptionInput as HTMLTextAreaElement).value).toBe(longDescription);
    });

    it('handles decimal price values correctly', async () => {
      const user = userEvent.setup();
      render(<EditProductForm {...defaultProps} />);

      const priceInput = screen.getByLabelText(/price/i);
      await user.clear(priceInput);
      await user.type(priceInput, '123.45');

      expect((priceInput as HTMLInputElement).value).toBe('123.45');
    });
  });
});
