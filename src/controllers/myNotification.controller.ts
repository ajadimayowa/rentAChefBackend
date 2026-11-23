import { Request, Response } from "express";
import mongoose from "mongoose";
import Notification from "../models/Notification";

/*
 * The signed-in chef's/customer's own notification feed (chef portal bell).
 * Always scoped to req.user — callers can't read anyone else's notifications.
 */

const ownFilter = (user: any) => ({ $or: [{ recipientUserId: user._id }, { userId: user._id }] });

// GET /me/notifications?limit=
export const listMyNotifications = async (req: Request, res: Response): Promise<any> => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const items = await Notification.find(ownFilter((req as any).user)).sort({ createdAt: -1 }).limit(limit).lean();
    return res.status(200).json({
      success: true,
      payload: items.map((n: any) => ({
        id: String(n._id),
        type: n.type ?? "system-alert",
        title: n.title,
        message: n.message ?? n.body ?? "",
        link: n.link,
        isRead: Boolean(n.isRead),
        createdAt: n.createdAt,
      })),
    });
  } catch (error) {
    console.error("listMyNotifications error:", error);
    return res.status(500).json({ success: false, message: "Could not load notifications" });
  }
};

// GET /me/notifications/unread-count
export const myNotificationUnreadCount = async (req: Request, res: Response): Promise<any> => {
  try {
    const count = await Notification.countDocuments({ ...ownFilter((req as any).user), isRead: false });
    return res.status(200).json({ success: true, payload: { count } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Could not load unread count" });
  }
};

// POST /me/notifications/:id/read
export const markMyNotificationRead = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid notification id" });
    }
    await Notification.updateOne(
      { _id: id, ...ownFilter((req as any).user) },
      { $set: { isRead: true, readAt: new Date() } }
    );
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Could not mark as read" });
  }
};

// POST /me/notifications/read-all
export const markAllMyNotificationsRead = async (req: Request, res: Response): Promise<any> => {
  try {
    await Notification.updateMany(
      { ...ownFilter((req as any).user), isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Could not mark all as read" });
  }
};
