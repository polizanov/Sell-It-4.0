// CRITICAL: Set all environment variables BEFORE any imports of app code.
// The Zod validation in environment.ts runs at import time and will exit the process
// if required env vars are missing.
process.env.PORT = '5001';
process.env.MONGODB_URI = 'mongodb://localhost:27017/sellit-test';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_EXPIRES_IN = '7d';
process.env.GMAIL_USER = 'test@gmail.com';
process.env.GMAIL_APP_PASSWORD = 'test-app-password';
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.CLOUDINARY_API_KEY = 'test-key';
process.env.CLOUDINARY_API_SECRET = 'test-secret';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.NODE_ENV = 'test';

// Mock the email service to prevent real emails from being sent during tests.
jest.mock('../src/services/emailService', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
}));

// Mock the SMS service to prevent real SMS from being sent during tests.
jest.mock('../src/services/smsService', () => ({
  sendVerificationSMS: jest.fn().mockResolvedValue(undefined),
  generateOTP: jest.fn().mockReturnValue('123456'),
}));

// Mock the Cloudinary upload to prevent real uploads during tests.
jest.mock('../src/middleware/upload', () => {
  const actual = jest.requireActual('../src/middleware/upload');
  return {
    ...actual,
    uploadToCloudinary: jest
      .fn()
      .mockResolvedValue('https://res.cloudinary.com/test/image/upload/test-image.jpg'),
  };
});

import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import { User } from '../src/models/User';
import { Product } from '../src/models/Product';
import { Favourite } from '../src/models/Favourite';

