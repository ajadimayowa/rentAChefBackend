import express from 'express';
import { verifyUserToken } from '../middleware/auth.middleware';
import { addOrUpdateChefRating, getChefRatings } from '../controllers/chefRating.controller';

const router = express.Router();

router.post('/chef/:chefId/rating', verifyUserToken, addOrUpdateChefRating);
router.get('/chef/:chefId/ratings', verifyUserToken, getChefRatings);

export default router;
