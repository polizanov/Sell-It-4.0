import { http, HttpResponse } from 'msw';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// In-memory users for mock
const users: Array<{
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  isVerified: boolean;
  isPhoneVerified: boolean;
  verificationToken?: string;
  phoneVerificationCode?: string;
}> = [];

// In-memory favourites for mock
const favourites: Array<{
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
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
    category: 'Clothes',
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
    category: 'Others',
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
    category: 'Antiques',
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
    category: 'Home and Garden',
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
    category: 'Others',
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
    category: 'Home and Garden',
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
    category: 'Others',
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
    category: 'Others',
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
    category: 'Home and Garden',
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
    category: 'Clothes',
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
    category: 'Toys',
    condition: 'Good',
    seller: { _id: 'seller-1', name: 'John Smith', username: 'johnsmith' },
    createdAt: '2024-02-22T10:30:00.000Z',
  },
];

const defaultCategories = [
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
      phone: string;
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

    if (body.phone && users.some((u) => u.phone === body.phone)) {
      return HttpResponse.json(
        { success: false, message: 'Phone number is already in use' },
        { status: 400 },
      );
    }

    const user = {
      id: String(users.length + 1),
      name: body.name,
      username: usernameLower,
      email: body.email,
      phone: body.phone || '',
      password: body.password,
      isVerified: false,
      isPhoneVerified: false,
      verificationToken: 'mock-verification-token',
    };
    users.push(user);

    return HttpResponse.json(
      {
        success: true,
        message:
          'Registration successful. Please check your email to verify your account.',
        data: {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          phone: user.phone,
          isPhoneVerified: user.isPhoneVerified,
        },
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

    return HttpResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        isVerified: user.isVerified,
        phone: user.phone,
        isPhoneVerified: user.isPhoneVerified,
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
            phone: user.phone,
            isPhoneVerified: user.isPhoneVerified,
            profilePhoto: null,
          },
        });
      }
    }

    if (token === 'mock-jwt-token-unverified') {
      const user = users.find((u) => !u.isVerified);
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
            phone: user.phone,
            isPhoneVerified: user.isPhoneVerified,
            profilePhoto: null,
          },
        });
      }
    }

    return HttpResponse.json(
      { success: false, message: 'Not authorized' },
      { status: 401 },
    );
  }),

  http.post(`${API_BASE}/auth/send-phone-verification`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { success: false, message: 'Not authorized' },
        { status: 401 },
      );
    }

    const token = authHeader.split(' ')[1];
    const user = users.find((u) =>
      token === 'mock-jwt-token' ? u.isVerified : token === 'mock-jwt-token-unverified' ? !u.isVerified : false,
    );

    if (!user) {
      return HttpResponse.json(
        { success: false, message: 'Not authorized' },
        { status: 401 },
      );
    }

    return HttpResponse.json({
      success: true,
      message: 'Verification code sent to your phone',
    });
  }),

  http.post(`${API_BASE}/auth/verify-phone`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { success: false, message: 'Not authorized' },
        { status: 401 },
      );
    }

    const token = authHeader.split(' ')[1];
    const user = users.find((u) =>
      token === 'mock-jwt-token' ? u.isVerified : token === 'mock-jwt-token-unverified' ? !u.isVerified : false,
    );

    if (!user) {
      return HttpResponse.json(
        { success: false, message: 'Not authorized' },
        { status: 401 },
      );
    }

    const body = (await request.json()) as { code: string };

    if (body.code !== '123456') {
      return HttpResponse.json(
        { success: false, message: 'Invalid verification code' },
        { status: 400 },
      );
    }

    user.isPhoneVerified = true;

    return HttpResponse.json({
      success: true,
      message: 'Phone number verified successfully',
    });
  }),

  http.post(`${API_BASE}/auth/change-password`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { success: false, message: 'Not authorized' },
        { status: 401 },
      );
    }

    const body = (await request.json()) as {
      currentPassword: string;
      newPassword: string;
      confirmNewPassword: string;
    };

    if (!body.currentPassword || !body.newPassword || !body.confirmNewPassword) {
      return HttpResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 },
      );
    }

    return HttpResponse.json({
      success: true,
      message: 'Password changed successfully',
    });
  }),

  http.delete(`${API_BASE}/auth/account`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { success: false, message: 'Not authorized' },
        { status: 401 },
      );
    }

    const body = (await request.json()) as { password: string };

    if (!body.password) {
      return HttpResponse.json(
        { success: false, message: 'Password is required' },
        { status: 400 },
      );
    }

    return HttpResponse.json({
      success: true,
      message: 'Account deleted successfully',
    });
  }),

  http.post(`${API_BASE}/auth/profile-photo`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { success: false, message: 'Not authorized' },
        { status: 401 },
      );
    }

    return HttpResponse.json({
      success: true,
      message: 'Profile photo updated successfully',
      data: {
        profilePhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
      },
    });
  }),

  http.get(`${API_BASE}/favourites/ids`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (
      !authHeader ||
      !authHeader.startsWith('Bearer ') ||
      authHeader.split(' ')[1] !== 'mock-jwt-token'
    ) {
      return HttpResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
    }
    const user = users.find((u) => u.isVerified);
    // If the token is valid but no user exists in-memory, return empty array.
    // This handles tests that override the login handler without registering a user.
    const userFavs = user ? favourites.filter((f) => f.userId === user.id) : [];
    return HttpResponse.json({
      success: true,
      message: 'Favourite IDs retrieved successfully',
      data: userFavs.map((f) => f.productId),
    });
  }),

  http.get(`${API_BASE}/favourites`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (
      !authHeader ||
      !authHeader.startsWith('Bearer ') ||
      authHeader.split(' ')[1] !== 'mock-jwt-token'
    ) {
      return HttpResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
    }
    const user = users.find((u) => u.isVerified);
    if (!user) {
      return HttpResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '12', 10);

    const userFavs = favourites.filter((f) => f.userId === user.id);
    const allProducts = [...products, ...defaultProducts];

    const favProducts = userFavs
      .map((f) => allProducts.find((p) => p.id === f.productId))
      .filter(Boolean);

    const totalProducts = favProducts.length;
    const totalPages = Math.max(1, Math.ceil(totalProducts / limit));
    const start = (page - 1) * limit;
    const paged = favProducts.slice(start, start + limit);

    return HttpResponse.json({
      success: true,
      message: 'Favourites retrieved successfully',
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

  http.post(`${API_BASE}/favourites/:productId`, ({ request, params }) => {
    const authHeader = request.headers.get('Authorization');
    if (
      !authHeader ||
      !authHeader.startsWith('Bearer ') ||
      authHeader.split(' ')[1] !== 'mock-jwt-token'
    ) {
      return HttpResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
    }
    const user = users.find((u) => u.isVerified);
    if (!user) {
      return HttpResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
    }

    const { productId } = params;
    const productIdStr = typeof productId === 'string' ? productId : '';

    const allProducts = [...products, ...defaultProducts];
    const product = allProducts.find((p) => p.id === productIdStr);
    if (!product) {
      return HttpResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 },
      );
    }

    if (product.seller._id === user.id) {
      return HttpResponse.json(
        { success: false, message: 'You cannot favourite your own product' },
        { status: 403 },
      );
    }

    const existing = favourites.find(
      (f) => f.userId === user.id && f.productId === productIdStr,
    );
    if (existing) {
      return HttpResponse.json(
        { success: false, message: 'Product is already in your favourites' },
        { status: 409 },
      );
    }

    const fav = {
      id: String(favourites.length + 1),
      userId: user.id,
      productId: productIdStr,
      createdAt: new Date().toISOString(),
    };
    favourites.push(fav);

    return HttpResponse.json(
      {
        success: true,
        message: 'Product added to favourites',
        data: { id: fav.id, productId: fav.productId, createdAt: fav.createdAt },
      },
      { status: 201 },
    );
  }),

  http.delete(`${API_BASE}/favourites/:productId`, ({ request, params }) => {
    const authHeader = request.headers.get('Authorization');
    if (
      !authHeader ||
      !authHeader.startsWith('Bearer ') ||
      authHeader.split(' ')[1] !== 'mock-jwt-token'
    ) {
      return HttpResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
    }
    const user = users.find((u) => u.isVerified);
    if (!user) {
      return HttpResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
    }

    const { productId } = params;
    const productIdStr = typeof productId === 'string' ? productId : '';

    const index = favourites.findIndex(
      (f) => f.userId === user.id && f.productId === productIdStr,
    );
    if (index === -1) {
      return HttpResponse.json(
        { success: false, message: 'Favourite not found' },
        { status: 404 },
      );
    }

    favourites.splice(index, 1);

    return HttpResponse.json({
      success: true,
      message: 'Product removed from favourites',
    });
  }),

  http.get(`${API_BASE}/products`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '12', 10);
    const category = url.searchParams.get('category') || '';
    const search = url.searchParams.get('search') || '';
    const sortParam = url.searchParams.get('sort') || 'newest';
    const conditionParam = url.searchParams.get('condition') || '';

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
    // Compute condition counts from base filter (before condition filter)
    const conditionCounts: Record<string, number> = {};
    for (const p of filtered) {
      conditionCounts[p.condition] = (conditionCounts[p.condition] || 0) + 1;
    }

    if (conditionParam) {
      const conditions = conditionParam.split(',').map((c) => c.trim());
      filtered = filtered.filter((p) => conditions.includes(p.condition));
    }

    // Sort
    const sorted = [...filtered];
    switch (sortParam) {
      case 'oldest':
        sorted.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        break;
      case 'title_asc':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'title_desc':
        sorted.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'price_asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
      default:
        sorted.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        break;
    }

    // Paginate
    const totalProducts = sorted.length;
    const totalPages = Math.max(1, Math.ceil(totalProducts / limit));
    const start = (page - 1) * limit;
    const paged = sorted.slice(start, start + limit);

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
        conditionCounts,
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
    return HttpResponse.json({
      success: true,
      message: 'Categories retrieved',
      data: defaultCategories,
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

  http.put(`${API_BASE}/products/:id`, async ({ request, params }) => {
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

    const { id } = params;
    const idStr = typeof id === 'string' ? id : '';

    // Look up product in dynamic and default products
    const allProducts = [...products, ...defaultProducts];
    const existingProduct = allProducts.find((p) => p.id === idStr);

    if (!existingProduct) {
      return HttpResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 },
      );
    }

    // Check ownership
    const seller = users.find((u) => u.isVerified) || {
      id: '1',
      name: 'Mock User',
      username: 'mockuser',
    };
    if (existingProduct.seller._id !== seller.id) {
      return HttpResponse.json(
        { success: false, message: 'You are not authorized to edit this product' },
        { status: 403 },
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

    // Parse existing images
    const existingImagesRaw = formData.get('existingImages') as string | null;
    const existingImages: string[] = existingImagesRaw ? JSON.parse(existingImagesRaw) : [];

    // Merge existing + mock new images
    const newImageUrls = formData.getAll('images').length > 0
      ? ['https://picsum.photos/seed/updated/400/300']
      : [];
    const allImages = [...existingImages, ...newImageUrls];

    // Update in-memory product
    const productIndex = products.findIndex((p) => p.id === idStr);
    const updatedProduct = {
      ...existingProduct,
      title,
      description,
      price: parseFloat(price),
      category,
      condition,
      images: allImages.length > 0 ? allImages : existingProduct.images,
      seller: { _id: seller.id, name: seller.name, username: (seller as { username?: string }).username || 'mockuser' },
    };

    if (productIndex !== -1) {
      products[productIndex] = updatedProduct;
    }

    return HttpResponse.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct,
    });
  }),

  http.delete(`${API_BASE}/products/:id`, ({ request, params }) => {
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

    const { id } = params;
    const idStr = typeof id === 'string' ? id : '';

    const allProducts = [...products, ...defaultProducts];
    const existingProduct = allProducts.find((p) => p.id === idStr);

    if (!existingProduct) {
      return HttpResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 },
      );
    }

    // Check ownership
    const seller = users.find((u) => u.isVerified) || {
      id: '1',
      name: 'Mock User',
      username: 'mockuser',
    };
    if (existingProduct.seller._id !== seller.id) {
      return HttpResponse.json(
        { success: false, message: 'You are not authorized to delete this product' },
        { status: 403 },
      );
    }

    // Remove associated favourites
    for (let i = favourites.length - 1; i >= 0; i--) {
      if (favourites[i]!.productId === idStr) {
        favourites.splice(i, 1);
      }
    }

    // Remove the product from the dynamic products array
    const productIndex = products.findIndex((p) => p.id === idStr);
    if (productIndex !== -1) {
      products.splice(productIndex, 1);
    }

    return HttpResponse.json({
      success: true,
      message: 'Product deleted successfully',
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
