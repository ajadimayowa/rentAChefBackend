import mongoose, { Document, Schema } from "mongoose";

/**
 * Feed shown on the admin portal's notification bell. Kept apart from the
 * customer/chef Notification collection; every admin sees the same feed and has
 * their own read state (readBy).
 */
export type AdminNotificationType =
  | "new-booking"
  | "new-customer"
  | "payment-confirmed"
  | "chef-accepted"
  | "chef-declined"
  | "system";

export interface IAdminNotification extends Document {
  type: AdminNotificationType;
  title: string;
  message: string;
  /** Admin-portal path to open when the notification is clicked, e.g. /admin/bookings/123. */
  link?: string;
  metadata?: Record<string, unknown>;
  readBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const AdminNotificationSchema = new Schema<IAdminNotification>(
  {
    type: {
      type: String,
      enum: ["new-booking", "new-customer", "payment-confirmed", "chef-accepted", "chef-declined", "system"],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, default: "" },
    link: { type: String },
    metadata: { type: Schema.Types.Mixed },
    readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

AdminNotificationSchema.index({ createdAt: -1 });

export const AdminNotification = mongoose.model<IAdminNotification>(
  "AdminNotification",
  AdminNotificationSchema
);
