import { Request, Response } from 'express';
import Notification from '../models/Notification';

/** Create a notification */
export const createNotification = async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId, type, title, message, isRead } = req.body;

    if (!userId || !type || !title || !message) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const notification = await Notification.create({ userId, type, title, message, isRead });

    return res.status(201).json({ success: true, payload: notification });
  } catch (error: any) {
    console.error('createNotification error', error);
    return res.status(500).json({ success: false, message: 'Failed to create notification', error: error.message });
  }
};

/** Get notifications (for a user by default) */
export const getNotifications = async (req: Request, res: Response): Promise<any> => {
  try {
    const { page = 1, limit = 20, userId } = req.query;

    // prefer explicit query userId, otherwise use authenticated user
    const targetUserId = (userId as string) || ((req as any).user && (req as any).user._id);

    const query: any = {};
    if (targetUserId) query.userId = targetUserId;

    const skip = (Number(page) - 1) * Number(limit);

    const items = await Notification.find(query)
      .sort({ createdAt: -1 })
      .populate('userId', 'fullName email') // populate user details if needed
      .skip(skip)
      .limit(Number(limit));

    const total = await Notification.countDocuments(query);

    return res.json({
      success: true,
      payload: items,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    });
  } catch (error: any) {
    console.error('getNotifications error', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications', error: error.message });
  }
};

/** Get single notification */
export const getNotification = async (req: Request, res: Response): Promise<any> => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
    return res.json({ success: true, payload: notification });
  } catch (error: any) {
    console.error('getNotification error', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch notification', error: error.message });
  }
};

/** Update notification (eg. mark as read) */
export const updateNotification = async (req: Request, res: Response): Promise<any> => {
  try {
    const notification = await Notification.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
    return res.json({ success: true, message: 'Notification updated', payload: notification });
  } catch (error: any) {
    console.error('updateNotification error', error);
    return res.status(500).json({ success: false, message: 'Failed to update notification', error: error.message });
  }
};

/** Delete notification */
export const deleteNotification = async (req: Request, res: Response): Promise<any> => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
    return res.json({ success: true, message: 'Notification deleted' });
  } catch (error: any) {
    console.error('deleteNotification error', error);
    return res.status(500).json({ success: false, message: 'Failed to delete notification', error: error.message });
  }
};

/** Mark notification as read */
export const markAsRead = async (req: Request, res: Response): Promise<any> => {
  try {
    const notification = await Notification.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
    return res.json({ success: true, message: 'Notification marked as read', payload: notification });
  } catch (error: any) {
    console.error('markAsRead error', error);
    return res.status(500).json({ success: false, message: 'Failed to mark notification as read', error: error.message });
  }
};
