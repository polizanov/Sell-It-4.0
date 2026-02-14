import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import { Favourite } from '../models/Favourite';
import { Product } from '../models/Product';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../types';

export const addFavourite = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { productId } = req.params;

  if (!mongoose.isValidObjectId(productId)) {
    throw new AppError('Invalid product ID', 400);
  }

  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  if (product.seller.toString() === req.user!.userId) {
    throw new AppError('You cannot favourite your own product', 403);
  }

  const existing = await Favourite.findOne({ user: req.user!.userId, product: productId });

  if (existing) {
    throw new AppError('Product is already in your favourites', 409);
  }

  const favourite = await Favourite.create({
    user: req.user!.userId,
    product: productId,
  });

  res.status(201).json({
    success: true,
    message: 'Product added to favourites',
    data: {
      id: favourite._id,
      productId: favourite.product,
      createdAt: favourite.createdAt,
    },
  });
});

export const removeFavourite = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
      throw new AppError('Invalid product ID', 400);
    }

    const favourite = await Favourite.findOneAndDelete({
      user: req.user!.userId,
      product: productId,
    });

    if (!favourite) {
      throw new AppError('Favourite not found', 404);
    }

    res.json({
      success: true,
      message: 'Product removed from favourites',
    });
  },
);

export const getFavourites = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 50);
    const skip = (page - 1) * limit;

    const filter = { user: req.user!.userId };

    const [favourites, totalProducts] = await Promise.all([
      Favourite.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'product',
          populate: { path: 'seller', select: 'name username' },
        }),
      Favourite.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalProducts / limit);

    const products = favourites
      .filter((fav) => fav.product != null)
      .map((fav) => {
        const product = fav.product as unknown as {
          _id: mongoose.Types.ObjectId;
          title: string;
          description: string;
          price: number;
          images: string[];
          category: string;
          condition: string;
          seller: { name: string; username: string };
          createdAt: Date;
        };
        return {
          id: product._id,
          title: product.title,
          description: product.description,
          price: product.price,
          images: product.images,
          category: product.category,
          condition: product.condition,
          seller: product.seller,
          createdAt: product.createdAt,
        };
      });

    res.json({
      success: true,
      message: 'Favourites retrieved successfully',
      data: {
        products,
        pagination: {
          currentPage: page,
          totalPages,
          totalProducts,
          limit,
          hasMore: page < totalPages,
        },
      },
    });
  },
);

export const getFavouriteIds = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const favourites = await Favourite.find({ user: req.user!.userId }).select('product').lean();

    const productIds = favourites.map((fav) => fav.product.toString());

    res.json({
      success: true,
      message: 'Favourite IDs retrieved successfully',
      data: productIds,
    });
  },
);
