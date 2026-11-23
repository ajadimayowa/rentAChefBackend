import { Router } from "express";
import { requireAdminAuth } from "../middleware/auth/adminAuth.middleware";
import { requireAuth } from "../middleware/auth/requireAuth.middleware";
import {
  adminGetMessages,
  adminListConversations,
  adminMarkRead,
  adminSearchRecipients,
  adminSendMessage,
  adminStartConversation,
  adminUnreadCount,
  getMyConversation,
  getMyMessages,
  markMyMessagesRead,
  sendMyMessage,
} from "../controllers/messaging.controller";
import {
  adminNotificationUnreadCount,
  listAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
} from "../controllers/adminNotification.controller";
import {
  listMyNotifications,
  markAllMyNotificationsRead,
  markMyNotificationRead,
  myNotificationUnreadCount,
} from "../controllers/myNotification.controller";

const router = Router();

/* Admin shared inbox */
router.get("/admin/conversations", requireAdminAuth, adminListConversations);
router.get("/admin/conversations/unread-count", requireAdminAuth, adminUnreadCount);
router.get("/admin/conversations/recipients", requireAdminAuth, adminSearchRecipients);
router.post("/admin/conversations", requireAdminAuth, adminStartConversation);
router.get("/admin/conversations/:id/messages", requireAdminAuth, adminGetMessages);
router.post("/admin/conversations/:id/messages", requireAdminAuth, adminSendMessage);
router.post("/admin/conversations/:id/read", requireAdminAuth, adminMarkRead);

/* Admin notification bell (registered here so it sits before adminRoutes' /admin/:id) */
router.get("/admin/notifications", requireAdminAuth, listAdminNotifications);
router.get("/admin/notifications/unread-count", requireAdminAuth, adminNotificationUnreadCount);
router.post("/admin/notifications/read-all", requireAdminAuth, markAllAdminNotificationsRead);
router.post("/admin/notifications/:id/read", requireAdminAuth, markAdminNotificationRead);

/* Chef / customer app — always the caller's own conversation with the admin team */
const participantAuth = requireAuth(["Chef", "Customer"]);
router.get("/messages/conversation", participantAuth, getMyConversation);
router.get("/messages", participantAuth, getMyMessages);
router.post("/messages", participantAuth, sendMyMessage);
router.post("/messages/read", participantAuth, markMyMessagesRead);

/* Chef / customer notification bell — always the caller's own notifications */
router.get("/me/notifications", participantAuth, listMyNotifications);
router.get("/me/notifications/unread-count", participantAuth, myNotificationUnreadCount);
router.post("/me/notifications/read-all", participantAuth, markAllMyNotificationsRead);
router.post("/me/notifications/:id/read", participantAuth, markMyNotificationRead);

export default router;
