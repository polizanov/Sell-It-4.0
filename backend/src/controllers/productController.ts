import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import mongoose, { FilterQuery } from 'mongoose';
import { IProduct, Product } from '../models/Product';
import { Favourite } from '../models/Favourite';
import { uploadToCloudinary } from '../middleware/upload';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../types';
import { User } from '../models/User';
import { mapProductToResponse } from '../utils/productHelpers';

const SORT_OPTIONS: Record<string, Record<string, 1 | -1>> = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
};

// Categories cache with TTL
let categoriesCache: { data: string[], timestamp: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Get all products with pagination and filtering
 *
 * @route GET /api/products
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Items per page (default: 12, max: 50)
 * @param {string} search - Search term for title/description (uses text index)
 * @param {string} category - Filter by category
 * @param {string} sort - Sort option (newest, oldest, price_asc, price_desc)
 *
 * @returns {Object} response
 * @returns {boolean} response.success - Operation success status
 * @returns {string} response.message - Response message
 * @returns {Object} response.data - Product data
 * @returns {Array<Product>} response.data.products - Array of product objects
 * @returns {Object} response.data.pagination - Pagination metadata
 * @returns {number} response.data.pagination.currentPage - Current page number
 * @returns {number} response.data.pagination.totalPages - Total number of pages
 * @returns {number} response.data.pagination.totalProducts - Total product count
 * @returns {number} response.data.pagination.limit - Items per page
 * @returns {boolean} response.data.pagination.hasMore - Whether more pages exist
 *
 * @example
 * // Request: GET /api/products?page=1&limit=20&category=Electronics&sort=newest
 * // Response:
 * {
 *   "success": true,
 *   "message": "Products retrieved successfully",
 *   "data": {
 *     "products": [{
 *       "id": "123",
 *       "title": "iPhone 15",
 *       "description": "Brand new",
 *       "price": 999.99,
 *       "images": ["url1"],
 *       "category": "Electronics",
 *       "condition": "New",
 *       "seller": { "id": "456", "username": "john", "email": "john@example.com" },
 *       "createdAt": "2024-01-01T00:00:00Z",
 *       "updatedAt": "2024-01-01T00:00:00Z"
 *     }],
 *     "pagination": {
 *       "currentPage": 1,
 *       "totalPages": 5,
 *       "totalProducts": 100,
 *       "limit": 20,
 *       "hasMore": true
 *     }
 *   }
 * }
 */
export const getAllProducts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 50);
  const category = req.query.category as string | undefined;
  const search = req.query.search as string | undefined;
  const sort = (req.query.sort as string) || 'newest';

  const filter: FilterQuery<IProduct> = {};

  if (category) {
    filter.category = category;
  }

  if (search) {
    // Use text index for better performance and security (prevents ReDoS)
    filter.$text = { $search: search };
  }

  const sortOption = SORT_OPTIONS[sort] || SORT_OPTIONS.newest;
  const skip = (page - 1) * limit;

  const [products, totalProducts] = await Promise.all([
    Product.find(filter).sort(sortOption).skip(skip).limit(limit).populate('seller', 'name username'),
    Product.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalProducts / limit);

  res.json({
    success: true,
    message: 'Products retrieved successfully',
    data: {
      products: products.map(mapProductToResponse),
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts,
        limit,
        hasMore: page < totalPages,
      },
    },
  });
});

/**
 * Create a new product
 *
 * @route POST /api/products
 * @access Protected - Requires authentication
 * @param {string} title - Product title (3-100 characters)
 * @param {string} description - Product description (10-2000 characters)
 * @param {number} price - Product price (minimum 0.01)
 * @param {string} category - Product category (max 50 characters)
 * @param {string} condition - Product condition (New, Like New, Good, Fair)
 * @param {File[]} images - Product images (1-5 images, max 5MB each, JPEG/PNG/WebP)
 *
 * @returns {Object} response
 * @returns {boolean} response.success - Operation success status
 * @returns {string} response.message - Response message
 * @returns {Product} response.data - Created product object
 *
 * @example
 * // Request: POST /api/products (multipart/form-data)
 * // Headers: { Authorization: "Bearer <token>" }
 * // Body: { title, description, price, category, condition, images }
 * // Response:
 * {
 *   "success": true,
 *   "message": "Product created successfully",
 *   "data": {
 *     "id": "123",
 *     "title": "iPhone 15",
 *     "description": "Brand new iPhone",
 *     "price": 999.99,
 *     "images": ["cloudinary-url"],
 *     "category": "Electronics",
 *     "condition": "New",
 *     "seller": { "id": "456", "username": "john", "email": "john@example.com" },
 *     "createdAt": "2024-01-01T00:00:00Z",
 *     "updatedAt": "2024-01-01T00:00:00Z"
 *   }
 * }
 */
