import mongoose, { Document, Model, Schema, Types } from "mongoose";

/**
 * A platform fee the admin team configures in Settings → Fees, e.g. a service
 * fee of 5% or a fixed ₦2,000 booking fee.
 */
export type FeeType = "fixed" | "percentage";

export interface IFee extends Document {
  name: string;
  description?: string;
  type: FeeType;
  /** Naira for a fixed fee; 0–100 for a percentage. */
  value: number;
  isActive: boolean;
  /** Services this fee is charged on. */
  serviceIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const FeeSchema = new Schema<IFee>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    type: { type: String, enum: ["fixed", "percentage"], required: true },
    value: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
    serviceIds: { type: [{ type: Schema.Types.ObjectId, ref: "Service" }], default: [], index: true },
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

FeeSchema.index({ createdAt: -1 });

export const FeeModel: Model<IFee> = mongoose.model<IFee>("Fee", FeeSchema);
