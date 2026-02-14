// CRITICAL: Set all environment variables BEFORE any imports of app code.
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

jest.mock('../src/services/emailService', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
}));

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

const testImageBuffer = Buffer.from('fake-image-data');

describe('requireVerified Middleware', () => {
  let verifiedToken: string;
  let unverifiedToken: string;
  let productId: string;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI!);
    await User.deleteMany({});
    await Product.deleteMany({});
    await Favourite.deleteMany({});

    // Register and verify a user
    await request(app).post('/api/auth/register').send({
      name: 'Verified User',
      username: 'verifieduser',
      email: 'verified@example.com',
      password: 'password123',
    });
    await User.updateOne(
      { email: 'verified@example.com' },
      { $set: { isVerified: true, verificationToken: undefined } },
    );
    const verifiedLogin = await request(app).post('/api/auth/login').send({
      email: 'verified@example.com',
      password: 'password123',
    });
    verifiedToken = verifiedLogin.body.data.token;

    // Register an unverified user
    await request(app).post('/api/auth/register').send({
      name: 'Unverified User',
      username: 'unverifieduser',
      email: 'unverified@example.com',
      password: 'password123',
    });
    const unverifiedLogin = await request(app).post('/api/auth/login').send({
      email: 'unverified@example.com',
      password: 'password123',
    });
    unverifiedToken = unverifiedLogin.body.data.token;

    // Create a product owned by the verified user for favourite tests
    const verifiedUser = await User.findOne({ email: 'verified@example.com' });
    const product = await Product.create({
      title: 'Test Product for Verification',
      description: 'A product to test verification middleware',
      price: 49.99,
      images: ['https://res.cloudinary.com/test/image/upload/test-image.jpg'],
      category: 'Electronics',
      condition: 'New',
      seller: verifiedUser!._id,
    });
    productId = product._id.toString();
  });

  afterAll(async () => {
    await Favourite.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});
  });

  // --------------------------------------------------------------------------
  // Product routes
  // --------------------------------------------------------------------------
  describe('Product routes (requireVerified)', () => {
    it('should return 403 when unverified user creates a product', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${unverifiedToken}`)
        .field('title', 'Unverified Product')
        .field('description', 'Trying to create product without verification')
        .field('price', '29.99')
        .field('category', 'Electronics')
        .field('condition', 'New')
        .attach('images', testImageBuffer, { filename: 'test.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/verify your email/i);
    });

    it('should allow verified user to create a product', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${verifiedToken}`)
        .field('title', 'Verified Product')
        .field('description', 'Creating product with verified account')
        .field('price', '29.99')
        .field('category', 'Electronics')
        .field('condition', 'New')
        .attach('images', testImageBuffer, { filename: 'test.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should return 403 when unverified user updates a product', async () => {
      // Create a product with verified user first
      const createRes = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${verifiedToken}`)
        .field('title', 'Product to Update')
        .field('description', 'This product will be updated in tests')
        .field('price', '50.00')
        .field('category', 'Electronics')
        .field('condition', 'New')
        .attach('images', testImageBuffer, { filename: 'test.jpg', contentType: 'image/jpeg' });

      const pid = createRes.body.data.id;

      const res = await request(app)
        .put(`/api/products/${pid}`)
        .set('Authorization', `Bearer ${unverifiedToken}`)
        .field('title', 'Updated by Unverified')
        .field('description', 'Trying to update product without verification')
        .field('price', '60.00')
        .field('category', 'Electronics')
        .field('condition', 'Good')
        .field('existingImages', JSON.stringify(createRes.body.data.images));

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/verify your email/i);
    });

    it('should return 403 when unverified user deletes a product', async () => {
      const createRes = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${verifiedToken}`)
        .field('title', 'Product to Delete')
        .field('description', 'This product will be deleted in tests')
        .field('price', '40.00')
        .field('category', 'Electronics')
        .field('condition', 'Good')
        .attach('images', testImageBuffer, { filename: 'test.jpg', contentType: 'image/jpeg' });

      const pid = createRes.body.data.id;

      const res = await request(app)
        .delete(`/api/products/${pid}`)
        .set('Authorization', `Bearer ${unverifiedToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/verify your email/i);
    });
  });

  // --------------------------------------------------------------------------
  // Favourite routes
  // --------------------------------------------------------------------------
  describe('Favourite routes (requireVerified)', () => {
    it('should return 403 when unverified user adds a favourite', async () => {
      const res = await request(app)
        .post(`/api/favourites/${productId}`)
        .set('Authorization', `Bearer ${unverifiedToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/verify your email/i);
    });

    it('should return 403 when unverified user removes a favourite', async () => {
      const res = await request(app)
        .delete(`/api/favourites/${productId}`)
        .set('Authorization', `Bearer ${unverifiedToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/verify your email/i);
    });

    it('should allow unverified user to GET favourites list', async () => {
      const res = await request(app)
        .get('/api/favourites')
        .set('Authorization', `Bearer ${unverifiedToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should allow unverified user to GET favourite IDs', async () => {
      const res = await request(app)
        .get('/api/favourites/ids')
        .set('Authorization', `Bearer ${unverifiedToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Verification lifts restriction immediately
  // --------------------------------------------------------------------------
  describe('Verification lifts restriction immediately', () => {
    it('should allow creating product after email verification (without re-login)', async () => {
      // Verify the previously unverified user
      await User.updateOne(
        { email: 'unverified@example.com' },
        { $set: { isVerified: true, verificationToken: undefined } },
      );

      // Use the same token (no re-login)
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${unverifiedToken}`)
        .field('title', 'Now Verified Product')
        .field('description', 'Product created after email verification')
        .field('price', '29.99')
        .field('category', 'Electronics')
        .field('condition', 'New')
        .attach('images', testImageBuffer, { filename: 'test.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });
});
