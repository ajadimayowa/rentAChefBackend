import { Router } from 'express';
import {
  createNotification,
  getNotifications,
  getNotification,
  updateNotification,
  deleteNotification,
  markAsRead,
} from '../controllers/notification.controller';
import { verifyUserToken } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/isAdmin';
import { adminAuth } from '../middleware/adminAuth';

const router = Router();

// Create notification (protected)
router.post('/notification/create', adminAuth, createNotification);

// Get notifications for user (public read) - requires `userId` query param or authenticated user
router.get('/notifications', getNotifications);


// Get single notification
router.get('/notification/:id', verifyUserToken, getNotification);

// Update notification
router.put('/notification/:id', verifyUserToken, updateNotification);

// Mark as read
router.put('/notification/:id/read', verifyUserToken, markAsRead);

// Delete notification
router.delete('/notification/:id', verifyUserToken, deleteNotification);

export default router;
