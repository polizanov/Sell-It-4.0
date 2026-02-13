import { http, HttpResponse } from 'msw';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// In-memory users for mock
const users: Array<{
  id: string;
  name: string;
  username: string;
  email: string;
  password: string;
  isVerified: boolean;
  verificationToken?: string;
}> = [];

// In-memory products for mock
const products: Array<{
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  condition: string;
  seller: { _id: string; name: string; username: string };
  createdAt: string;
}> = [];

// Default mock products for listing / pagination tests
const defaultProducts: typeof products = [
  {
    id: 'mock-1',
    title: 'Vintage Camera',
    description: 'Classic film camera in excellent condition.',
    price: 249.99,
    images: ['https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&h=600&fit=crop'],
    category: 'Electronics',
    condition: 'Good',
    seller: { _id: 'seller-1', name: 'John Smith', username: 'johnsmith' },
    createdAt: '2024-01-15T10:30:00.000Z',
  },
  {
    id: 'mock-2',
    title: 'Designer Leather Jacket',
    description: 'Limited edition leather jacket. Genuine leather, size M.',
    price: 399.99,
    images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=600&fit=crop'],
    category: 'Clothing',
    condition: 'Like New',
    seller: { _id: 'seller-2', name: 'Sarah Johnson', username: 'sarahjohnson' },
    createdAt: '2024-01-20T10:30:00.000Z',
  },
  {
    id: 'mock-3',
    title: 'Mountain Bike',
    description: 'Professional mountain bike with 21-speed gears.',
    price: 550.0,
    images: ['https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=800&h=600&fit=crop'],
    category: 'Sports',
    condition: 'Good',
    seller: { _id: 'seller-1', name: 'John Smith', username: 'johnsmith' },
    createdAt: '2024-01-22T10:30:00.000Z',
  },
  {
    id: 'mock-4',
    title: 'Acoustic Guitar',
    description: 'Beautiful acoustic guitar with rich tone.',
    price: 180.5,
    images: ['https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&h=600&fit=crop'],
    category: 'Musical Instruments',
    condition: 'Good',
    seller: { _id: 'seller-3', name: 'Mike Davis', username: 'mikedavis' },
    createdAt: '2024-01-25T10:30:00.000Z',
  },
  {
    id: 'mock-5',
    title: 'Modern Desk Lamp',
    description: 'Sleek LED desk lamp with adjustable brightness.',
    price: 45.0,
    images: ['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&h=600&fit=crop'],
    category: 'Home & Garden',
    condition: 'Like New',
    seller: { _id: 'seller-2', name: 'Sarah Johnson', username: 'sarahjohnson' },
    createdAt: '2024-02-01T10:30:00.000Z',
  },
  {
    id: 'mock-6',
    title: 'Gaming Headset',
    description: 'Professional gaming headset with surround sound.',
    price: 89.99,
    images: ['https://images.unsplash.com/photo-1599669454699-248893623440?w=800&h=600&fit=crop'],
    category: 'Electronics',
    condition: 'New',
    seller: { _id: 'seller-1', name: 'John Smith', username: 'johnsmith' },
    createdAt: '2024-02-03T10:30:00.000Z',
  },
  {
    id: 'mock-7',
    title: 'Running Shoes',
    description: 'High-performance running shoes, size 10.',
    price: 75.0,
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=600&fit=crop'],
    category: 'Sports',
    condition: 'Like New',
    seller: { _id: 'seller-3', name: 'Mike Davis', username: 'mikedavis' },
    createdAt: '2024-02-05T10:30:00.000Z',
  },
  {
    id: 'mock-8',
    title: 'Coffee Maker',
    description: 'Programmable coffee maker with thermal carafe.',
    price: 65.0,
    images: ['https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&h=600&fit=crop'],
    category: 'Home & Garden',
    condition: 'Good',
    seller: { _id: 'seller-2', name: 'Sarah Johnson', username: 'sarahjohnson' },
    createdAt: '2024-02-08T10:30:00.000Z',
  },
  {
    id: 'mock-9',
    title: 'Skateboard Deck',
    description: 'Professional skateboard deck with custom artwork.',
    price: 120.0,
    images: ['https://images.unsplash.com/photo-1547447134-cd3f5c716030?w=800&h=600&fit=crop'],
    category: 'Sports',
    condition: 'Fair',
    seller: { _id: 'seller-1', name: 'John Smith', username: 'johnsmith' },
    createdAt: '2024-02-10T10:30:00.000Z',
  },
  {
    id: 'mock-10',
    title: 'Wireless Keyboard',
    description: 'Mechanical wireless keyboard with RGB backlight.',
    price: 95.0,
    images: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&h=600&fit=crop'],
    category: 'Electronics',
    condition: 'New',
    seller: { _id: 'seller-3', name: 'Mike Davis', username: 'mikedavis' },
    createdAt: '2024-02-12T10:30:00.000Z',
  },
  {
    id: 'mock-11',
    title: 'Yoga Mat',
    description: 'Premium non-slip yoga mat, extra thick.',
    price: 35.0,
    images: ['https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=600&fit=crop'],
    category: 'Sports',
    condition: 'New',
    seller: { _id: 'seller-2', name: 'Sarah Johnson', username: 'sarahjohnson' },
    createdAt: '2024-02-14T10:30:00.000Z',
  },
  {
    id: 'mock-12',
    title: 'Bookshelf',
    description: 'Solid wood bookshelf with five shelves.',
    price: 150.0,
    images: ['https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800&h=600&fit=crop'],
    category: 'Home & Garden',
    condition: 'Good',
    seller: { _id: 'seller-1', name: 'John Smith', username: 'johnsmith' },
    createdAt: '2024-02-16T10:30:00.000Z',
  },
  {
    id: 'mock-13',
    title: 'Smartwatch',
    description: 'Fitness smartwatch with heart rate monitor.',
    price: 199.99,
    images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=600&fit=crop'],
    category: 'Electronics',
    condition: 'Like New',
    seller: { _id: 'seller-3', name: 'Mike Davis', username: 'mikedavis' },
    createdAt: '2024-02-18T10:30:00.000Z',
  },
  {
    id: 'mock-14',
    title: 'Winter Jacket',
    description: 'Warm waterproof winter jacket, size L.',
    price: 220.0,
    images: ['https://images.unsplash.com/photo-1544923246-77307dd270c3?w=800&h=600&fit=crop'],
    category: 'Clothing',
    condition: 'Good',
    seller: { _id: 'seller-2', name: 'Sarah Johnson', username: 'sarahjohnson' },
    createdAt: '2024-02-20T10:30:00.000Z',
  },
  {
    id: 'mock-15',
    title: 'Board Game Collection',
    description: 'Collection of 5 popular board games.',
    price: 85.0,
    images: ['https://images.unsplash.com/photo-1611371805429-8b5c1b2c34ba?w=800&h=600&fit=crop'],
    category: 'Toys & Games',
    condition: 'Good',
    seller: { _id: 'seller-1', name: 'John Smith', username: 'johnsmith' },
    createdAt: '2024-02-22T10:30:00.000Z',
  },
];

