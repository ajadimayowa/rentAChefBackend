import mongoose, { Document, Model, Schema, Types } from "mongoose";

/**
 * A staffing rate for a service by guest count, e.g. 1–10 guests: ₦10,000 per staff.
 * maxGuests is empty for an open-ended top range ("51+"). A quoted range has no
 * price: the customer discusses it with the admin.
 */
export interface IServiceRate extends Document {
  serviceId: Types.ObjectId;
  minGuests: number;
  maxGuests?: number | null;
  /** "quoted" ranges are priced by the admin case by case. */
  pricingType: "fixed" | "quoted";
  /** Naira charged per staff member; null when quoted. */
  ratePerStaff: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceRateSchema = new Schema<IServiceRate>(
  {
    serviceId: { type: Schema.Types.ObjectId, ref: "Service", required: true, index: true },
    minGuests: { type: Number, required: true, min: 1 },
    maxGuests: { type: Number, min: 1, default: null },
    pricingType: { type: String, enum: ["fixed", "quoted"], default: "fixed" },
    ratePerStaff: { type: Number, min: 0, default: null },
    isActive: { type: Boolean, default: true, index: true },
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

export const ServiceRateModel: Model<IServiceRate> = mongoose.model<IServiceRate>("ServiceRate", ServiceRateSchema);
