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

const testImageBuffer = Buffer.from('fake-image-data');

describe('Product Endpoints', () => {
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI!);
    await User.deleteMany({});
    await Product.deleteMany({});

    // Register a test user
    await request(app).post('/api/auth/register').send({
      name: 'Product Test User',
      username: 'producttestuser',
      email: 'productuser@example.com',
      password: 'password123',
    });

    // Verify the user directly in the database
    await User.updateOne(
      { email: 'productuser@example.com' },
      { $set: { isVerified: true, verificationToken: undefined } },
    );

    // Login to get an auth token
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'productuser@example.com',
      password: 'password123',
    });

    authToken = loginRes.body.data.token;
    testUserId = loginRes.body.data.id;
  });

  afterAll(async () => {
    await Product.deleteMany({});
    await User.deleteMany({});
  });

  // --------------------------------------------------------------------------
  // GET /api/products/categories (when no products exist)
  // --------------------------------------------------------------------------
  describe('GET /api/products/categories (empty)', () => {
    it('should return empty array when no products exist', async () => {
      // Ensure no products exist
      await Product.deleteMany({});

      const res = await request(app).get('/api/products/categories');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
    });
  });

  // --------------------------------------------------------------------------
  // POST /api/products
  // --------------------------------------------------------------------------
  describe('POST /api/products', () => {
    it('should create a product with valid data and auth token', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Test Product')
        .field('description', 'A valid product description here')
        .field('price', '29.99')
        .field('category', 'Electronics')
        .field('condition', 'New')
        .attach('images', testImageBuffer, { filename: 'test.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Product created');
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.title).toBe('Test Product');
      expect(res.body.data.description).toBe('A valid product description here');
      expect(res.body.data.price).toBe(29.99);
      expect(res.body.data.images).toHaveLength(1);
      expect(res.body.data.category).toBe('Electronics');
      expect(res.body.data.condition).toBe('New');
      expect(res.body.data.seller).toHaveProperty('name', 'Product Test User');
      expect(res.body.data.seller).toHaveProperty('username', 'producttestuser');
      expect(res.body.data).toHaveProperty('createdAt');
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app)
        .post('/api/products')
        .field('title', 'Test Product')
        .field('description', 'A valid product description here')
        .field('price', '29.99')
        .field('category', 'Electronics')
        .field('condition', 'New')
        .attach('images', testImageBuffer, { filename: 'test.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 with invalid auth token', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', 'Bearer invalid-jwt-token')
        .field('title', 'Test Product')
        .field('description', 'A valid product description here')
        .field('price', '29.99')
        .field('category', 'Electronics')
        .field('condition', 'New')
        .attach('images', testImageBuffer, { filename: 'test.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when required fields are missing (no title)', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .field('description', 'A valid product description here')
        .field('price', '29.99')
        .field('category', 'Electronics')
        .field('condition', 'New')
        .attach('images', testImageBuffer, { filename: 'test.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when title is too short (< 3 chars)', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Ab')
        .field('description', 'A valid product description here')
        .field('price', '29.99')
        .field('category', 'Electronics')
        .field('condition', 'New')
        .attach('images', testImageBuffer, { filename: 'test.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when description is too short (< 10 chars)', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Valid Title')
        .field('description', 'Short')
        .field('price', '29.99')
        .field('category', 'Electronics')
        .field('condition', 'New')
        .attach('images', testImageBuffer, { filename: 'test.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when price is zero', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Valid Title')
        .field('description', 'A valid product description here')
        .field('price', '0')
        .field('category', 'Electronics')
        .field('condition', 'New')
        .attach('images', testImageBuffer, { filename: 'test.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when price is negative', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Valid Title')
        .field('description', 'A valid product description here')
        .field('price', '-5')
        .field('category', 'Electronics')
        .field('condition', 'New')
        .attach('images', testImageBuffer, { filename: 'test.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when price is not a number', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Valid Title')
        .field('description', 'A valid product description here')
        .field('price', 'abc')
        .field('category', 'Electronics')
        .field('condition', 'New')
        .attach('images', testImageBuffer, { filename: 'test.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when condition is invalid enum value', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Valid Title')
        .field('description', 'A valid product description here')
        .field('price', '29.99')
        .field('category', 'Electronics')
        .field('condition', 'Terrible')
        .attach('images', testImageBuffer, { filename: 'test.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when no images are attached', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Valid Title')
        .field('description', 'A valid product description here')
        .field('price', '29.99')
        .field('category', 'Electronics')
        .field('condition', 'New');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return error when more than 5 images are attached', async () => {
      const req = request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Valid Title')
        .field('description', 'A valid product description here')
        .field('price', '29.99')
        .field('category', 'Electronics')
        .field('condition', 'New');

      // Attach 6 images to exceed the limit of 5
      for (let i = 0; i < 6; i++) {
        req.attach('images', testImageBuffer, {
          filename: `test${i}.jpg`,
          contentType: 'image/jpeg',
        });
      }

      const res = await req;

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Too many files');
    });
  });

  // --------------------------------------------------------------------------
  // GET /api/products/categories (after products created)
  // --------------------------------------------------------------------------
  describe('GET /api/products/categories (with products)', () => {
    beforeAll(async () => {
      // Create a second product in a different category to test distinct + sort
      await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Second Product')
        .field('description', 'Another valid product description here')
        .field('price', '49.99')
        .field('category', 'Books')
        .field('condition', 'Good')
        .attach('images', testImageBuffer, { filename: 'test2.jpg', contentType: 'image/jpeg' });
    });

    it('should return distinct categories sorted alphabetically', async () => {
      const res = await request(app).get('/api/products/categories');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      // Categories should be sorted alphabetically: Books before Electronics
      expect(res.body.data).toEqual(
        [...res.body.data].sort((a: string, b: string) => a.localeCompare(b)),
      );
      expect(res.body.data).toContain('Books');
      expect(res.body.data).toContain('Electronics');
    });
  });

  // --------------------------------------------------------------------------
  // GET /api/products/:id
  // --------------------------------------------------------------------------
  describe('GET /api/products/:id', () => {
    let createdProductId: string;

    beforeAll(async () => {
      // Create a product to fetch later
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Fetchable Product')
        .field('description', 'A product created for the GET by ID tests')
        .field('price', '59.99')
        .field('category', 'Electronics')
        .field('condition', 'Like New')
        .attach('images', testImageBuffer, { filename: 'fetch-test.jpg', contentType: 'image/jpeg' });

      createdProductId = res.body.data.id;
    });

    it('should return 200 with full product data for an existing product', async () => {
      const res = await request(app).get(`/api/products/${createdProductId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Product retrieved successfully');
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.title).toBe('Fetchable Product');
      expect(res.body.data.description).toBe('A product created for the GET by ID tests');
      expect(res.body.data.price).toBe(59.99);
      expect(res.body.data.images).toHaveLength(1);
      expect(res.body.data.category).toBe('Electronics');
      expect(res.body.data.condition).toBe('Like New');
      // Seller should be populated with name
      expect(res.body.data.seller).toHaveProperty('_id', testUserId);
      expect(res.body.data.seller).toHaveProperty('name', 'Product Test User');
      expect(res.body.data.seller).toHaveProperty('username', 'producttestuser');
      expect(res.body.data).toHaveProperty('createdAt');
    });

    it('should return 404 for a valid ObjectId that does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const res = await request(app).get(`/api/products/${nonExistentId}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Product not found');
    });

    it('should return 400 for an invalid ObjectId format (plain string)', async () => {
      const res = await request(app).get('/api/products/invalid-id');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid product ID');
    });

    it('should return 400 for a short numeric string', async () => {
      const res = await request(app).get('/api/products/123');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid product ID');
    });

    it('should return 400 for path traversal attempt in ID', async () => {
      const res = await request(app).get('/api/products/..%2Fadmin');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid product ID');
    });

    it('should return 400 for NoSQL injection attempt in ID', async () => {
      const res = await request(app).get(
        `/api/products/${encodeURIComponent('{"$gt":""}')}`
      );

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid product ID');
    });

    it('should return 400 for XSS attempt in ID', async () => {
      const res = await request(app).get(
        `/api/products/${encodeURIComponent('<script>alert(1)</script>')}`
      );

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid product ID');
    });

    it('should not require authentication (public endpoint)', async () => {
      // Fetch without any Authorization header
      const res = await request(app).get(`/api/products/${createdProductId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Fetchable Product');
    });
  });

  // --------------------------------------------------------------------------
  // GET /api/products (listing with pagination, filters, sorting)
  // --------------------------------------------------------------------------
  describe('GET /api/products', () => {
    beforeAll(async () => {
      // Clear all products from previous tests and insert 15 test products
      await Product.deleteMany({});

      const user = await User.findOne({ email: 'productuser@example.com' });

      const productData = [
        { title: 'Alpha Phone', description: 'A great smartphone for everyone', price: 100, category: 'Electronics', condition: 'New' },
        { title: 'Beta Laptop', description: 'Powerful laptop for work and play', price: 200, category: 'Electronics', condition: 'Like New' },
        { title: 'Gamma Headphones', description: 'Wireless headphones with noise cancelling', price: 50, category: 'Electronics', condition: 'Good' },
        { title: 'Delta Jacket', description: 'Warm winter jacket for cold weather', price: 120, category: 'Clothing', condition: 'New' },
        { title: 'Epsilon Sneakers', description: 'Running shoes for daily training', price: 80, category: 'Clothing', condition: 'Like New' },
        { title: 'Zeta Novel', description: 'Bestselling fiction novel of the year', price: 15, category: 'Books', condition: 'Good' },
        { title: 'Eta Cookbook', description: 'Delicious recipes from around the world', price: 25, category: 'Books', condition: 'New' },
        { title: 'Theta Yoga Mat', description: 'Premium non-slip yoga mat extra thick', price: 35, category: 'Sports', condition: 'New' },
        { title: 'Iota Basketball', description: 'Official size basketball for outdoor courts', price: 30, category: 'Sports', condition: 'Good' },
        { title: 'Kappa Desk Lamp', description: 'Adjustable LED desk lamp with brightness control', price: 45, category: 'Home & Garden', condition: 'Like New' },
        { title: 'Lambda Bookshelf', description: 'Solid wood bookshelf with five shelves', price: 150, category: 'Home & Garden', condition: 'Fair' },
        { title: 'Mu Guitar', description: 'Acoustic guitar with beautiful warm tone', price: 300, category: 'Musical Instruments', condition: 'Good' },
        { title: 'Nu Keyboard', description: 'Mechanical keyboard with RGB backlight', price: 95, category: 'Electronics', condition: 'New' },
        { title: 'Xi Board Game', description: 'Fun board game for the whole family', price: 40, category: 'Toys & Games', condition: 'Like New' },
        { title: 'Omicron Camera', description: 'Professional DSLR camera body only', price: 500, category: 'Electronics', condition: 'Like New' },
      ];

      // Insert with sequential createdAt so sort order is deterministic
      for (let i = 0; i < productData.length; i++) {
        await Product.create({
          ...productData[i],
          images: ['https://res.cloudinary.com/test/image/upload/test-image.jpg'],
          seller: user!._id,
          createdAt: new Date(Date.now() - (productData.length - i) * 1000),
        });
      }
    });

    it('should return default pagination: 12 products, page 1, totalProducts=15, hasMore=true', async () => {
      const res = await request(app).get('/api/products');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Products retrieved successfully');
      expect(res.body.data.products).toHaveLength(12);
      expect(res.body.data.pagination.currentPage).toBe(1);
      expect(res.body.data.pagination.totalProducts).toBe(15);
      expect(res.body.data.pagination.totalPages).toBe(2);
      expect(res.body.data.pagination.limit).toBe(12);
      expect(res.body.data.pagination.hasMore).toBe(true);
    });

    it('should return page 2 with remaining 3 products and hasMore=false', async () => {
      const res = await request(app).get('/api/products?page=2');

      expect(res.status).toBe(200);
      expect(res.body.data.products).toHaveLength(3);
      expect(res.body.data.pagination.currentPage).toBe(2);
      expect(res.body.data.pagination.hasMore).toBe(false);
    });

    it('should respect custom limit: ?limit=5 returns 5 products, totalPages=3', async () => {
      const res = await request(app).get('/api/products?limit=5');

      expect(res.status).toBe(200);
      expect(res.body.data.products).toHaveLength(5);
      expect(res.body.data.pagination.limit).toBe(5);
      expect(res.body.data.pagination.totalPages).toBe(3);
    });

    it('should filter by category: all returned products match the category', async () => {
      const res = await request(app).get('/api/products?category=Electronics');

      expect(res.status).toBe(200);
      expect(res.body.data.products.length).toBeGreaterThan(0);
      for (const product of res.body.data.products) {
        expect(product.category).toBe('Electronics');
      }
      expect(res.body.data.pagination.totalProducts).toBe(5);
    });

    it('should filter by search: case-insensitive match on title', async () => {
      const res = await request(app).get('/api/products?search=alpha');

      expect(res.status).toBe(200);
      expect(res.body.data.products).toHaveLength(1);
      expect(res.body.data.products[0].title).toBe('Alpha Phone');
    });

    it('should filter by search: case-insensitive match on description', async () => {
      const res = await request(app).get('/api/products?search=yoga');

      expect(res.status).toBe(200);
      expect(res.body.data.products).toHaveLength(1);
      expect(res.body.data.products[0].title).toBe('Theta Yoga Mat');
    });

    it('should combine search + category filters', async () => {
      const res = await request(app).get('/api/products?search=keyboard&category=Electronics');

      expect(res.status).toBe(200);
      expect(res.body.data.products).toHaveLength(1);
      expect(res.body.data.products[0].title).toBe('Nu Keyboard');
      expect(res.body.data.products[0].category).toBe('Electronics');
    });

    it('should sort newest by default: createdAt descending', async () => {
      const res = await request(app).get('/api/products?limit=15');

      expect(res.status).toBe(200);
      const dates = res.body.data.products.map((p: { createdAt: string }) => new Date(p.createdAt).getTime());
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i - 1]).toBeGreaterThanOrEqual(dates[i]);
      }
    });

    it('should sort price_asc: prices ascending', async () => {
      const res = await request(app).get('/api/products?sort=price_asc&limit=15');

      expect(res.status).toBe(200);
      const prices = res.body.data.products.map((p: { price: number }) => p.price);
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
      }
    });

    it('should sort price_desc: prices descending', async () => {
      const res = await request(app).get('/api/products?sort=price_desc&limit=15');

      expect(res.status).toBe(200);
      const prices = res.body.data.products.map((p: { price: number }) => p.price);
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]).toBeLessThanOrEqual(prices[i - 1]);
      }
    });

    it('should sort oldest: createdAt ascending', async () => {
      const res = await request(app).get('/api/products?sort=oldest&limit=15');

      expect(res.status).toBe(200);
      const dates = res.body.data.products.map((p: { createdAt: string }) => new Date(p.createdAt).getTime());
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i]).toBeGreaterThanOrEqual(dates[i - 1]);
      }
    });

    it('should return empty results for non-matching category with totalProducts=0', async () => {
      const res = await request(app).get('/api/products?category=NonExistentCategory');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.products).toEqual([]);
      expect(res.body.data.pagination.totalProducts).toBe(0);
    });

    it('should clamp limit to 50 when limit=100', async () => {
      const res = await request(app).get('/api/products?limit=100');

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.limit).toBe(50);
    });

    it('should default invalid page to 1: ?page=-1 returns currentPage=1', async () => {
      const res = await request(app).get('/api/products?page=-1');

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.currentPage).toBe(1);
    });

    it('should be a public endpoint: returns 200 without auth token', async () => {
      const res = await request(app).get('/api/products');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should include populated seller name in products', async () => {
      const res = await request(app).get('/api/products?limit=1');

      expect(res.status).toBe(200);
      expect(res.body.data.products[0].seller).toHaveProperty('name', 'Product Test User');
      expect(res.body.data.products[0].seller).toHaveProperty('username', 'producttestuser');
    });
  });

  // --------------------------------------------------------------------------
  // GET /api/products/user/:username
  // --------------------------------------------------------------------------
  describe('GET /api/products/user/:username', () => {
    beforeAll(async () => {
      await Product.deleteMany({});

      const user = await User.findOne({ email: 'productuser@example.com' });

      // Create 15 products for the test user
      for (let i = 0; i < 15; i++) {
        await Product.create({
          title: `User Product ${i}`,
          description: `Description for user product number ${i}`,
          price: 10 + i,
          images: ['https://res.cloudinary.com/test/image/upload/test-image.jpg'],
          category: i % 2 === 0 ? 'Electronics' : 'Clothing',
          condition: 'New',
          seller: user!._id,
          createdAt: new Date(Date.now() - (15 - i) * 1000),
        });
      }
    });

    it('should return user info and paginated products (12 of 15, hasMore=true)', async () => {
      const res = await request(app).get('/api/products/user/producttestuser');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('User products retrieved successfully');
      expect(res.body.data.user).toHaveProperty('name', 'Product Test User');
      expect(res.body.data.user).toHaveProperty('username', 'producttestuser');
      expect(res.body.data.user).toHaveProperty('memberSince');
      expect(res.body.data.products).toHaveLength(12);
      expect(res.body.data.pagination.currentPage).toBe(1);
      expect(res.body.data.pagination.totalProducts).toBe(15);
      expect(res.body.data.pagination.totalPages).toBe(2);
      expect(res.body.data.pagination.hasMore).toBe(true);
    });

    it('should return page 2 with remaining products', async () => {
      const res = await request(app).get('/api/products/user/producttestuser?page=2');

      expect(res.status).toBe(200);
      expect(res.body.data.products).toHaveLength(3);
      expect(res.body.data.pagination.currentPage).toBe(2);
      expect(res.body.data.pagination.hasMore).toBe(false);
    });

    it('should return 404 for non-existent username', async () => {
      const res = await request(app).get('/api/products/user/nonexistentuser');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('User not found');
    });

    it('should return user info with empty products for user with 0 products', async () => {
      // Register a second user with no products
      await request(app).post('/api/auth/register').send({
        name: 'Empty User',
        username: 'emptyuser',
        email: 'emptyuser@example.com',
        password: 'password123',
      });
      await User.updateOne(
        { email: 'emptyuser@example.com' },
        { $set: { isVerified: true } },
      );

      const res = await request(app).get('/api/products/user/emptyuser');

      expect(res.status).toBe(200);
      expect(res.body.data.user).toHaveProperty('name', 'Empty User');
      expect(res.body.data.user).toHaveProperty('username', 'emptyuser');
      expect(res.body.data.products).toEqual([]);
      expect(res.body.data.pagination.totalProducts).toBe(0);
    });

    it('should perform case-insensitive username lookup', async () => {
      const res = await request(app).get('/api/products/user/ProductTestUser');

      expect(res.status).toBe(200);
      expect(res.body.data.user).toHaveProperty('username', 'producttestuser');
    });

    it('should populate seller with name and username', async () => {
      const res = await request(app).get('/api/products/user/producttestuser');

      expect(res.status).toBe(200);
      const product = res.body.data.products[0];
      expect(product.seller).toHaveProperty('name', 'Product Test User');
      expect(product.seller).toHaveProperty('username', 'producttestuser');
    });

    it('should be a public endpoint (no auth required)', async () => {
      const res = await request(app).get('/api/products/user/producttestuser');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return products sorted by newest first', async () => {
      const res = await request(app).get('/api/products/user/producttestuser?limit=15');

      expect(res.status).toBe(200);
      const dates = res.body.data.products.map((p: { createdAt: string }) => new Date(p.createdAt).getTime());
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i - 1]).toBeGreaterThanOrEqual(dates[i]);
      }
    });
  });

  // --------------------------------------------------------------------------
  // GET /api/products — Performance Tests
  // --------------------------------------------------------------------------
  describe('GET /api/products (performance)', () => {
    beforeAll(async () => {
      await Product.deleteMany({});

      const user = await User.findOne({ email: 'productuser@example.com' });
      const categories = ['Electronics', 'Clothing', 'Books', 'Sports', 'Home & Garden'];
      const conditions: Array<'New' | 'Like New' | 'Good' | 'Fair'> = ['New', 'Like New', 'Good', 'Fair'];

      const bulkOps = [];
      for (let i = 0; i < 200; i++) {
        bulkOps.push({
          title: `Performance Product ${i}`,
          description: `This is the description for performance test product number ${i}`,
          price: 10 + (i % 100),
          images: ['https://res.cloudinary.com/test/image/upload/test-image.jpg'],
          category: categories[i % categories.length],
          condition: conditions[i % conditions.length],
          seller: user!._id,
          createdAt: new Date(Date.now() - (200 - i) * 1000),
        });
      }
      await Product.insertMany(bulkOps);
    });

    it('should return paginated response within 200ms for 200 products', async () => {
      const start = Date.now();
      const res = await request(app).get('/api/products');
      const elapsed = Date.now() - start;

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.totalProducts).toBe(200);
      expect(elapsed).toBeLessThan(200);
    });

    it('should return filtered + searched response within 200ms', async () => {
      const start = Date.now();
      const res = await request(app).get('/api/products?category=Electronics&search=performance');
      const elapsed = Date.now() - start;

      expect(res.status).toBe(200);
      expect(res.body.data.products.length).toBeGreaterThan(0);
      expect(elapsed).toBeLessThan(200);
    });

    it('should return correct remainder count on last page', async () => {
      // 200 products, default limit 12 => 200/12 = 16 full pages + 8 remaining = 17 pages
      const res = await request(app).get('/api/products?page=17');

      expect(res.status).toBe(200);
      expect(res.body.data.products).toHaveLength(8);
      expect(res.body.data.pagination.hasMore).toBe(false);
    });

    afterAll(async () => {
      await Product.deleteMany({});
    });
  });

  // --------------------------------------------------------------------------
  // Security Tests
  // --------------------------------------------------------------------------
  describe('Security', () => {
    it('should reject non-image file uploads', async () => {
      const textBuffer = Buffer.from('this is a text file, not an image');

      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Valid Title')
        .field('description', 'A valid product description here')
        .field('price', '29.99')
        .field('category', 'Electronics')
        .field('condition', 'New')
        .attach('images', textBuffer, { filename: 'test.txt', contentType: 'text/plain' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should set product seller from JWT, not from request body', async () => {
      const fakeObjectId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Seller Test Product')
        .field('description', 'Testing that seller comes from JWT not body')
        .field('price', '19.99')
        .field('category', 'Clothing')
        .field('condition', 'Like New')
        .field('seller', fakeObjectId)
        .attach('images', testImageBuffer, { filename: 'test.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      // The seller should be the authenticated user, not the spoofed value
      expect(res.body.data.seller._id).toBe(testUserId);
      expect(res.body.data.seller._id).not.toBe(fakeObjectId);
    });
  });

  // --------------------------------------------------------------------------
  // PUT /api/products/:id
  // --------------------------------------------------------------------------
  describe('PUT /api/products/:id', () => {
    let productId: string;
    let productImageUrl: string;

    beforeAll(async () => {
      await Product.deleteMany({});

      // Create a product owned by the test user
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Original Product')
        .field('description', 'Original description for update tests')
        .field('price', '100.00')
        .field('category', 'Electronics')
        .field('condition', 'New')
        .attach('images', testImageBuffer, { filename: 'original.jpg', contentType: 'image/jpeg' });

      productId = res.body.data.id;
      productImageUrl = res.body.data.images[0];
    });

    it('should update product with valid data (existing + new images)', async () => {
      const res = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Updated Product')
        .field('description', 'Updated description for the product')
        .field('price', '150.00')
        .field('category', 'Clothing')
        .field('condition', 'Like New')
        .field('existingImages', JSON.stringify([productImageUrl]))
        .attach('images', testImageBuffer, { filename: 'new.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Product updated successfully');
      expect(res.body.data.title).toBe('Updated Product');
      expect(res.body.data.description).toBe('Updated description for the product');
      expect(res.body.data.price).toBe(150);
      expect(res.body.data.category).toBe('Clothing');
      expect(res.body.data.condition).toBe('Like New');
      expect(res.body.data.images).toHaveLength(2);
      expect(res.body.data.images[0]).toBe(productImageUrl);
      expect(res.body.data.seller).toHaveProperty('name', 'Product Test User');
      expect(res.body.data.seller).toHaveProperty('username', 'producttestuser');

      // Update the stored image URL for subsequent tests
      productImageUrl = res.body.data.images[0];
    });

    it('should keep only existing images (no new uploads)', async () => {
      const res = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Keep Images Product')
        .field('description', 'Keeping only existing images here')
        .field('price', '120.00')
        .field('category', 'Electronics')
        .field('condition', 'Good')
        .field('existingImages', JSON.stringify([productImageUrl]));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.images).toHaveLength(1);
      expect(res.body.data.images[0]).toBe(productImageUrl);
    });

    it('should replace all images with new uploads (empty existingImages)', async () => {
      const res = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'New Images Product')
        .field('description', 'Replacing all images with new ones')
        .field('price', '130.00')
        .field('category', 'Electronics')
        .field('condition', 'New')
        .field('existingImages', JSON.stringify([]))
        .attach('images', testImageBuffer, { filename: 'replace1.jpg', contentType: 'image/jpeg' })
        .attach('images', testImageBuffer, { filename: 'replace2.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.images).toHaveLength(2);

      // Update stored URL for subsequent tests
      productImageUrl = res.body.data.images[0];
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app)
        .put(`/api/products/${productId}`)
        .field('title', 'No Auth Update')
        .field('description', 'Attempting to update without auth')
        .field('price', '50.00')
        .field('category', 'Electronics')
        .field('condition', 'New')
        .field('existingImages', JSON.stringify([productImageUrl]));

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 with invalid auth token', async () => {
      const res = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', 'Bearer invalid-jwt-token')
        .field('title', 'Invalid Auth Update')
        .field('description', 'Attempting to update with invalid auth')
        .field('price', '50.00')
        .field('category', 'Electronics')
        .field('condition', 'New')
        .field('existingImages', JSON.stringify([productImageUrl]));

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 403 when non-owner tries to edit', async () => {
      // Register a second user
      await request(app).post('/api/auth/register').send({
        name: 'Other User',
        username: 'otheruser',
        email: 'otheruser@example.com',
        password: 'password123',
      });

      await User.updateOne(
        { email: 'otheruser@example.com' },
        { $set: { isVerified: true, verificationToken: undefined } },
      );

      const loginRes = await request(app).post('/api/auth/login').send({
        email: 'otheruser@example.com',
        password: 'password123',
      });

      const otherToken = loginRes.body.data.token;

      const res = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .field('title', 'Unauthorized Update')
        .field('description', 'Non-owner attempting to edit product')
        .field('price', '50.00')
        .field('category', 'Electronics')
        .field('condition', 'New')
        .field('existingImages', JSON.stringify([productImageUrl]));

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('not authorized');
    });

    it('should return 404 for non-existent product', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .put(`/api/products/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Ghost Product')
        .field('description', 'Updating a product that does not exist')
        .field('price', '50.00')
        .field('category', 'Electronics')
        .field('condition', 'New')
        .field('existingImages', JSON.stringify([]));

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Product not found');
    });

    it('should return 400 for invalid ObjectId', async () => {
      const res = await request(app)
        .put('/api/products/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Invalid ID Product')
        .field('description', 'Updating with an invalid product ID')
        .field('price', '50.00')
        .field('category', 'Electronics')
        .field('condition', 'New')
        .field('existingImages', JSON.stringify([]));

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid product ID');
    });

    it('should return 400 when title is missing', async () => {
      const res = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .field('description', 'Description without a title')
        .field('price', '50.00')
        .field('category', 'Electronics')
        .field('condition', 'New')
        .field('existingImages', JSON.stringify([productImageUrl]));

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when title is too short (< 3 chars)', async () => {
      const res = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Ab')
        .field('description', 'Valid description for the product')
        .field('price', '50.00')
        .field('category', 'Electronics')
        .field('condition', 'New')
        .field('existingImages', JSON.stringify([productImageUrl]));

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when description is too short (< 10 chars)', async () => {
      const res = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Valid Title')
        .field('description', 'Short')
        .field('price', '50.00')
        .field('category', 'Electronics')
        .field('condition', 'New')
        .field('existingImages', JSON.stringify([productImageUrl]));

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when price is zero', async () => {
      const res = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Valid Title')
        .field('description', 'Valid description for the product')
        .field('price', '0')
        .field('category', 'Electronics')
        .field('condition', 'New')
        .field('existingImages', JSON.stringify([productImageUrl]));

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when price is negative', async () => {
      const res = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Valid Title')
        .field('description', 'Valid description for the product')
        .field('price', '-5')
        .field('category', 'Electronics')
        .field('condition', 'New')
        .field('existingImages', JSON.stringify([productImageUrl]));

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when price is not a number', async () => {
      const res = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Valid Title')
        .field('description', 'Valid description for the product')
        .field('price', 'abc')
        .field('category', 'Electronics')
        .field('condition', 'New')
        .field('existingImages', JSON.stringify([productImageUrl]));

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when condition is invalid enum value', async () => {
      const res = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Valid Title')
        .field('description', 'Valid description for the product')
        .field('price', '50.00')
        .field('category', 'Electronics')
        .field('condition', 'Terrible')
        .field('existingImages', JSON.stringify([productImageUrl]));

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when 0 images total (empty existingImages and no new files)', async () => {
      const res = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Valid Title')
        .field('description', 'Valid description for the product')
        .field('price', '50.00')
        .field('category', 'Electronics')
        .field('condition', 'New')
        .field('existingImages', JSON.stringify([]));

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('At least one image is required');
    });

    it('should return 400 when more than 5 images total', async () => {
      // 3 existing + 3 new = 6 total > 5
      // First, create a product with 3 images
      const createRes = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Multi Image Product')
        .field('description', 'Product with multiple images for limit test')
        .field('price', '50.00')
        .field('category', 'Electronics')
        .field('condition', 'New')
        .attach('images', testImageBuffer, { filename: 'img1.jpg', contentType: 'image/jpeg' })
        .attach('images', testImageBuffer, { filename: 'img2.jpg', contentType: 'image/jpeg' })
        .attach('images', testImageBuffer, { filename: 'img3.jpg', contentType: 'image/jpeg' });

      const multiProductId = createRes.body.data.id;
      const existingImgs = createRes.body.data.images;

      const res = await request(app)
        .put(`/api/products/${multiProductId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Too Many Images')
        .field('description', 'Trying to exceed the image limit')
        .field('price', '50.00')
        .field('category', 'Electronics')
        .field('condition', 'New')
        .field('existingImages', JSON.stringify(existingImgs))
        .attach('images', testImageBuffer, { filename: 'new1.jpg', contentType: 'image/jpeg' })
        .attach('images', testImageBuffer, { filename: 'new2.jpg', contentType: 'image/jpeg' })
        .attach('images', testImageBuffer, { filename: 'new3.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Maximum 5 images allowed');
    });

    it('should return 400 when existingImages URL is not in product (URL injection attempt)', async () => {
      const res = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'URL Injection')
        .field('description', 'Attempting to inject a foreign image URL')
        .field('price', '50.00')
        .field('category', 'Electronics')
        .field('condition', 'New')
        .field('existingImages', JSON.stringify(['https://evil.com/malicious-image.jpg']));

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid existing image URL');
    });
  });
});