const defaultCategories = [
  'Books',
  'Clothing',
  'Electronics',
  'Home & Garden',
  'Musical Instruments',
  'Sports',
  'Toys & Games',
];

export const handlers = [
  http.get(`${API_BASE}/health`, () => {
    return HttpResponse.json({ success: true, message: 'Server is running' });
  }),

  http.post(`${API_BASE}/auth/register`, async ({ request }) => {
    const body = (await request.json()) as {
      name: string;
      username: string;
      email: string;
      password: string;
    };

    if (!body.name || !body.username || !body.email || !body.password) {
      return HttpResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 },
      );
    }

    const usernameLower = body.username.toLowerCase();

    if (users.some((u) => u.email === body.email)) {
      return HttpResponse.json(
        { success: false, message: 'User already exists with this email' },
        { status: 400 },
      );
    }

    if (users.some((u) => u.username === usernameLower)) {
      return HttpResponse.json(
        { success: false, message: 'Username is already taken' },
        { status: 400 },
      );
    }

    const user = {
      id: String(users.length + 1),
      name: body.name,
      username: usernameLower,
      email: body.email,
      password: body.password,
      isVerified: false,
      verificationToken: 'mock-verification-token',
    };
    users.push(user);

    return HttpResponse.json(
      {
        success: true,
        message:
          'Registration successful. Please check your email to verify your account.',
        data: { id: user.id, name: user.name, username: user.username, email: user.email },
      },
      { status: 201 },
    );
  }),

  http.post(`${API_BASE}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as {
      email: string;
      password: string;
    };
    const user = users.find((u) => u.email === body.email);

    if (!user || user.password !== body.password) {
      return HttpResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 },
      );
    }

    if (!user.isVerified) {
      return HttpResponse.json(
        {
          success: false,
          message: 'Please verify your email before logging in',
        },
        { status: 403 },
      );
    }

    return HttpResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        isVerified: user.isVerified,
        token: 'mock-jwt-token',
      },
    });
  }),

  http.get(`${API_BASE}/auth/verify-email/:token`, ({ params }) => {
    const { token } = params;
    const user = users.find((u) => u.verificationToken === token);

    if (!user) {
      return HttpResponse.json(
        { success: false, message: 'Invalid or expired verification token' },
        { status: 400 },
      );
    }

    user.isVerified = true;
    user.verificationToken = undefined;

    return HttpResponse.json({
      success: true,
      message: 'Email verified successfully',
    });
  }),

  http.get(`${API_BASE}/auth/me`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { success: false, message: 'Not authorized' },
        { status: 401 },
      );
    }

    const token = authHeader.split(' ')[1];
    if (token === 'mock-jwt-token') {
      const user = users.find((u) => u.isVerified);
      if (user) {
        return HttpResponse.json({
          success: true,
          message: 'User profile retrieved',
          data: {
            id: user.id,
            name: user.name,
            username: user.username,
            email: user.email,
            isVerified: user.isVerified,
          },
        });
      }
    }

    return HttpResponse.json(
      { success: false, message: 'Not authorized' },
      { status: 401 },
    );
  }),

  http.get(`${API_BASE}/products`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '12', 10);
    const category = url.searchParams.get('category') || '';
    const search = url.searchParams.get('search') || '';

    // Combine user-created products with default mock products
    const allProducts = [...products, ...defaultProducts];

    // Filter
    let filtered = allProducts;
    if (category) {
      filtered = filtered.filter((p) => p.category === category);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q),
      );
    }

    // Paginate
    const totalProducts = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalProducts / limit));
    const start = (page - 1) * limit;
    const paged = filtered.slice(start, start + limit);

    return HttpResponse.json({
      success: true,
      message: 'Products retrieved successfully',
      data: {
        products: paged,
        pagination: {
          currentPage: page,
          totalPages,
          totalProducts,
          limit,
          hasMore: page < totalPages,
        },
      },
    });
  }),

  http.post(`${API_BASE}/products`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { success: false, message: 'Not authorized' },
        { status: 401 },
      );
    }

    const token = authHeader.split(' ')[1];
    if (token !== 'mock-jwt-token') {
      return HttpResponse.json(
        { success: false, message: 'Not authorized' },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const price = formData.get('price') as string;
    const category = formData.get('category') as string;
    const condition = formData.get('condition') as string;

    if (!title || !description || !price || !category || !condition) {
      return HttpResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 },
      );
    }

    const seller = users.find((u) => u.isVerified) || { id: '1', name: 'Mock User', username: 'mockuser' };

    const product = {
      id: String(products.length + 1),
      title,
      description,
      price: parseFloat(price),
      images: [
        'https://picsum.photos/seed/mock1/400/300',
        'https://picsum.photos/seed/mock2/400/300',
      ],
      category,
      condition,
      seller: { _id: seller.id, name: seller.name, username: (seller as { username?: string }).username || 'mockuser' },
      createdAt: new Date().toISOString(),
    };
    products.push(product);

    return HttpResponse.json(
      {
        success: true,
        message: 'Product created successfully',
        data: product,
      },
      { status: 201 },
    );
  }),

  http.get(`${API_BASE}/products/categories`, () => {
    const productCategories = products.map((p) => p.category);
    const allCategories = [...new Set([...defaultCategories, ...productCategories])].sort();

    return HttpResponse.json({
      success: true,
      message: 'Categories retrieved',
      data: allCategories,
    });
  }),

  http.get(`${API_BASE}/products/user/:username`, ({ params, request }) => {
    const { username } = params;
    const usernameStr = (typeof username === 'string' ? username : '').toLowerCase();

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '12', 10);

    // Map of known mock sellers
    const mockSellers: Record<string, { id: string; name: string; username: string; memberSince: string }> = {
      johnsmith: { id: 'seller-1', name: 'John Smith', username: 'johnsmith', memberSince: '2024-01-01T00:00:00.000Z' },
      sarahjohnson: { id: 'seller-2', name: 'Sarah Johnson', username: 'sarahjohnson', memberSince: '2024-02-01T00:00:00.000Z' },
      mikedavis: { id: 'seller-3', name: 'Mike Davis', username: 'mikedavis', memberSince: '2024-03-01T00:00:00.000Z' },
    };

    // Check dynamic users too
    const dynamicUser = users.find((u) => u.username === usernameStr);
    const seller = mockSellers[usernameStr] || (dynamicUser ? { id: dynamicUser.id, name: dynamicUser.name, username: dynamicUser.username, memberSince: new Date().toISOString() } : null);

    if (!seller) {
      return HttpResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 },
      );
    }

    // Get all products (user-created + defaults), filter by seller
    const allProducts = [...products, ...defaultProducts];
    const userProducts = allProducts.filter((p) => p.seller._id === seller.id);

    // Paginate
    const totalProducts = userProducts.length;
    const totalPages = Math.max(1, Math.ceil(totalProducts / limit));
    const start = (page - 1) * limit;
    const paged = userProducts.slice(start, start + limit);

    return HttpResponse.json({
      success: true,
      message: 'User products retrieved successfully',
      data: {
        user: {
          name: seller.name,
          username: seller.username,
          memberSince: seller.memberSince,
        },
        products: paged,
        pagination: {
          currentPage: page,
          totalPages,
          totalProducts,
          limit,
          hasMore: page < totalPages,
        },
      },
    });
  }),

  http.get(`${API_BASE}/products/:id`, ({ params }) => {
    const { id } = params;

    // Simulate invalid ID format (not a valid ObjectId)
    if (typeof id !== 'string' || id.length < 1) {
      return HttpResponse.json(
        { success: false, message: 'Invalid product ID' },
        { status: 400 },
      );
    }

    // Simulate not found for a special "not-found" ID
    if (id === '000000000000000000000000') {
      return HttpResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 },
      );
    }

    // Check in-memory products first
    const existingProduct = products.find((p) => p.id === id);
    if (existingProduct) {
      return HttpResponse.json({
        success: true,
        message: 'Product retrieved successfully',
        data: existingProduct,
      });
    }

    // Return a realistic mock product for any other ID
    return HttpResponse.json({
      success: true,
      message: 'Product retrieved successfully',
      data: {
        id,
        title: 'Vintage Camera',
        description:
          'Classic film camera in excellent condition. Perfect for photography enthusiasts and collectors.',
        price: 249.99,
        images: [
          'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1495121605193-b116b5b9c5fe?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800&h=600&fit=crop',
        ],
        category: 'Electronics',
        condition: 'Good',
        seller: { _id: '507f1f77bcf86cd799439011', name: 'John Smith', username: 'johnsmith' },
        createdAt: '2024-01-15T10:30:00.000Z',
      },
    });
  }),
];
