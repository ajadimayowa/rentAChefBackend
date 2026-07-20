//generate model for notification notification types are "booking-confirmation", "booking-cancellation", "chef-application-status", "general-announcement", "procurement-update", "menu-update", "service-update", "payment-receipt", "feedback-request", "event-invitation", "system-alert"

import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  userId?: mongoose.Types.ObjectId;
  recipientUserId?: mongoose.Types.ObjectId;
  type?: string;
  channel?: 'PUSH' | 'EMAIL' | 'SMS' | 'IN_APP';
  title: string;
  message?: string;
  body?: string;
  metadata?: Record<string, unknown>;
  isRead: boolean;
  sentAt?: Date;
  readAt?: Date;
  createdAt: Date;
}

const NotificationSchema: Schema = new Schema({
  userId: { type: mongoose.Types.ObjectId, ref: 'User', index: true },
  recipientUserId: { type: mongoose.Types.ObjectId, ref: 'User', index: true },
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
  },
  channel: {
    type: String,
    enum: ['PUSH', 'EMAIL', 'SMS', 'IN_APP'],
    index: true,
  },
  title: { type: String, required: true },
  message: { type: String },
  body: { type: String },
  metadata: { type: Schema.Types.Mixed },
  isRead: { type: Boolean, default: false },
  sentAt: { type: Date },
  readAt: { type: Date },
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

NotificationSchema.index({ recipientUserId: 1, createdAt: -1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);