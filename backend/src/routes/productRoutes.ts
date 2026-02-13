import { Router } from 'express';
import { z } from 'zod';
import { createProduct, getCategories, getProductById } from '../controllers/productController';
import { validate } from '../middleware/validate';
import { protect } from '../middleware/authMiddleware';
import { upload } from '../middleware/upload';

const router = Router();

const createProductSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title cannot exceed 100 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description cannot exceed 2000 characters'),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Price must be a positive number',
  }),
  category: z.string().min(1, 'Category is required').max(50, 'Category cannot exceed 50 characters'),
  condition: z.enum(['New', 'Like New', 'Good', 'Fair'], {
    errorMap: () => ({ message: 'Condition must be one of: New, Like New, Good, Fair' }),
  }),
});

router.post('/', protect, upload.array('images', 5), validate(createProductSchema), createProduct);
router.get('/categories', getCategories);
router.get('/:id', getProductById);

export default router;
