import mongoose, { Document, Schema } from "mongoose";

export type MessageSenderType = "Admin" | "Chef" | "Customer";

export interface IMessage extends Document {
  conversation: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  senderType: MessageSenderType;
  body: string;
  /** When the other side read it (admins for participant messages, and vice versa). */
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    conversation: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    senderType: { type: String, enum: ["Admin", "Chef", "Customer"], required: true },
    body: { type: String, required: true, trim: true, maxlength: 4000 },
    readAt: { type: Date },
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

MessageSchema.index({ conversation: 1, createdAt: -1 });

export const Message = mongoose.model<IMessage>("Message", MessageSchema);
