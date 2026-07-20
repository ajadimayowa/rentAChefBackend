"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChefPlatformAuditLogModel = exports.ChefPlatformNotificationModel = void 0;
const mongoose_1 = require("mongoose");
const enums_1 = require("../../../domain/enums");
const notificationSchema = new mongoose_1.Schema({
    recipientUserId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    channel: { type: String, enum: Object.values(enums_1.NotificationChannel), required: true, index: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    metadata: { type: mongoose_1.Schema.Types.Mixed },
    sentAt: { type: Date },
    readAt: { type: Date },
}, { timestamps: true });
notificationSchema.index({ recipientUserId: 1, createdAt: -1 });
const auditLogSchema = new mongoose_1.Schema({
    actorId: { type: String, required: true, index: true },
    action: { type: String, required: true, index: true },
    entityType: { type: String, required: true, index: true },
    entityId: { type: String, required: true, index: true },
    before: { type: mongoose_1.Schema.Types.Mixed },
    after: { type: mongoose_1.Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
}, { timestamps: true });
auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
exports.ChefPlatformNotificationModel = mongoose_1.models.Notification || (0, mongoose_1.model)('Notification', notificationSchema);
exports.ChefPlatformAuditLogModel = mongoose_1.models.AuditLog || (0, mongoose_1.model)('AuditLog', auditLogSchema);
