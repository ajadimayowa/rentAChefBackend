import { Request, Response } from "express";
import mongoose from "mongoose";
import UserModel from "../models/User.model";
import { Conversation, ConversationParticipantType } from "../models/Conversation";
import { Message } from "../models/Message";

/*
 * Admin ⇄ chef / customer messaging.
 *
 * Each chef or customer has one conversation with the admin team (a shared inbox).
 * Admin endpoints live under /admin/conversations; the chef/customer app uses
 * /messages, which always resolves to the caller's own conversation.
 */

const MAX_BODY = 4000;
const PAGE_SIZE = 30;
const PARTICIPANT_FIELDS = "fullName email phoneNumber profilePic userType";

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeBody = (body: unknown): string | null => {
  const text = typeof body === "string" ? body.trim() : "";
  if (!text || text.length > MAX_BODY) return null;
  return text;
};

/** Shape sent to clients: the participant is flattened to the fields the UI needs. */
const serializeConversation = (conversation: any) => {
  const obj = typeof conversation.toJSON === "function" ? conversation.toJSON() : conversation;
  const p = obj.participant && typeof obj.participant === "object" ? obj.participant : null;
  return {
    id: obj.id ?? String(obj._id),
    participantType: obj.participantType,
    participant: p
      ? {
          id: p.id ?? String(p._id),
          name: p.fullName ?? "",
          email: p.email ?? "",
          phone: p.phoneNumber ?? "",
          avatar: p.profilePic ?? "",
        }
      : null,
    lastMessage: obj.lastMessage?.body ? obj.lastMessage : null,
    unreadForAdmin: obj.unreadForAdmin ?? 0,
    unreadForParticipant: obj.unreadForParticipant ?? 0,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
};

/** Cursor pagination, newest first: pass `before` (an ISO date) to load older messages. */
const loadMessages = async (conversationId: mongoose.Types.ObjectId | string, req: Request) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || PAGE_SIZE, 1), 100);
  const filter: Record<string, unknown> = { conversation: conversationId };
  const before = typeof req.query.before === "string" ? new Date(req.query.before) : null;
  if (before && !Number.isNaN(before.getTime())) filter.createdAt = { $lt: before };

  const messages = await Message.find(filter).sort({ createdAt: -1 }).limit(limit + 1);
  const hasMore = messages.length > limit;
  // Returned oldest → newest so clients can render top-to-bottom.
  return { messages: messages.slice(0, limit).reverse(), hasMore };
};

const appendMessage = async (
  conversation: any,
  sender: any,
  senderType: "Admin" | ConversationParticipantType,
  body: string
) => {
  const message = await Message.create({
    conversation: conversation._id,
    sender: sender._id,
    senderType,
    body,
  });

  // Atomic $inc so two messages sent at once can't lose an unread count.
  await Conversation.updateOne(
    { _id: conversation._id },
    {
      $set: { lastMessage: { body, senderType, sentAt: message.createdAt } },
      $inc: senderType === "Admin" ? { unreadForParticipant: 1 } : { unreadForAdmin: 1 },
    }
  );
  return message;
};

/* ============================== ADMIN ============================== */

// GET /admin/conversations?type=Chef|Customer&search=
export const adminListConversations = async (req: Request, res: Response): Promise<any> => {
  try {
    const filter: Record<string, unknown> = {};
    const type = req.query.type;
    if (type === "Chef" || type === "Customer") filter.participantType = type;

    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    if (search) {
      const regex = { $regex: escapeRegex(search), $options: "i" };
      const users = await UserModel.find({
        userType: { $in: ["Chef", "Customer"] },
        $or: [{ fullName: regex }, { email: regex }, { phoneNumber: regex }],
      })
        .select("_id")
        .lean();
      filter.participant = { $in: users.map((u: any) => u._id) };
    }

    const conversations = await Conversation.find(filter)
      .populate("participant", PARTICIPANT_FIELDS)
      .sort({ "lastMessage.sentAt": -1, updatedAt: -1 })
      .limit(200);

    return res.status(200).json({ success: true, payload: conversations.map(serializeConversation) });
  } catch (error) {
    console.error("adminListConversations error:", error);
    return res.status(500).json({ success: false, message: "Could not load conversations" });
  }
};

