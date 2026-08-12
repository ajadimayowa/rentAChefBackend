import express from 'express';
import { addOrUpdateRating, getMenuRatings } from '../controllers/rating.controller';
import { verifyUserToken } from '../middleware/auth.middleware';
import { requireAdminAuth } from '../middleware/auth/adminAuth.middleware';

const router = express.Router();

router.post('/specialmenu/:menuId/rating', verifyUserToken, addOrUpdateRating);
router.get('/specialmenu/:menuId/ratings',requireAdminAuth, getMenuRatings);



export default router;
