import { http, HttpResponse } from 'msw';

// In-memory users for mock
const users: Array<{
  id: string;
  name: string;
  email: string;
  password: string;
  isVerified: boolean;
  verificationToken?: string;
}> = [];

export const handlers = [
  http.get('/api/health', () => {
    return HttpResponse.json({ success: true, message: 'Server is running' });
  }),

  http.post('/api/auth/register', async ({ request }) => {
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

  http.post('/api/auth/login', async ({ request }) => {
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

  http.get('/api/auth/verify-email/:token', ({ params }) => {
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

  http.get('/api/auth/me', ({ request }) => {
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
];
