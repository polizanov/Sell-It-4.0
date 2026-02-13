import { http, HttpResponse } from 'msw';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// In-memory users for mock
const users: Array<{
  id: string;
  name: string;
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
  seller: { _id: string; name: string };
  createdAt: string;
}> = [];

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
      email: string;
      password: string;
    };

    if (!body.name || !body.email || !body.password) {
      return HttpResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 },
      );
    }

    if (users.some((u) => u.email === body.email)) {
      return HttpResponse.json(
        { success: false, message: 'User already exists with this email' },
        { status: 400 },
      );
    }

    const user = {
      id: String(users.length + 1),
      name: body.name,
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
        data: { id: user.id, name: user.name, email: user.email },
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

    const seller = users.find((u) => u.isVerified) || { id: '1', name: 'Mock User' };

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
      seller: { _id: seller.id, name: seller.name },
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
];
