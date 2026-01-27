import { Schema, model, Document, Types } from "mongoose";

/** Procurement sub-document */
interface IProcurement {
  title: string;
  description?: string;
  price: number;
}

/** Special Menu interface */
export interface ISpecialMenu extends Document {
  title: string; // Anniversary, Date Night
  description?: string;
  image?: string;
  procurements: IProcurement[];
  price: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Procurement Schema */
const ProcurementSchema = new Schema<IProcurement>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    price: { type: Number, required: true },
  },
  { _id: false }
);

/** Special Menu Schema */
const SpecialMenuSchema = new Schema<ISpecialMenu>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    image: { type: String }, // image URL
    procurements: {
      type: [ProcurementSchema],
      default: [],
    },
    price: { type: Number, required: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: function (_doc, ret: any) {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  }
);

export const SpecialMenu = model<ISpecialMenu>(
  "SpecialMenu",
  SpecialMenuSchema
);