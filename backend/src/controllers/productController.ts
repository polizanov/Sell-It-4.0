import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import mongoose, { FilterQuery } from 'mongoose';
import { IProduct, Product } from '../models/Product';
import { uploadToCloudinary } from '../middleware/upload';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../types';

const SORT_OPTIONS: Record<string, Record<string, 1 | -1>> = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
};

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
    const regex = new RegExp(search, 'i');
    filter.$or = [{ title: regex }, { description: regex }];
  }

  const sortOption = SORT_OPTIONS[sort] || SORT_OPTIONS.newest;
  const skip = (page - 1) * limit;

  const [products, totalProducts] = await Promise.all([
    Product.find(filter).sort(sortOption).skip(skip).limit(limit).populate('seller', 'name'),
    Product.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalProducts / limit);

  res.json({
    success: true,
    message: 'Products retrieved successfully',
    data: {
      products: products.map((product) => ({
        id: product._id,
        title: product.title,
        description: product.description,
        price: product.price,
        images: product.images,
        category: product.category,
        condition: product.condition,
        seller: product.seller,
        createdAt: product.createdAt,
      })),
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

  await product.populate('seller', 'name');

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: {
      id: product._id,
      title: product.title,
      description: product.description,
      price: product.price,
      images: product.images,
      category: product.category,
      condition: product.condition,
      seller: product.seller,
      createdAt: product.createdAt,
    },
  });
});

export const getCategories = asyncHandler(async (_req: AuthRequest, res: Response): Promise<void> => {
  const categories = await Product.distinct('category');
  categories.sort((a: string, b: string) => a.localeCompare(b));

  res.json({
    success: true,
    message: 'Categories retrieved successfully',
    data: categories,
  });
});

export const getProductById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw new AppError('Invalid product ID', 400);
  }

  const product = await Product.findById(id).populate('seller', 'name');

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  res.json({
    success: true,
    message: 'Product retrieved successfully',
    data: {
      id: product._id,
      title: product.title,
      description: product.description,
      price: product.price,
      images: product.images,
      category: product.category,
      condition: product.condition,
      seller: product.seller,
      createdAt: product.createdAt,
    },
  });
});