// GET /admin/conversations/unread-count → number of conversations with unread messages
export const adminUnreadCount = async (_req: Request, res: Response): Promise<any> => {
  try {
    const count = await Conversation.countDocuments({ unreadForAdmin: { $gt: 0 } });
    return res.status(200).json({ success: true, payload: { count } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Could not load unread count" });
  }
};

// GET /admin/conversations/recipients?type=Chef|Customer&search= → people the admin can message
export const adminSearchRecipients = async (req: Request, res: Response): Promise<any> => {
  try {
    const type = req.query.type === "Chef" || req.query.type === "Customer" ? req.query.type : null;
    const filter: Record<string, unknown> = { userType: type ? type : { $in: ["Chef", "Customer"] } };

    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    if (search) {
      const regex = { $regex: escapeRegex(search), $options: "i" };
      filter.$or = [{ fullName: regex }, { email: regex }, { phoneNumber: regex }];
    }

    const users = await UserModel.find(filter).select(PARTICIPANT_FIELDS).sort({ fullName: 1 }).limit(25);
    return res.status(200).json({
      success: true,
      payload: users.map((u: any) => ({
        id: String(u._id),
        name: u.fullName ?? "",
        email: u.email ?? "",
        phone: u.phoneNumber ?? "",
        avatar: u.profilePic ?? "",
        userType: u.userType,
      })),
    });
  } catch (error) {
    console.error("adminSearchRecipients error:", error);
    return res.status(500).json({ success: false, message: "Could not search users" });
  }
};

// POST /admin/conversations { participantId } → existing conversation or a new one
export const adminStartConversation = async (req: Request, res: Response): Promise<any> => {
  try {
    const { participantId } = req.body ?? {};
    if (!participantId || !mongoose.Types.ObjectId.isValid(participantId)) {
      return res.status(400).json({ success: false, message: "Valid participantId is required" });
    }

    const user = await UserModel.findById(participantId).select("userType");
    if (!user || (user.userType !== "Chef" && user.userType !== "Customer")) {
      return res.status(404).json({ success: false, message: "Chef or client not found" });
    }

    const conversation = await Conversation.findOneAndUpdate(
      { participant: user._id },
      { $setOnInsert: { participant: user._id, participantType: user.userType } },
      { new: true, upsert: true }
    ).populate("participant", PARTICIPANT_FIELDS);

    return res.status(200).json({ success: true, payload: serializeConversation(conversation) });
  } catch (error) {
    console.error("adminStartConversation error:", error);
    return res.status(500).json({ success: false, message: "Could not start conversation" });
  }
};

const findConversationForAdmin = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ success: false, message: "Invalid conversation id" });
    return null;
  }
  const conversation = await Conversation.findById(id);
  if (!conversation) {
    res.status(404).json({ success: false, message: "Conversation not found" });
    return null;
  }
  return conversation;
};

// GET /admin/conversations/:id/messages?before=&limit=
export const adminGetMessages = async (req: Request, res: Response): Promise<any> => {
  try {
    const conversation = await findConversationForAdmin(req, res);
    if (!conversation) return;
    const { messages, hasMore } = await loadMessages(conversation._id as any, req);
    return res.status(200).json({ success: true, payload: messages, meta: { hasMore } });
  } catch (error) {
    console.error("adminGetMessages error:", error);
    return res.status(500).json({ success: false, message: "Could not load messages" });
  }
};

// POST /admin/conversations/:id/messages { body }
export const adminSendMessage = async (req: Request, res: Response): Promise<any> => {
  try {
    const body = normalizeBody(req.body?.body);
    if (!body) {
      return res
        .status(400)
        .json({ success: false, message: `Message must be between 1 and ${MAX_BODY} characters` });
    }
    const conversation = await findConversationForAdmin(req, res);
    if (!conversation) return;

    const message = await appendMessage(conversation, (req as any).user, "Admin", body);
    return res.status(201).json({ success: true, payload: message });
  } catch (error) {
    console.error("adminSendMessage error:", error);
    return res.status(500).json({ success: false, message: "Could not send message" });
  }
};

// POST /admin/conversations/:id/read → marks the participant's messages as read
export const adminMarkRead = async (req: Request, res: Response): Promise<any> => {
  try {
    const conversation = await findConversationForAdmin(req, res);
    if (!conversation) return;

    await Message.updateMany(
      { conversation: conversation._id, senderType: { $ne: "Admin" }, readAt: { $exists: false } },
      { $set: { readAt: new Date() } }
    );
    conversation.unreadForAdmin = 0;
    await conversation.save();
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("adminMarkRead error:", error);
    return res.status(500).json({ success: false, message: "Could not mark as read" });
  }
};

/* ======================= CHEF / CUSTOMER APP ======================= */

const getOwnConversation = async (user: any) =>
  Conversation.findOneAndUpdate(
    { participant: user._id },
    { $setOnInsert: { participant: user._id, participantType: user.userType } },
    { new: true, upsert: true }
  );

// GET /messages/conversation → the caller's conversation with the admin team
export const getMyConversation = async (req: Request, res: Response): Promise<any> => {
  try {
    const conversation = await getOwnConversation((req as any).user);
    return res.status(200).json({ success: true, payload: serializeConversation(conversation) });
  } catch (error) {
    console.error("getMyConversation error:", error);
    return res.status(500).json({ success: false, message: "Could not load conversation" });
  }
};

// GET /messages?before=&limit=
export const getMyMessages = async (req: Request, res: Response): Promise<any> => {
  try {
    const conversation = await getOwnConversation((req as any).user);
    const { messages, hasMore } = await loadMessages(conversation._id as any, req);
    return res.status(200).json({ success: true, payload: messages, meta: { hasMore } });
  } catch (error) {
    console.error("getMyMessages error:", error);
    return res.status(500).json({ success: false, message: "Could not load messages" });
  }
};

// POST /messages { body }
export const sendMyMessage = async (req: Request, res: Response): Promise<any> => {
  try {
    const body = normalizeBody(req.body?.body);
    if (!body) {
      return res
        .status(400)
        .json({ success: false, message: `Message must be between 1 and ${MAX_BODY} characters` });
    }
    const user = (req as any).user;
    const conversation = await getOwnConversation(user);
    const message = await appendMessage(conversation, user, user.userType, body);
    return res.status(201).json({ success: true, payload: message });
  } catch (error) {
    console.error("sendMyMessage error:", error);
    return res.status(500).json({ success: false, message: "Could not send message" });
  }
};

// POST /messages/read → marks admin messages as read by the caller
export const markMyMessagesRead = async (req: Request, res: Response): Promise<any> => {
  try {
    const conversation = await getOwnConversation((req as any).user);
    await Message.updateMany(
      { conversation: conversation._id, senderType: "Admin", readAt: { $exists: false } },
      { $set: { readAt: new Date() } }
    );
    conversation.unreadForParticipant = 0;
    await conversation.save();
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("markMyMessagesRead error:", error);
    return res.status(500).json({ success: false, message: "Could not mark as read" });
  }
};
