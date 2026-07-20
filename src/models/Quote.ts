import mongoose, { Schema, Document, Model } from "mongoose";

export interface IQuote extends Document {
  title: string;
  description: string;
  customerId: Schema.Types.ObjectId;
  status: "PENDING" | "RESPONDED" | "CLOSED";
  adminResponse?: IQuoteAdminResponse;
}

export interface IQuoteAdminResponse {
  message: string;
  respondedBy: Schema.Types.ObjectId;
  respondedAt: Date;
}

const QuoteSchema = new Schema<IQuote>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    status: {
      type: String,
      enum: ["PENDING", "RESPONDED", "CLOSED"],
      default: "PENDING",
      index: true,
    },

    adminResponse: {
      message: { type: String, trim: true },
      respondedBy: { type: Schema.Types.ObjectId, ref: "User" },
      respondedAt: { type: Date },
    },
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

QuoteSchema.index({ customerId: 1, createdAt: -1 });

export const QuoteModel: Model<IQuote> =
  (mongoose.models.CustomerQuote as Model<IQuote>) ||
  mongoose.model<IQuote>("CustomerQuote", QuoteSchema, "customer_quotes");