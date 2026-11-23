import mongoose from "mongoose";
import Notification from "../models/Notification";

interface NotifyUserInput {
  userId: mongoose.Types.ObjectId | string;
  type: string;
  title: string;
  message?: string;
  /** Web-portal path to open on click, e.g. /chef/bookings/123. */
  link?: string;
  /** Id of the record it's about — the mobile app opens that booking on tap. */
  resourceId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Posts an in-app notification to one chef/customer. Both userId and
 * recipientUserId are set so the mobile app (?userId=) and the web portal
 * (/me/notifications) see it. Never throws — a failed notification must not
 * fail the booking update that triggered it.
 */
export async function notifyUser(input: NotifyUserInput): Promise<void> {
  try {
    await Notification.create({
      userId: input.userId,
      recipientUserId: input.userId,
      type: input.type,
      channel: "IN_APP",
      title: input.title,
      message: input.message ?? "",
      link: input.link,
      resourceId: input.resourceId,
      metadata: input.metadata,
      sentAt: new Date(),
    });
  } catch (error) {
    console.error("notifyUser failed:", error);
  }
}
