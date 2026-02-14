import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router';
import { http, HttpResponse } from 'msw';
import EditProduct from '../../src/pages/EditProduct';
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

const productData = {
  id: 'prod-edit-1',
  title: 'Vintage Camera',
  description: 'Classic film camera in excellent condition. Perfect for photography enthusiasts.',
  price: 249.99,
  images: [
    'https://images.unsplash.com/photo-1.jpg',
    'https://images.unsplash.com/photo-2.jpg',
  ],
  category: 'Electronics',
  condition: 'Good',
  seller: { _id: 'owner-001', name: 'John Smith', username: 'johnsmith' },
  createdAt: '2024-01-15T10:30:00.000Z',
};

const renderEditProduct = (id: string = 'prod-edit-1') => {
  return render(
    <MemoryRouter initialEntries={[`/products/${id}/edit`]}>
      <Routes>
        <Route path="/products/:id/edit" element={<EditProduct />} />
        <Route path="/products/:id" element={<div>Product Detail Page</div>} />
        <Route path="/products" element={<div>All Products Page</div>} />
      </Routes>
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

// Reusable categories handler — must be registered before products/:id
// to prevent the parameterized route from intercepting /products/categories.
const categoriesHandler = http.get(`${API_BASE}/products/categories`, () => {
  return HttpResponse.json({
    success: true,
    message: 'Categories retrieved',
    data: ['Books', 'Clothing', 'Electronics', 'Home & Garden', 'Sports'],
  });
});

const productGetHandler = http.get(`${API_BASE}/products/:id`, () => {
  return HttpResponse.json({
    success: true,
    message: 'Product retrieved successfully',
    data: productData,
  });
});

describe('EditProduct Page', () => {
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
  });

  it('renders form pre-filled with product data', async () => {
    useAuthStore.setState({
      user: {
        id: 'owner-001',
        name: 'John Smith',
        username: 'johnsmith',
        email: 'john@test.com',
      },
      isAuthenticated: true,
      isLoading: false,
    });

    server.use(categoriesHandler, productGetHandler);

    renderEditProduct();

    await waitFor(() => {
      expect(screen.getByText('Edit Product')).toBeInTheDocument();
    });

    // Verify form fields are pre-filled
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

  it('shows "Not Authorized" for non-owner', async () => {
    useAuthStore.setState({
      user: {
        id: 'different-user',
        name: 'Other User',
        username: 'otheruser',
        email: 'other@test.com',
      },
      isAuthenticated: true,
      isLoading: false,
    });

    server.use(categoriesHandler, productGetHandler);

    renderEditProduct();

    await waitFor(() => {
      expect(screen.getByText('Not Authorized')).toBeInTheDocument();
    });

    expect(
      screen.getByText('You are not authorized to edit this product.'),
    ).toBeInTheDocument();
  });

  it('shows "Product Not Found" for missing product', async () => {
    useAuthStore.setState({
      user: {
        id: 'owner-001',
        name: 'John Smith',
        username: 'johnsmith',
        email: 'john@test.com',
      },
      isAuthenticated: true,
      isLoading: false,
    });

    server.use(
      categoriesHandler,
      http.get(`${API_BASE}/products/:id`, () => {
        return HttpResponse.json(
          { success: false, message: 'Product not found' },
          { status: 404 },
        );
      }),
    );

    renderEditProduct('000000000000000000000000');

    await waitFor(() => {
      expect(screen.getByText('Product Not Found')).toBeInTheDocument();
    });

    expect(
      screen.getByText("Sorry, the product you're looking for doesn't exist."),
    ).toBeInTheDocument();
  });

  it('validates required fields (shows error for empty images)', async () => {
    const user = userEvent.setup();
    useAuthStore.setState({
      user: {
        id: 'owner-001',
        name: 'John Smith',
        username: 'johnsmith',
        email: 'john@test.com',
      },
      isAuthenticated: true,
      isLoading: false,
    });

    server.use(categoriesHandler, productGetHandler);

    renderEditProduct();

    await waitFor(() => {
      expect(screen.getByText('Edit Product')).toBeInTheDocument();
    });

    // Clear the title field
    const titleInput = screen.getByLabelText(/product title/i);
    await user.clear(titleInput);

    // Remove existing images by clicking remove buttons one at a time
    // (the DOM updates after each click, so we re-query each time)
    while (screen.queryAllByRole('button', { name: /remove existing image/i }).length > 0) {
      const btn = screen.getAllByRole('button', { name: /remove existing image/i })[0];
      await user.click(btn);
    }

    submitForm();

    expect(screen.getByText('Title is required')).toBeInTheDocument();
    expect(screen.getByText('At least one image is required')).toBeInTheDocument();
  });

  it('shows "Saving..." text during submission', async () => {
    const user = userEvent.setup();
    useAuthStore.setState({
      user: {
        id: 'owner-001',
        name: 'John Smith',
        username: 'johnsmith',
        email: 'john@test.com',
      },
      isAuthenticated: true,
      isLoading: false,
    });
    localStorage.setItem('token', 'mock-jwt-token');

    server.use(
      categoriesHandler,
      productGetHandler,
      http.put(`${API_BASE}/products/:id`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json({
          success: true,
          message: 'Product updated successfully',
          data: { ...productData, title: 'Updated Camera' },
        });
      }),
    );

    renderEditProduct();

    await waitFor(() => {
      expect(screen.getByText('Edit Product')).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(submitButton);

    expect(screen.getByText('Saving...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
    });
  });

  it('successful submit navigates to product detail', async () => {
    const user = userEvent.setup();
    useAuthStore.setState({
      user: {
        id: 'owner-001',
        name: 'John Smith',
        username: 'johnsmith',
        email: 'john@test.com',
      },
      isAuthenticated: true,
      isLoading: false,
    });
    localStorage.setItem('token', 'mock-jwt-token');

    server.use(
      categoriesHandler,
      productGetHandler,
      http.put(`${API_BASE}/products/:id`, () => {
        return HttpResponse.json({
          success: true,
          message: 'Product updated successfully',
          data: { ...productData, title: 'Updated Camera' },
        });
      }),
    );

    renderEditProduct();

    await waitFor(() => {
      expect(screen.getByText('Edit Product')).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/products/prod-edit-1');
    });
  });

  it('failed submit shows error message', async () => {
    const user = userEvent.setup();
    useAuthStore.setState({
      user: {
        id: 'owner-001',
        name: 'John Smith',
        username: 'johnsmith',
        email: 'john@test.com',
      },
      isAuthenticated: true,
      isLoading: false,
    });
    localStorage.setItem('token', 'mock-jwt-token');

    server.use(
      categoriesHandler,
      productGetHandler,
      http.put(`${API_BASE}/products/:id`, () => {
        return HttpResponse.json(
          { success: false, message: 'Failed to upload images' },
          { status: 500 },
        );
      }),
    );

    renderEditProduct();

    await waitFor(() => {
      expect(screen.getByText('Edit Product')).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to upload images')).toBeInTheDocument();
    });
  });

  it('displays existing images from product', async () => {
    useAuthStore.setState({
      user: {
        id: 'owner-001',
        name: 'John Smith',
        username: 'johnsmith',
        email: 'john@test.com',
      },
      isAuthenticated: true,
      isLoading: false,
    });

    server.use(categoriesHandler, productGetHandler);

    renderEditProduct();

    await waitFor(() => {
      expect(screen.getByText('Edit Product')).toBeInTheDocument();
    });

    // Verify that existing images are displayed (2 images in productData)
    const existingImages = screen.getAllByAltText(/existing image/i);
    expect(existingImages).toHaveLength(2);
  });

  it('cancel button links to product detail page', async () => {
    useAuthStore.setState({
      user: {
        id: 'owner-001',
        name: 'John Smith',
        username: 'johnsmith',
        email: 'john@test.com',
      },
      isAuthenticated: true,
      isLoading: false,
    });

    server.use(categoriesHandler, productGetHandler);

    renderEditProduct();

    await waitFor(() => {
      expect(screen.getByText('Edit Product')).toBeInTheDocument();
    });

    const cancelLink = screen.getByRole('link', { name: /cancel/i });
    expect(cancelLink).toBeInTheDocument();
    expect(cancelLink).toHaveAttribute('href', '/products/prod-edit-1');
  });
});
