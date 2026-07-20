import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPayment extends Document {
  bookingId: Schema.Types.ObjectId;
  quotationId?: Schema.Types.ObjectId;
  userId?: Schema.Types.ObjectId;
  customerId?: Schema.Types.ObjectId;
  amount?: number;
  amountMinor?: number;
  currency: "NGN";
  provider: "paystack" | "PAYSTACK";
  paymentReference: string;
  providerTransactionId?: string;
  transactionDetails?: Record<string, unknown>;
  paidAt?: Date;
  status: "pending" | "success" | "failed" | "PENDING" | "PAID" | "FAILED" | "UNPAID";
}

const PaymentSchema = new Schema<IPayment>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking" },

    quotationId: { type: Schema.Types.ObjectId, ref: "Quotation" },

    userId: { type: Schema.Types.ObjectId, ref: "User" },
    customerId: { type: Schema.Types.ObjectId, ref: "User", index: true },

    amount: Number,
    amountMinor: { type: Number },

    currency: { type: String, default: "NGN" },

    provider: { type: String, enum: ['paystack', 'PAYSTACK'], default: "PAYSTACK", index: true },

    paymentReference: { type: String, required: true, unique: true, index: true },
    providerTransactionId: { type: String, index: true },
    transactionDetails: { type: Schema.Types.Mixed },
    paidAt: { type: Date },

    status: {
      type: String,
      enum: ["pending", "success", "failed", "PENDING", "PAID", "FAILED", "UNPAID"],
      default: 'PENDING',
      index: true,
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

PaymentSchema.index({ bookingId: 1, status: 1 });
PaymentSchema.index({ customerId: 1, createdAt: -1 });

export const PaymentModel: Model<IPayment> =
  mongoose.model("Payment", PaymentSchema);