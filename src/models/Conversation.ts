import mongoose, { Document, Schema } from "mongoose";

/**
 * A support thread between the Rent A Chef admin team and one chef or customer.
 * Every user has at most one conversation; the admin side is a shared inbox, so any
 * admin can read and reply.
 */
export type ConversationParticipantType = "Chef" | "Customer";

export interface IConversation extends Document {
  participant: mongoose.Types.ObjectId;
  participantType: ConversationParticipantType;
  lastMessage?: {
    body: string;
    senderType: "Admin" | ConversationParticipantType;
    sentAt: Date;
  };
  /** Messages from the participant not yet read by any admin. */
  unreadForAdmin: number;
  /** Messages from admins not yet read by the participant. */
  unreadForParticipant: number;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    participant: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    participantType: { type: String, enum: ["Chef", "Customer"], required: true, index: true },
    lastMessage: {
      body: { type: String },
      senderType: { type: String, enum: ["Admin", "Chef", "Customer"] },
      sentAt: { type: Date },
    },
    unreadForAdmin: { type: Number, default: 0 },
    unreadForParticipant: { type: Number, default: 0 },
  },
  {
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
  }
);

// Inbox is listed most recent activity first.
ConversationSchema.index({ "lastMessage.sentAt": -1 });

export const Conversation = mongoose.model<IConversation>("Conversation", ConversationSchema);
