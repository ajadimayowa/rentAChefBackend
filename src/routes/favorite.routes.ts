import express from 'express';
import { auth } from '../middleware/customer.middleware';
import { toggleFavorite, getUserFavorites } from '../controllers/favorite.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = express.Router();

// Toggle favorite for a special menu (add/remove)
router.post('/specialmenu/:menuId/favorite',verifyToken, toggleFavorite);
router.delete('/specialmenu/:menuId/favorite',verifyToken, toggleFavorite);
router.get('/favorites',verifyToken, getUserFavorites);

export default router;
