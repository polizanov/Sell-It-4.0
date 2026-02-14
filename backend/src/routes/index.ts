import { Router } from 'express';
import authRoutes from './authRoutes';
import productRoutes from './productRoutes';
import favouriteRoutes from './favouriteRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/favourites', favouriteRoutes);

export default router;
