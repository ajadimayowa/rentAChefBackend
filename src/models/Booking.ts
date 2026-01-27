import { Schema, model, Types, Document } from "mongoose";

export interface IBooking extends Document {
  clientId: Types.ObjectId;
  chefId: Types.ObjectId;
  serviceId: Types.ObjectId;
  categoryId: Types.ObjectId;
  subCategoryId?: Types.ObjectId;
  specialMenuId?: Types.ObjectId;

  dates: Date[];

  bookingFeePaid: boolean;
  procurementPaid: boolean;

  bookingFeeAmount: number;
  procurementAmount: number;

  status: "pending" | "confirmed" | "ongoing" | "completed" | "cancelled";

  totalAmount: number;

  cancellationReason?: string;

  createdAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    chefId: {
      type: Schema.Types.ObjectId,
      ref: "Chef",
      required: true,
    },

    serviceId: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },

    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    subCategoryId: {
      type: Schema.Types.ObjectId,
      ref: "SubCategory",
    },

    specialMenuId: {
      type: Schema.Types.ObjectId,
      ref: "SpecialMenu",
    },

    dates: {
      type: [Date],
      required: true,
      validate: {
        validator: (v: Date[]) => v.length > 0,
        message: "At least one booking date is required",
      },
    },

    bookingFeePaid: {
      type: Boolean,
      default: false,
    },

    procurementPaid: {
      type: Boolean,
      default: false,
    },

    bookingFeeAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    procurementAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "ongoing", "completed", "cancelled"],
      default: "pending",
    },

    cancellationReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

/* ---------- Indexes ---------- */
BookingSchema.index({ chefId: 1, createdAt: -1 });
BookingSchema.index({ clientId: 1, createdAt: -1 });
BookingSchema.index({ status: 1 });

export const Booking = model<IBooking>("Booking", BookingSchema);