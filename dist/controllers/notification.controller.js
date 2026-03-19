"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAsRead = exports.deleteNotification = exports.updateNotification = exports.getNotification = exports.getNotifications = exports.createNotification = void 0;
const Notification_1 = __importDefault(require("../models/Notification"));
/** Create a notification */
const createNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, type, title, message, isRead } = req.body;
        if (!userId || !type || !title || !message) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        const notification = yield Notification_1.default.create({ userId, type, title, message, isRead });
        return res.status(201).json({ success: true, payload: notification });
    }
    catch (error) {
        console.error('createNotification error', error);
        return res.status(500).json({ success: false, message: 'Failed to create notification', error: error.message });
    }
});
exports.createNotification = createNotification;
/** Get notifications (for a user by default) */
const getNotifications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = 1, limit = 20, userId } = req.query;
        // prefer explicit query userId, otherwise use authenticated user
        const targetUserId = userId || (req.user && req.user._id);
        const query = {};
        if (targetUserId)
            query.userId = targetUserId;
        const skip = (Number(page) - 1) * Number(limit);
        const items = yield Notification_1.default.find(query)
            .sort({ createdAt: -1 })
            .populate('userId', 'fullName email') // populate user details if needed
            .skip(skip)
            .limit(Number(limit));
        const total = yield Notification_1.default.countDocuments(query);
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
    }
    catch (error) {
        console.error('getNotifications error', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch notifications', error: error.message });
    }
});
exports.getNotifications = getNotifications;
/** Get single notification */
const getNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const notification = yield Notification_1.default.findById(req.params.id);
        if (!notification)
            return res.status(404).json({ success: false, message: 'Notification not found' });
        return res.json({ success: true, payload: notification });
    }
    catch (error) {
        console.error('getNotification error', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch notification', error: error.message });
    }
});
exports.getNotification = getNotification;
/** Update notification (eg. mark as read) */
const updateNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const notification = yield Notification_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!notification)
            return res.status(404).json({ success: false, message: 'Notification not found' });
        return res.json({ success: true, message: 'Notification updated', payload: notification });
    }
    catch (error) {
        console.error('updateNotification error', error);
        return res.status(500).json({ success: false, message: 'Failed to update notification', error: error.message });
    }
});
exports.updateNotification = updateNotification;
/** Delete notification */
const deleteNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const notification = yield Notification_1.default.findByIdAndDelete(req.params.id);
        if (!notification)
            return res.status(404).json({ success: false, message: 'Notification not found' });
        return res.json({ success: true, message: 'Notification deleted' });
    }
    catch (error) {
        console.error('deleteNotification error', error);
        return res.status(500).json({ success: false, message: 'Failed to delete notification', error: error.message });
    }
});
exports.deleteNotification = deleteNotification;
/** Mark notification as read */
const markAsRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const notification = yield Notification_1.default.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
        if (!notification)
            return res.status(404).json({ success: false, message: 'Notification not found' });
        return res.json({ success: true, message: 'Notification marked as read', payload: notification });
    }
    catch (error) {
        console.error('markAsRead error', error);
        return res.status(500).json({ success: false, message: 'Failed to mark notification as read', error: error.message });
    }
});
exports.markAsRead = markAsRead;