export const createProduct = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { title, description, price, category, condition } = req.body;
  const files = req.files as Express.Multer.File[];

  if (!files || files.length === 0) {
    throw new AppError('At least one image is required', 400);
  }

  const imageUrls = await Promise.all(
    files.map((file) => uploadToCloudinary(file.buffer, 'products')),
  );

  const product = await Product.create({
    title,
    description,
    price: parseFloat(price),
    images: imageUrls,
    category,
    condition,
    seller: req.user!.userId,
  });

  await product.populate('seller', 'name username');

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: mapProductToResponse(product),
  });
});

export const getCategories = asyncHandler(async (_req: AuthRequest, res: Response): Promise<void> => {
  const now = Date.now();
  const isTestEnv = process.env.NODE_ENV === 'test';

  // Skip cache in test environment to avoid stale data between tests
  if (!isTestEnv && categoriesCache && (now - categoriesCache.timestamp) < CACHE_TTL) {
    res.json({
      success: true,
      message: 'Categories retrieved successfully',
      data: categoriesCache.data
    });
    return;
  }

  // Refresh cache
  const categories = await Product.distinct('category');
  categories.sort((a: string, b: string) => a.localeCompare(b));

  if (!isTestEnv) {
    categoriesCache = { data: categories, timestamp: now };
  }

  res.json({
    success: true,
    message: 'Categories retrieved successfully',
    data: categories,
  });
});

/**
 * Get a single product by ID
 *
 * @route GET /api/products/:id
 * @param {string} id - Product ID (MongoDB ObjectId)
 *
 * @returns {Object} response
 * @returns {boolean} response.success - Operation success status
 * @returns {string} response.message - Response message
 * @returns {Product} response.data - Product object with populated seller info
 *
 * @throws {400} Invalid product ID
 * @throws {404} Product not found
 *
 * @example
 * // Request: GET /api/products/507f1f77bcf86cd799439011
 * // Response:
 * {
 *   "success": true,
 *   "message": "Product retrieved successfully",
 *   "data": {
 *     "id": "507f1f77bcf86cd799439011",
 *     "title": "iPhone 15",
 *     "description": "Brand new",
 *     "price": 999.99,
 *     "images": ["url"],
 *     "category": "Electronics",
 *     "condition": "New",
 *     "seller": { "id": "456", "username": "john", "email": "john@example.com" },
 *     "createdAt": "2024-01-01T00:00:00Z",
 *     "updatedAt": "2024-01-01T00:00:00Z"
 *   }
 * }
 */
export const getProductById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw new AppError('Invalid product ID', 400);
  }

  const product = await Product.findById(id).populate('seller', 'name username');

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  res.json({
    success: true,
    message: 'Product retrieved successfully',
    data: mapProductToResponse(product),
  });
});

export const updateProduct = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw new AppError('Invalid product ID', 400);
  }

  const product = await Product.findById(id);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  if (product.seller.toString() !== req.user!.userId) {
    throw new AppError('You are not authorized to edit this product', 403);
  }

  const { title, description, price, category, condition } = req.body;

  let existingImages: string[] = [];
  if (req.body.existingImages) {
    existingImages = JSON.parse(req.body.existingImages);
  }

  for (const url of existingImages) {
    if (!product.images.includes(url)) {
      throw new AppError('Invalid existing image URL', 400);
    }
  }

  const files = req.files as Express.Multer.File[];
  const newImageUrls = files && files.length > 0
    ? await Promise.all(files.map((file) => uploadToCloudinary(file.buffer, 'products')))
    : [];

  const allImages = [...existingImages, ...newImageUrls];

  if (allImages.length === 0) {
    throw new AppError('At least one image is required', 400);
  }

  if (allImages.length > 5) {
    throw new AppError('Maximum 5 images allowed', 400);
  }

  product.title = title;
  product.description = description;
  product.price = parseFloat(price);
  product.category = category;
  product.condition = condition;
  product.images = allImages;

  await product.save();
  await product.populate('seller', 'name username');

  res.json({
    success: true,
    message: 'Product updated successfully',
    data: mapProductToResponse(product),
  });
});

export const getUserProducts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const username = req.params.username as string;
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 50);
  const skip = (page - 1) * limit;

  const user = await User.findOne({ username: username.toLowerCase() }).select('name username createdAt');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const [products, totalProducts] = await Promise.all([
    Product.find({ seller: user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('seller', 'name username'),
    Product.countDocuments({ seller: user._id }),
  ]);

  const totalPages = Math.ceil(totalProducts / limit);

  res.json({
    success: true,
    message: 'User products retrieved successfully',
    data: {
      user: {
        name: user.name,
        username: user.username,
        memberSince: user.createdAt,
      },
      products: products.map(mapProductToResponse),
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts,
        limit,
        hasMore: page < totalPages,
      },
    },
  });
});

export const deleteProduct = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw new AppError('Invalid product ID', 400);
  }

  const product = await Product.findById(id);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  if (product.seller.toString() !== req.user!.userId) {
    throw new AppError('You are not authorized to delete this product', 403);
  }

  await Favourite.deleteMany({ product: id });
  await Product.findByIdAndDelete(id);

  res.json({
    success: true,
    message: 'Product deleted successfully',
  });
});
