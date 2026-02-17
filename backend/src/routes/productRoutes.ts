import { Router } from 'express';
import { z } from 'zod';
import { createProduct, deleteProduct, getAllProducts, getCategories, getProductById, getUserProducts, updateProduct } from '../controllers/productController';
import { validate } from '../middleware/validate';
import { protect, requireVerified, requirePhoneVerified } from '../middleware/authMiddleware';
import { upload } from '../middleware/upload';
import { PRODUCT_CATEGORIES } from '../constants/categories';

const router = Router();

const createProductSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title cannot exceed 100 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description cannot exceed 2000 characters'),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Price must be a positive number',
  }),
  category: z.enum(PRODUCT_CATEGORIES, {
    errorMap: () => ({ message: 'Invalid category' }),
  }),
  condition: z.enum(['New', 'Like New', 'Good', 'Fair'], {
    errorMap: () => ({ message: 'Condition must be one of: New, Like New, Good, Fair' }),
  }),
});

const updateProductSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title cannot exceed 100 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description cannot exceed 2000 characters'),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Price must be a positive number',
  }),
  category: z.enum(PRODUCT_CATEGORIES, {
    errorMap: () => ({ message: 'Invalid category' }),
  }),
  condition: z.enum(['New', 'Like New', 'Good', 'Fair'], {
    errorMap: () => ({ message: 'Condition must be one of: New, Like New, Good, Fair' }),
  }),
  existingImages: z.string().optional(),
});

router.get('/', getAllProducts);
router.post('/', protect, requireVerified, requirePhoneVerified, upload.array('images', 5), validate(createProductSchema), createProduct);
router.get('/categories', getCategories);
router.get('/user/:username', getUserProducts);
router.put('/:id', protect, requireVerified, requirePhoneVerified, upload.array('images', 5), validate(updateProductSchema), updateProduct);
router.delete('/:id', protect, requireVerified, requirePhoneVerified, deleteProduct);
router.get('/:id', getProductById);

export default router;
