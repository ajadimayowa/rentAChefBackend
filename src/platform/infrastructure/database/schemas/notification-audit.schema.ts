import { model, models, Schema } from 'mongoose';
import { NotificationChannel } from '../../../domain/enums';

const notificationSchema = new Schema(
  {
    recipientUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    channel: { type: String, enum: Object.values(NotificationChannel), required: true, index: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
    sentAt: { type: Date },
    readAt: { type: Date },
  },
  { timestamps: true },
);

notificationSchema.index({ recipientUserId: 1, createdAt: -1 });

const auditLogSchema = new Schema(
  {
    actorId: { type: String, required: true, index: true },
    action: { type: String, required: true, index: true },
    entityType: { type: String, required: true, index: true },
    entityId: { type: String, required: true, index: true },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true },
);

auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

export const ChefPlatformNotificationModel = models.Notification || model('Notification', notificationSchema);
export const ChefPlatformAuditLogModel = models.AuditLog || model('AuditLog', auditLogSchema);
