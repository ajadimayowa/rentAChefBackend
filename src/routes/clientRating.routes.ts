import express from 'express';
import { chefOrAdmin } from '../middleware/chefOrAdmin.middleware';
import { verifyToken } from '../middleware/auth.middleware';
import { addOrUpdateClientRating, getClientRatings } from '../controllers/clientRating.controller';

const router = express.Router();

// Chefs (or admin) rate clients for a booking
router.post('/booking/:bookingId/client/rating', chefOrAdmin, addOrUpdateClientRating);

// Get ratings for a client
router.get('/client/:clientId/ratings', verifyToken, getClientRatings);

export default router;
