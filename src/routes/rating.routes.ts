import express from 'express';
import { auth } from '../middleware/customer.middleware';
import { addOrUpdateRating, getMenuRatings } from '../controllers/rating.controller';
import { verifyUserToken } from '../middleware/auth.middleware';
import { adminAuth } from '../middleware/adminAuth';

const router = express.Router();

router.post('/specialmenu/:menuId/rating', verifyUserToken, addOrUpdateRating);
router.get('/specialmenu/:menuId/ratings',adminAuth, getMenuRatings);



export default router;
