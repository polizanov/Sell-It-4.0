import { Router } from 'express';
import {
  addFavourite,
  removeFavourite,
  getFavourites,
  getFavouriteIds,
} from '../controllers/favouriteController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/', protect, getFavourites);
router.get('/ids', protect, getFavouriteIds);
router.post('/:productId', protect, addFavourite);
router.delete('/:productId', protect, removeFavourite);

export default router;
