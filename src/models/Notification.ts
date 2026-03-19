//generate model for notification notification types are "booking-confirmation", "booking-cancellation", "chef-application-status", "general-announcement", "procurement-update", "menu-update", "service-update", "payment-receipt", "feedback-request", "event-invitation", "system-alert"

import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema: Schema = new Schema({
  userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: [
      'booking-confirmation',
      'booking-cancellation',
      'chef-application-status',
      'general-announcement',
      'procurement-update',
      'menu-update',
      'service-update',
      'payment-receipt',
      'feedback-request',
      'event-invitation',
      'system-alert'
    ],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
}, {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform(_doc, ret: any) {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  });

export default mongoose.model<INotification>('Notification', NotificationSchema);