import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router';
import { http, HttpResponse } from 'msw';
import ProductDetail from '../../src/pages/ProductDetail';
import { server } from '../../src/mocks/server';
import { useAuthStore } from '../../src/store/authStore';
import { useFavouritesStore } from '../../src/store/favouritesStore';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Reusable categories handler for edit modal
const categoriesHandler = http.get(`${API_BASE}/products/categories`, () => {
  return HttpResponse.json({
    success: true,
    message: 'Categories retrieved',
    data: ['Books', 'Clothing', 'Electronics', 'Home & Garden', 'Sports'],
  });
});

/**
 * Renders ProductDetail inside a MemoryRouter configured with the /products/:id route.
 * @param id - The product ID to place in the URL
 */
const renderProductDetail = (id: string) => {
  return render(
    <MemoryRouter initialEntries={[`/products/${id}`]}>
      <Routes>
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/products" element={<div>All Products Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
};

describe('ProductDetail Page', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
    useFavouritesStore.setState({ favouriteIds: new Set<string>(), isLoaded: false });

    // Mock URL.createObjectURL and revokeObjectURL for image handling in modal
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('renders product details after successful fetch', async () => {
    server.use(
      http.get(`${API_BASE}/products/:id`, () => {
        return HttpResponse.json({
          success: true,
          message: 'Product retrieved successfully',
          data: {
            id: '507f1f77bcf86cd799439011',
            title: 'Vintage Camera',
            description:
              'Classic film camera in excellent condition. Perfect for photography enthusiasts.',
            price: 249.99,
            images: [
              'https://images.unsplash.com/photo-1.jpg',
              'https://images.unsplash.com/photo-2.jpg',
            ],
            category: 'Electronics',
            condition: 'Good',
            seller: { _id: 'seller-001', name: 'John Smith', username: 'johnsmith' },
            createdAt: '2024-01-15T10:30:00.000Z',
          },
        });
      }),
    );

    renderProductDetail('507f1f77bcf86cd799439011');

    // Wait for the product title to appear (indicates loading finished)
    await waitFor(() => {
      expect(screen.getByText('Vintage Camera')).toBeInTheDocument();
    });

    // Verify price
    expect(screen.getByText('$249.99')).toBeInTheDocument();

    // Verify description
    expect(
      screen.getByText(
        'Classic film camera in excellent condition. Perfect for photography enthusiasts.',
      ),
    ).toBeInTheDocument();

    // Verify category (appears in badges and in the details section)
    const categoryElements = screen.getAllByText('Electronics');
    expect(categoryElements.length).toBeGreaterThanOrEqual(1);

    // Verify condition (appears in badges and in the details section)
    const conditionElements = screen.getAllByText('Good');
    expect(conditionElements.length).toBeGreaterThanOrEqual(1);

    // Verify seller name
    expect(screen.getByText('John Smith')).toBeInTheDocument();
  });

  it('shows "Product Not Found" when API returns 404', async () => {
    // Use the special not-found ID that the MSW handler recognizes
    renderProductDetail('000000000000000000000000');

    await waitFor(() => {
      expect(screen.getByText('Product Not Found')).toBeInTheDocument();
    });

    expect(
      screen.getByText("Sorry, the product you're looking for doesn't exist."),
    ).toBeInTheDocument();

    // Verify the "Back to Products" button is present
    expect(screen.getByText('Back to Products')).toBeInTheDocument();
  });

  it('shows error message when API returns 500', async () => {
    server.use(
      http.get(`${API_BASE}/products/:id`, () => {
        return HttpResponse.json(
          { success: false, message: 'Internal server error' },
          { status: 500 },
        );
      }),
    );

    renderProductDetail('some-id');

    await waitFor(() => {
      expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
    });

    expect(screen.getByText('Internal server error')).toBeInTheDocument();
  });

  it('"Back to Products" link navigates to /products', async () => {
    // Use the 404 path so we get the "not found" UI with the back link
    renderProductDetail('000000000000000000000000');

    await waitFor(() => {
      expect(screen.getByText('Product Not Found')).toBeInTheDocument();
    });

    // The "Back to Products" text is inside a Link > Button
    const backLink = screen.getByText('Back to Products').closest('a');
    expect(backLink).toHaveAttribute('href', '/products');
  });

  it('Contact Seller button links to seller profile', async () => {
    server.use(
      http.get(`${API_BASE}/products/:id`, () => {
        return HttpResponse.json({
          success: true,
          message: 'Product retrieved successfully',
          data: {
            id: '507f1f77bcf86cd799439011',
            title: 'Test Product',
            description: 'A test product for contact seller test.',
            price: 99.99,
            images: ['https://images.unsplash.com/photo-1.jpg'],
            category: 'Electronics',
            condition: 'New',
            seller: { _id: 'seller-001', name: 'John Smith', username: 'johnsmith' },
            createdAt: '2024-01-15T10:30:00.000Z',
          },
        });
      }),
    );

    renderProductDetail('507f1f77bcf86cd799439011');

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    const contactButton = screen.getByText('Contact Seller');
    const link = contactButton.closest('a');
    expect(link).toHaveAttribute('href', '/profile/johnsmith');
  });

  // --------------------------------------------------------------------------
  // Edit Product Modal Tests
  // --------------------------------------------------------------------------
  describe('Edit Product Modal', () => {
    const editProductData = {
      id: '507f1f77bcf86cd799439011',
      title: 'Test Edit Button Product',
      description: 'A product to test the edit button visibility.',
      price: 149.99,
      images: ['https://images.unsplash.com/photo-1.jpg'],
      category: 'Electronics',
      condition: 'Good',
      seller: { _id: 'seller-001', name: 'John Smith', username: 'johnsmith' },
      createdAt: '2024-01-15T10:30:00.000Z',
    };

    beforeEach(() => {
      server.use(
        categoriesHandler,
        http.get(`${API_BASE}/products/:id`, () => {
          return HttpResponse.json({
            success: true,
            message: 'Product retrieved successfully',
            data: editProductData,
          });
        }),
      );
    });

    it('shows edit button for product owner', async () => {
      useAuthStore.setState({
        user: {
          id: 'seller-001',
          name: 'John Smith',
          username: 'johnsmith',
          email: 'john@test.com',
        },
        isAuthenticated: true,
        isLoading: false,
      });

      renderProductDetail('507f1f77bcf86cd799439011');

      await waitFor(() => {
        expect(screen.getByText('Test Edit Button Product')).toBeInTheDocument();
      });

      const editButton = screen.getByLabelText('Edit product');
      expect(editButton).toBeInTheDocument();
    });

    it('hides edit button for non-owner', async () => {
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

      renderProductDetail('507f1f77bcf86cd799439011');

      await waitFor(() => {
        expect(screen.getByText('Test Edit Button Product')).toBeInTheDocument();
      });

      expect(screen.queryByLabelText('Edit product')).not.toBeInTheDocument();
    });

    it('hides edit button for unauthenticated user', async () => {
      renderProductDetail('507f1f77bcf86cd799439011');

      await waitFor(() => {
        expect(screen.getByText('Test Edit Button Product')).toBeInTheDocument();
      });

      expect(screen.queryByLabelText('Edit product')).not.toBeInTheDocument();
    });

    it('opens modal when edit button clicked', async () => {
      const user = userEvent.setup();
      useAuthStore.setState({
        user: {
          id: 'seller-001',
          name: 'John Smith',
          username: 'johnsmith',
          email: 'john@test.com',
        },
        isAuthenticated: true,
        isLoading: false,
      });

      renderProductDetail('507f1f77bcf86cd799439011');

      await waitFor(() => {
        expect(screen.getByText('Test Edit Button Product')).toBeInTheDocument();
      });

      const editButton = screen.getByLabelText('Edit product');
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Edit Product')).toBeInTheDocument();
      });
    });

    it('modal receives correct product data', async () => {
      const user = userEvent.setup();
      useAuthStore.setState({
        user: {
          id: 'seller-001',
          name: 'John Smith',
          username: 'johnsmith',
          email: 'john@test.com',
        },
        isAuthenticated: true,
        isLoading: false,
      });

      renderProductDetail('507f1f77bcf86cd799439011');

      await waitFor(() => {
        expect(screen.getByText('Test Edit Button Product')).toBeInTheDocument();
      });

      const editButton = screen.getByLabelText('Edit product');
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Verify form is pre-populated with product data
      const titleInput = screen.getByLabelText(/product title/i) as HTMLInputElement;
      expect(titleInput.value).toBe('Test Edit Button Product');

      const descriptionInput = screen.getByPlaceholderText(
        /describe your product/i,
      ) as HTMLTextAreaElement;
      expect(descriptionInput.value).toBe('A product to test the edit button visibility.');

      const priceInput = screen.getByLabelText(/price/i) as HTMLInputElement;
      expect(priceInput.value).toBe('149.99');
    });

    it('closes modal when cancel clicked', async () => {
      const user = userEvent.setup();
      useAuthStore.setState({
        user: {
          id: 'seller-001',
          name: 'John Smith',
          username: 'johnsmith',
          email: 'john@test.com',
        },
        isAuthenticated: true,
        isLoading: false,
      });

      renderProductDetail('507f1f77bcf86cd799439011');

      await waitFor(() => {
        expect(screen.getByText('Test Edit Button Product')).toBeInTheDocument();
      });

      const editButton = screen.getByLabelText('Edit product');
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('refreshes product after successful edit', async () => {
      const user = userEvent.setup();
      localStorage.setItem('token', 'mock-jwt-token');

      useAuthStore.setState({
        user: {
          id: 'seller-001',
          name: 'John Smith',
          username: 'johnsmith',
          email: 'john@test.com',
        },
        isAuthenticated: true,
        isLoading: false,
      });

      let fetchCount = 0;
      server.use(
        categoriesHandler,
        http.get(`${API_BASE}/products/:id`, () => {
          fetchCount++;
          return HttpResponse.json({
            success: true,
            message: 'Product retrieved successfully',
            data: {
              ...editProductData,
              title: fetchCount === 1 ? 'Test Edit Button Product' : 'Updated Product Title',
            },
          });
        }),
        http.put(`${API_BASE}/products/:id`, () => {
          return HttpResponse.json({
            success: true,
            message: 'Product updated successfully',
            data: { ...editProductData, title: 'Updated Product Title' },
          });
        }),
      );

      renderProductDetail('507f1f77bcf86cd799439011');

      await waitFor(() => {
        expect(screen.getByText('Test Edit Button Product')).toBeInTheDocument();
      });

      const editButton = screen.getByLabelText('Edit product');
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      }, { timeout: 3000 });

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Product should be refreshed with new data
      await waitFor(() => {
        expect(screen.getByText('Updated Product Title')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('closes modal and refreshes on successful edit', async () => {
      const user = userEvent.setup();
      localStorage.setItem('token', 'mock-jwt-token');

      useAuthStore.setState({
        user: {
          id: 'seller-001',
          name: 'John Smith',
          username: 'johnsmith',
          email: 'john@test.com',
        },
        isAuthenticated: true,
        isLoading: false,
      });

      server.use(
        http.put(`${API_BASE}/products/:id`, () => {
          return HttpResponse.json({
            success: true,
            message: 'Product updated successfully',
            data: editProductData,
          });
        }),
      );

      renderProductDetail('507f1f77bcf86cd799439011');

      await waitFor(() => {
        expect(screen.getByText('Test Edit Button Product')).toBeInTheDocument();
      });

      const editButton = screen.getByLabelText('Edit product');
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  // --------------------------------------------------------------------------
  // Favourite Button Tests
  // --------------------------------------------------------------------------
  describe('Favourite button', () => {
    const productData = {
      id: '507f1f77bcf86cd799439011',
      title: 'Test Favourite Product',
      description: 'A product to test the favourite button visibility.',
      price: 149.99,
      images: ['https://images.unsplash.com/photo-1.jpg'],
      category: 'Electronics',
      condition: 'Good',
      seller: { _id: 'seller-001', name: 'John Smith', username: 'johnsmith' },
      createdAt: '2024-01-15T10:30:00.000Z',
    };

    beforeEach(() => {
      server.use(
        http.get(`${API_BASE}/products/:id`, () => {
          return HttpResponse.json({
            success: true,
            message: 'Product retrieved successfully',
            data: productData,
          });
        }),
      );
    });

    it('shows heart button for authenticated non-owner user', async () => {
      useAuthStore.setState({
        user: {
          id: 'user-123',
          name: 'Test User',
          username: 'testuser',
          email: 'test@test.com',
        },
        isAuthenticated: true,
        isLoading: false,
      });
      useFavouritesStore.setState({ favouriteIds: new Set<string>(), isLoaded: true });

      renderProductDetail('507f1f77bcf86cd799439011');

      await waitFor(() => {
        expect(screen.getByText('Test Favourite Product')).toBeInTheDocument();
      });

      const heartButton = screen.getByRole('button', { name: /favourites/i });
      expect(heartButton).toBeInTheDocument();
    });

    it('does NOT show heart button for unauthenticated user', async () => {
      // Auth store is already cleared in beforeEach

      renderProductDetail('507f1f77bcf86cd799439011');

      await waitFor(() => {
        expect(screen.getByText('Test Favourite Product')).toBeInTheDocument();
      });

      const heartButton = screen.queryByRole('button', { name: /favourites/i });
      expect(heartButton).not.toBeInTheDocument();
    });

    it('does NOT show heart button for product owner', async () => {
      // Set user ID to match the seller._id
      useAuthStore.setState({
        user: {
          id: 'seller-001',
          name: 'John Smith',
          username: 'johnsmith',
          email: 'john@test.com',
        },
        isAuthenticated: true,
        isLoading: false,
      });

      renderProductDetail('507f1f77bcf86cd799439011');

      await waitFor(() => {
        expect(screen.getByText('Test Favourite Product')).toBeInTheDocument();
      });

      const heartButton = screen.queryByRole('button', { name: /favourites/i });
      expect(heartButton).not.toBeInTheDocument();
    });

    it('shows filled heart when product is in favourites', async () => {
      useAuthStore.setState({
        user: {
          id: 'user-123',
          name: 'Test User',
          username: 'testuser',
          email: 'test@test.com',
        },
        isAuthenticated: true,
        isLoading: false,
      });
      useFavouritesStore.setState({
        favouriteIds: new Set(['507f1f77bcf86cd799439011']),
        isLoaded: true,
      });

      renderProductDetail('507f1f77bcf86cd799439011');

      await waitFor(() => {
        expect(screen.getByText('Test Favourite Product')).toBeInTheDocument();
      });

      const heartButton = screen.getByRole('button', { name: /remove from favourites/i });
      expect(heartButton).toBeInTheDocument();
    });

    it('shows outline heart when product is not in favourites', async () => {
      useAuthStore.setState({
        user: {
          id: 'user-123',
          name: 'Test User',
          username: 'testuser',
          email: 'test@test.com',
        },
        isAuthenticated: true,
        isLoading: false,
      });
      useFavouritesStore.setState({
        favouriteIds: new Set<string>(),
        isLoaded: true,
      });

      renderProductDetail('507f1f77bcf86cd799439011');

      await waitFor(() => {
        expect(screen.getByText('Test Favourite Product')).toBeInTheDocument();
      });

      const heartButton = screen.getByRole('button', { name: /add to favourites/i });
      expect(heartButton).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Delete Product Tests
  // --------------------------------------------------------------------------
  describe('Delete Product', () => {
    const deleteProductData = {
      id: '507f1f77bcf86cd799439011',
      title: 'Product To Delete',
      description: 'A product to test delete functionality.',
      price: 99.99,
      images: ['https://images.unsplash.com/photo-1.jpg'],
      category: 'Electronics',
      condition: 'Good',
      seller: { _id: 'owner-001', name: 'Product Owner', username: 'productowner' },
      createdAt: '2024-01-15T10:30:00.000Z',
    };

    beforeEach(() => {
      server.use(
        http.get(`${API_BASE}/products/:id`, () => {
          return HttpResponse.json({
            success: true,
            message: 'Product retrieved successfully',
            data: deleteProductData,
          });
        }),
      );
    });

    it('shows delete button for product owner', async () => {
      useAuthStore.setState({
        user: {
          id: 'owner-001',
          name: 'Product Owner',
          username: 'productowner',
          email: 'owner@test.com',
        },
        isAuthenticated: true,
        isLoading: false,
      });

      renderProductDetail('507f1f77bcf86cd799439011');

      await waitFor(() => {
        expect(screen.getByText('Product To Delete')).toBeInTheDocument();
      });

      expect(screen.getByLabelText('Delete product')).toBeInTheDocument();
    });

    it('does NOT show delete button for non-owner', async () => {
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

      renderProductDetail('507f1f77bcf86cd799439011');

      await waitFor(() => {
        expect(screen.getByText('Product To Delete')).toBeInTheDocument();
      });

      expect(screen.queryByLabelText('Delete product')).not.toBeInTheDocument();
    });

    it('does NOT show delete button for unauthenticated user', async () => {
      renderProductDetail('507f1f77bcf86cd799439011');

      await waitFor(() => {
        expect(screen.getByText('Product To Delete')).toBeInTheDocument();
      });

      expect(screen.queryByLabelText('Delete product')).not.toBeInTheDocument();
    });

    it('clicking delete button shows confirmation dialog with product title', async () => {
      useAuthStore.setState({
        user: {
          id: 'owner-001',
          name: 'Product Owner',
          username: 'productowner',
          email: 'owner@test.com',
        },
        isAuthenticated: true,
        isLoading: false,
      });

      renderProductDetail('507f1f77bcf86cd799439011');

      await waitFor(() => {
        expect(screen.getByText('Product To Delete')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText('Delete product'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // The dialog message should contain the product title
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveTextContent('Product To Delete');
    });

    it('clicking Cancel closes dialog without deleting', async () => {
      useAuthStore.setState({
        user: {
          id: 'owner-001',
          name: 'Product Owner',
          username: 'productowner',
          email: 'owner@test.com',
        },
        isAuthenticated: true,
        isLoading: false,
      });

      renderProductDetail('507f1f77bcf86cd799439011');

      await waitFor(() => {
        expect(screen.getByText('Product To Delete')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText('Delete product'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Cancel'));

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('clicking Delete calls API and navigates to /products', async () => {
      useAuthStore.setState({
        user: {
          id: 'owner-001',
          name: 'Product Owner',
          username: 'productowner',
          email: 'owner@test.com',
        },
        token: 'mock-jwt-token',
        isAuthenticated: true,
        isLoading: false,
      });

      server.use(
        http.delete(`${API_BASE}/products/:id`, () => {
          return HttpResponse.json({ success: true, message: 'Product deleted successfully' });
        }),
      );

      renderProductDetail('507f1f77bcf86cd799439011');

      await waitFor(() => {
        expect(screen.getByText('Product To Delete')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText('Delete product'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Click the Delete button inside the dialog
      const dialogDeleteButton = screen.getByRole('dialog').querySelector('button:last-child');
      fireEvent.click(dialogDeleteButton!);

      await waitFor(() => {
        expect(screen.getByText('All Products Page')).toBeInTheDocument();
      });
    });

    it('shows error when delete API fails', async () => {
      useAuthStore.setState({
        user: {
          id: 'owner-001',
          name: 'Product Owner',
          username: 'productowner',
          email: 'owner@test.com',
        },
        token: 'mock-jwt-token',
        isAuthenticated: true,
        isLoading: false,
      });

      server.use(
        http.delete(`${API_BASE}/products/:id`, () => {
          return HttpResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 },
          );
        }),
      );

      renderProductDetail('507f1f77bcf86cd799439011');

      await waitFor(() => {
        expect(screen.getByText('Product To Delete')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText('Delete product'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Click the Delete button inside the dialog
      const dialogDeleteButton = screen.getByRole('dialog').querySelector('button:last-child');
      fireEvent.click(dialogDeleteButton!);

      await waitFor(() => {
        expect(screen.getByText(/Failed to delete product/)).toBeInTheDocument();
      });
    });
  });
});
