import { Request, Response } from "express";
import mongoose from "mongoose";
import { AdminNotification } from "../models/AdminNotification";

/*
 * Admin notification bell. The feed is shared by all admins; read state is per
 * admin (readBy). An admin only sees notifications from after their account was
 * created, so a new admin doesn't start with a backlog of "unread" items.
 */

const feedFilterFor = (admin: any) => ({ createdAt: { $gte: admin.createdAt ?? new Date(0) } });

// GET /admin/notifications?limit=
export const listAdminNotifications = async (req: Request, res: Response): Promise<any> => {
  try {
    const admin = (req as any).user;
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const items = await AdminNotification.find(feedFilterFor(admin)).sort({ createdAt: -1 }).limit(limit).lean();

    const adminId = String(admin._id);
    return res.status(200).json({
      success: true,
      payload: items.map((n: any) => ({
        id: String(n._id),
        type: n.type,
        title: n.title,
        message: n.message,
        link: n.link,
        isRead: (n.readBy ?? []).some((id: any) => String(id) === adminId),
        createdAt: n.createdAt,
      })),
    });
  } catch (error) {
    console.error("listAdminNotifications error:", error);
    return res.status(500).json({ success: false, message: "Could not load notifications" });
  }
};

// GET /admin/notifications/unread-count
export const adminNotificationUnreadCount = async (req: Request, res: Response): Promise<any> => {
  try {
    const admin = (req as any).user;
    const count = await AdminNotification.countDocuments({ ...feedFilterFor(admin), readBy: { $ne: admin._id } });
    return res.status(200).json({ success: true, payload: { count } });
  } catch (error) {
    console.error("adminNotification error:", error);
    return res.status(500).json({ success: false, message: "Could not load unread count" });
  }
};

// POST /admin/notifications/:id/read
export const markAdminNotificationRead = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid notification id" });
    }
    await AdminNotification.updateOne({ _id: id }, { $addToSet: { readBy: (req as any).user._id } });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("adminNotification error:", error);
    return res.status(500).json({ success: false, message: "Could not mark as read" });
  }
};

// POST /admin/notifications/read-all
export const markAllAdminNotificationsRead = async (req: Request, res: Response): Promise<any> => {
  try {
    const admin = (req as any).user;
    await AdminNotification.updateMany(
      { ...feedFilterFor(admin), readBy: { $ne: admin._id } },
      { $addToSet: { readBy: admin._id } }
    );
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("adminNotification error:", error);
    return res.status(500).json({ success: false, message: "Could not mark all as read" });
  }
};
