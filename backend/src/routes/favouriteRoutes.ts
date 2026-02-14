import { Router } from 'express';
import {
  addFavourite,
  removeFavourite,
  getFavourites,
  getFavouriteIds,
} from '../controllers/favouriteController';
import { protect, requireVerified } from '../middleware/authMiddleware';

const router = Router();

router.get('/', protect, getFavourites);
router.get('/ids', protect, getFavouriteIds);
router.post('/:productId', protect, requireVerified, addFavourite);
router.delete('/:productId', protect, requireVerified, removeFavourite);

export default router;