describe('Favourite Endpoints', () => {
  let tokenA: string;
  let tokenB: string;
  let userAId: string;
  let userBId: string;
  let productId: string;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI!);
    await User.deleteMany({});
    await Product.deleteMany({});
    await Favourite.deleteMany({});

    // Register userA (product owner)
    await request(app).post('/api/auth/register').send({
      name: 'User A',
      username: 'usera',
      email: 'usera@example.com',
      password: 'Password123!',
      phone: '+16465555001',
    });

    // Register userB (favouriter)
    await request(app).post('/api/auth/register').send({
      name: 'User B',
      username: 'userb',
      email: 'userb@example.com',
      password: 'Password123!',
      phone: '+16465555002',
    });

    // Verify both users
    await User.updateOne(
      { email: 'usera@example.com' },
      { $set: { isVerified: true, verificationToken: undefined } },
    );
    await User.updateOne(
      { email: 'userb@example.com' },
      { $set: { isVerified: true, verificationToken: undefined } },
    );

    // Login userA
    const loginA = await request(app).post('/api/auth/login').send({
      email: 'usera@example.com',
      password: 'Password123!',
    });
    tokenA = loginA.body.data.token;
    userAId = loginA.body.data.id;

    // Login userB
    const loginB = await request(app).post('/api/auth/login').send({
      email: 'userb@example.com',
      password: 'Password123!',
    });
    tokenB = loginB.body.data.token;
    userBId = loginB.body.data.id;

    // Create a product owned by userA
    const userA = await User.findOne({ email: 'usera@example.com' });
    const product = await Product.create({
      title: 'Test Favourite Product',
      description: 'A product to test favouriting functionality',
      price: 49.99,
      images: ['https://res.cloudinary.com/test/image/upload/test-image.jpg'],
      category: 'Electronics',
      condition: 'New',
      seller: userA!._id,
    });
    productId = product._id.toString();
  });

  afterAll(async () => {
    await Favourite.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});
  });

  // --------------------------------------------------------------------------
  // POST /api/favourites/:productId
  // --------------------------------------------------------------------------
  describe('POST /api/favourites/:productId', () => {
    afterEach(async () => {
      // Clean up favourites between tests in this block
      await Favourite.deleteMany({});
    });

    it('should return 201 when non-owner adds a favourite', async () => {
      const res = await request(app)
        .post(`/api/favourites/${productId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Product added to favourites');
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('productId');
      expect(res.body.data).toHaveProperty('createdAt');
    });

    it('should return 403 when owner tries to favourite own product', async () => {
      const res = await request(app)
        .post(`/api/favourites/${productId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('You cannot favourite your own product');
    });

    it('should return 409 when product is already favourited', async () => {
      // First, add the favourite
      await request(app)
        .post(`/api/favourites/${productId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      // Try to add again
      const res = await request(app)
        .post(`/api/favourites/${productId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Product is already in your favourites');
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .post(`/api/favourites/${fakeId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Product not found');
    });

    it('should return 400 for invalid product ID format', async () => {
      const res = await request(app)
        .post('/api/favourites/invalid-id')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid product ID');
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).post(`/api/favourites/${productId}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 with invalid auth token', async () => {
      const res = await request(app)
        .post(`/api/favourites/${productId}`)
        .set('Authorization', 'Bearer invalid-jwt-token');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // DELETE /api/favourites/:productId
  // --------------------------------------------------------------------------
  describe('DELETE /api/favourites/:productId', () => {
    beforeEach(async () => {
      await Favourite.deleteMany({});
    });

    it('should return 200 when removing an existing favourite', async () => {
      // First add a favourite
      await request(app)
        .post(`/api/favourites/${productId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      // Remove it
      const res = await request(app)
        .delete(`/api/favourites/${productId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Product removed from favourites');
    });

    it('should return 404 when favourite does not exist', async () => {
      const res = await request(app)
        .delete(`/api/favourites/${productId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Favourite not found');
    });

    it('should return 400 for invalid product ID', async () => {
      const res = await request(app)
        .delete('/api/favourites/invalid-id')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid product ID');
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).delete(`/api/favourites/${productId}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // GET /api/favourites (paginated list)
  // --------------------------------------------------------------------------
  describe('GET /api/favourites', () => {
    beforeAll(async () => {
      await Favourite.deleteMany({});
      await Product.deleteMany({});

      const userA = await User.findOne({ email: 'usera@example.com' });

      // Create 15 products owned by userA
      const createdProducts: string[] = [];
      for (let i = 0; i < 15; i++) {
        const p = await Product.create({
          title: `Favourite Product ${i}`,
          description: `Description for favourite product number ${i}`,
          price: 10 + i,
          images: ['https://res.cloudinary.com/test/image/upload/test-image.jpg'],
          category: 'Electronics',
          condition: 'New',
          seller: userA!._id,
          createdAt: new Date(Date.now() - (15 - i) * 1000),
        });
        createdProducts.push(p._id.toString());
      }

      // UserB favourites all 15 products with sequential timestamps
      const userB = await User.findOne({ email: 'userb@example.com' });
      for (let i = 0; i < 15; i++) {
        await Favourite.create({
          user: userB!._id,
          product: createdProducts[i],
          createdAt: new Date(Date.now() - (15 - i) * 1000),
        });
      }
    });

    it('should return page 1 with 12 products and hasMore=true', async () => {
      const res = await request(app)
        .get('/api/favourites?page=1')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Favourites retrieved successfully');
      expect(res.body.data.products).toHaveLength(12);
      expect(res.body.data.pagination.currentPage).toBe(1);
      expect(res.body.data.pagination.totalProducts).toBe(15);
      expect(res.body.data.pagination.totalPages).toBe(2);
      expect(res.body.data.pagination.hasMore).toBe(true);
    });

    it('should return page 2 with remaining 3 products and hasMore=false', async () => {
      const res = await request(app)
        .get('/api/favourites?page=2')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(200);
      expect(res.body.data.products).toHaveLength(3);
      expect(res.body.data.pagination.currentPage).toBe(2);
      expect(res.body.data.pagination.hasMore).toBe(false);
    });

    it('should return empty array for user with no favourites', async () => {
      const res = await request(app)
        .get('/api/favourites')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.products).toEqual([]);
      expect(res.body.data.pagination.totalProducts).toBe(0);
    });

    it('should populate seller with name and username in products', async () => {
      const res = await request(app)
        .get('/api/favourites?limit=1')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(200);
      const product = res.body.data.products[0];
      expect(product.seller).toHaveProperty('name', 'User A');
      expect(product.seller).toHaveProperty('username', 'usera');
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).get('/api/favourites');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // GET /api/favourites/ids
  // --------------------------------------------------------------------------
  describe('GET /api/favourites/ids', () => {
    it('should return array of product ID strings', async () => {
      const res = await request(app)
        .get('/api/favourites/ids')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Favourite IDs retrieved successfully');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(15);
      // Each element should be a string
      for (const id of res.body.data) {
        expect(typeof id).toBe('string');
      }
    });

    it('should return empty array for user with no favourites', async () => {
      const res = await request(app)
        .get('/api/favourites/ids')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).get('/api/favourites/ids');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Security Tests
  // --------------------------------------------------------------------------
  describe('Security', () => {
    it('user isolation: userA cannot see userB favourites', async () => {
      const resA = await request(app)
        .get('/api/favourites')
        .set('Authorization', `Bearer ${tokenA}`);

      const resB = await request(app)
        .get('/api/favourites')
        .set('Authorization', `Bearer ${tokenB}`);

      // UserA has no favourites, userB has 15
      expect(resA.body.data.products).toEqual([]);
      expect(resB.body.data.products.length).toBe(12); // page 1 of 15
    });

    it('NoSQL injection in productId returns 400', async () => {
      const res = await request(app)
        .post(`/api/favourites/${encodeURIComponent('{"$gt":""}')}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid product ID');
    });
  });
});
