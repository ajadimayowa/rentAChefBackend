"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_controller_1 = require("../controllers/notification.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const adminAuth_1 = require("../middleware/adminAuth");
const router = (0, express_1.Router)();
// Create notification (protected)
router.post('/notification/create', adminAuth_1.adminAuth, notification_controller_1.createNotification);
// Get notifications for user (protected)
router.get('/notifications', auth_middleware_1.verifyUserToken, notification_controller_1.getNotifications);
// Get single notification
router.get('/notification/:id', auth_middleware_1.verifyUserToken, notification_controller_1.getNotification);
// Update notification
router.put('/notification/:id', auth_middleware_1.verifyUserToken, notification_controller_1.updateNotification);
// Mark as read
router.put('/notification/:id/read', auth_middleware_1.verifyUserToken, notification_controller_1.markAsRead);
// Delete notification
router.delete('/notification/:id', auth_middleware_1.verifyUserToken, notification_controller_1.deleteNotification);
exports.default = router;
