import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { http, HttpResponse } from 'msw';
import CreateProduct from '../../src/pages/CreateProduct';
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

const renderCreateProduct = () => {
  return render(
    <MemoryRouter initialEntries={['/create-product']}>
      <CreateProduct />
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

describe('CreateProduct Page', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
    mockNavigate.mockClear();

    // Mock URL.createObjectURL and revokeObjectURL (not available in jsdom)
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();

    // CategoryAutocomplete calls getCategories on mount; provide a default handler
    server.use(
      http.get(`${API_BASE}/products/categories`, () => {
        return HttpResponse.json({
          success: true,
          message: 'Categories retrieved',
          data: ['Books', 'Clothing', 'Electronics', 'Home & Garden', 'Sports'],
        });
      }),
    );
  });

  it('renders form with all fields: title, description, price, category, condition, image upload area, submit button', async () => {
    renderCreateProduct();

    expect(screen.getByLabelText(/product title/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/describe your product/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/condition/i)).toBeInTheDocument();
    expect(screen.getByText(/product images/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create product/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty required fields on submit', async () => {
    renderCreateProduct();

    submitForm();

    expect(screen.getByText('Title is required')).toBeInTheDocument();
    expect(screen.getByText('Description is required')).toBeInTheDocument();
    expect(screen.getByText('Price is required')).toBeInTheDocument();
    expect(screen.getByText('Category is required')).toBeInTheDocument();
    expect(screen.getByText('Condition is required')).toBeInTheDocument();
    expect(screen.getByText('At least one image is required')).toBeInTheDocument();
  });

  it('shows "Title is required" when submitting without title', async () => {
    const user = userEvent.setup();
    renderCreateProduct();

    // Fill all fields except title
    const descriptionInput = screen.getByPlaceholderText(/describe your product/i);
    await user.type(descriptionInput, 'A test description');

    const priceInput = screen.getByLabelText(/price/i);
    await user.type(priceInput, '25.00');

    const categoryInput = screen.getByLabelText(/category/i);
    await user.type(categoryInput, 'Electronics');

    const conditionSelect = screen.getByLabelText(/condition/i);
    await user.selectOptions(conditionSelect, 'New');

    submitForm();

    expect(screen.getByText('Title is required')).toBeInTheDocument();
  });

  it('shows "Description is required" when submitting without description', async () => {
    const user = userEvent.setup();
    renderCreateProduct();

    const titleInput = screen.getByLabelText(/product title/i);
    await user.type(titleInput, 'Test Product');

    const priceInput = screen.getByLabelText(/price/i);
    await user.type(priceInput, '25.00');

    const categoryInput = screen.getByLabelText(/category/i);
    await user.type(categoryInput, 'Electronics');

    const conditionSelect = screen.getByLabelText(/condition/i);
    await user.selectOptions(conditionSelect, 'New');

    submitForm();

    expect(screen.getByText('Description is required')).toBeInTheDocument();
  });

  it('shows "Price is required" when submitting without price', async () => {
    const user = userEvent.setup();
    renderCreateProduct();

    const titleInput = screen.getByLabelText(/product title/i);
    await user.type(titleInput, 'Test Product');

    const descriptionInput = screen.getByPlaceholderText(/describe your product/i);
    await user.type(descriptionInput, 'A test description');

    const categoryInput = screen.getByLabelText(/category/i);
    await user.type(categoryInput, 'Electronics');

    const conditionSelect = screen.getByLabelText(/condition/i);
    await user.selectOptions(conditionSelect, 'New');

    submitForm();

    expect(screen.getByText('Price is required')).toBeInTheDocument();
  });

  it('shows "Category is required" when submitting without category', async () => {
    const user = userEvent.setup();
    renderCreateProduct();

    const titleInput = screen.getByLabelText(/product title/i);
    await user.type(titleInput, 'Test Product');

    const descriptionInput = screen.getByPlaceholderText(/describe your product/i);
    await user.type(descriptionInput, 'A test description');

    const priceInput = screen.getByLabelText(/price/i);
    await user.type(priceInput, '25.00');

    const conditionSelect = screen.getByLabelText(/condition/i);
    await user.selectOptions(conditionSelect, 'New');

    submitForm();

    expect(screen.getByText('Category is required')).toBeInTheDocument();
  });

  it('shows "Condition is required" when submitting without condition', async () => {
    const user = userEvent.setup();
    renderCreateProduct();

    const titleInput = screen.getByLabelText(/product title/i);
    await user.type(titleInput, 'Test Product');

    const descriptionInput = screen.getByPlaceholderText(/describe your product/i);
    await user.type(descriptionInput, 'A test description');

    const priceInput = screen.getByLabelText(/price/i);
    await user.type(priceInput, '25.00');

    const categoryInput = screen.getByLabelText(/category/i);
    await user.type(categoryInput, 'Electronics');

    submitForm();

    expect(screen.getByText('Condition is required')).toBeInTheDocument();
  });

  it('shows "At least one image is required" when submitting without images', async () => {
    const user = userEvent.setup();
    renderCreateProduct();

    const titleInput = screen.getByLabelText(/product title/i);
    await user.type(titleInput, 'Test Product');

    const descriptionInput = screen.getByPlaceholderText(/describe your product/i);
    await user.type(descriptionInput, 'A test description');

    const priceInput = screen.getByLabelText(/price/i);
    await user.type(priceInput, '25.00');

    const categoryInput = screen.getByLabelText(/category/i);
    await user.type(categoryInput, 'Electronics');

    const conditionSelect = screen.getByLabelText(/condition/i);
    await user.selectOptions(conditionSelect, 'New');

    submitForm();

    expect(screen.getByText('At least one image is required')).toBeInTheDocument();
  });

  it('shows "Creating..." while submitting (loading state)', async () => {
    const user = userEvent.setup();
    localStorage.setItem('token', 'mock-jwt-token');

    // Use a delayed response to observe the loading state
    server.use(
      http.post(`${API_BASE}/products`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json(
          {
            success: true,
            message: 'Product created successfully',
            data: {
              id: '1',
              title: 'Test Product',
              description: 'A test description',
              price: 25.0,
              images: ['https://picsum.photos/seed/mock1/400/300'],
              category: 'Electronics',
              condition: 'New',
              seller: { _id: '1', name: 'Test User' },
              createdAt: new Date().toISOString(),
            },
          },
          { status: 201 },
        );
      }),
    );

    const { container } = renderCreateProduct();

    const titleInput = screen.getByLabelText(/product title/i);
    await user.type(titleInput, 'Test Product');

    const descriptionInput = screen.getByPlaceholderText(/describe your product/i);
    await user.type(descriptionInput, 'A test description');

    const priceInput = screen.getByLabelText(/price/i);
    await user.type(priceInput, '25.00');

    const categoryInput = screen.getByLabelText(/category/i);
    await user.type(categoryInput, 'Electronics');

    const conditionSelect = screen.getByLabelText(/condition/i);
    await user.selectOptions(conditionSelect, 'New');

    // Add an image file via the hidden file input
    const file = new File(['image-data'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    const submitButton = screen.getByRole('button', { name: /create product/i });
    await user.click(submitButton);

    expect(screen.getByText('Creating...')).toBeInTheDocument();

    // Wait for the request to complete
    await waitFor(() => {
      expect(screen.queryByText('Creating...')).not.toBeInTheDocument();
    });
  });

  it('successful submission navigates to product detail page', async () => {
    const user = userEvent.setup();
    localStorage.setItem('token', 'mock-jwt-token');

    server.use(
      http.post(`${API_BASE}/products`, async () => {
        return HttpResponse.json(
          {
            success: true,
            message: 'Product created successfully',
            data: {
              id: '42',
              title: 'Vintage Camera',
              description: 'A beautiful vintage camera',
              price: 49.99,
              images: ['https://picsum.photos/seed/mock1/400/300'],
              category: 'Electronics',
              condition: 'Good',
              seller: { _id: '1', name: 'Test User' },
              createdAt: new Date().toISOString(),
            },
          },
          { status: 201 },
        );
      }),
    );

    const { container } = renderCreateProduct();

    const titleInput = screen.getByLabelText(/product title/i);
    await user.type(titleInput, 'Vintage Camera');

    const descriptionInput = screen.getByPlaceholderText(/describe your product/i);
    await user.type(descriptionInput, 'A beautiful vintage camera');

    const priceInput = screen.getByLabelText(/price/i);
    await user.type(priceInput, '49.99');

    const categoryInput = screen.getByLabelText(/category/i);
    await user.type(categoryInput, 'Electronics');

    const conditionSelect = screen.getByLabelText(/condition/i);
    await user.selectOptions(conditionSelect, 'Good');

    // Add an image file via the hidden file input
    const file = new File(['image-data'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    const submitButton = screen.getByRole('button', { name: /create product/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/products/42');
    });
  });

  it('failed submission (server error) shows error message in form', async () => {
    const user = userEvent.setup();
    localStorage.setItem('token', 'mock-jwt-token');

    server.use(
      http.post(`${API_BASE}/products`, () => {
        return HttpResponse.json(
          { success: false, message: 'Failed to upload images' },
          { status: 500 },
        );
      }),
    );

    const { container } = renderCreateProduct();

    const titleInput = screen.getByLabelText(/product title/i);
    await user.type(titleInput, 'Test Product');

    const descriptionInput = screen.getByPlaceholderText(/describe your product/i);
    await user.type(descriptionInput, 'A test description');

    const priceInput = screen.getByLabelText(/price/i);
    await user.type(priceInput, '25.00');

    const categoryInput = screen.getByLabelText(/category/i);
    await user.type(categoryInput, 'Electronics');

    const conditionSelect = screen.getByLabelText(/condition/i);
    await user.selectOptions(conditionSelect, 'New');

    // Add an image file via the hidden file input
    const file = new File(['image-data'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    const submitButton = screen.getByRole('button', { name: /create product/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to upload images')).toBeInTheDocument();
    });
  });

  it('cancel button links to /profile', () => {
    renderCreateProduct();

    const cancelLink = screen.getByRole('link', { name: /cancel/i });
    expect(cancelLink).toBeInTheDocument();
    expect(cancelLink).toHaveAttribute('href', '/profile');
  });
});
