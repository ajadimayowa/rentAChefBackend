import mongoose, { Document, Model, Schema, Types } from "mongoose";

/**
 * An invoice the admin attaches to a booking (PDF + amount) — mainly for
 * quotation services, where the price is worked out after review.
 */
export interface IInvoice extends Document {
  bookingId: Types.ObjectId;
  /** Naira the customer must pay. */
  amount: number;
  documentUrl: string;
  documentName?: string;
  createdBy?: Types.ObjectId;
  isPaid: boolean;
  paidAt?: Date;
  paymentReference?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema = new Schema<IInvoice>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    amount: { type: Number, required: true, min: 0 },
    documentUrl: { type: String, required: true, trim: true },
    documentName: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },
    paymentReference: { type: String, trim: true },
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

InvoiceSchema.index({ bookingId: 1, createdAt: -1 });

export const InvoiceModel: Model<IInvoice> = mongoose.model<IInvoice>("Invoice", InvoiceSchema);
