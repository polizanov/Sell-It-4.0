import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import { Product } from '../models/Product';
import { uploadToCloudinary } from '../middleware/upload';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../types';

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
