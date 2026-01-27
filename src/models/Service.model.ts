import { Schema, model, Document, Types } from "mongoose";

/* -------------------- OPTION (LOWEST LEVEL) -------------------- */
export interface IOption {
  _id?: Types.ObjectId;
  title: string;
  description: string;
  extras: string;
  price: number;
}

const optionSchema = new Schema<IOption>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    extras: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: true }
);

/* -------------------- SERVICE PLAN -------------------- */
export interface IServicePlan {
  _id?: Types.ObjectId;
  title: string;
  description: string;
  price: number;
  options: IOption[];
}

const servicePlanSchema = new Schema<IServicePlan>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    options: { type: [optionSchema], default: [] },
  },
  { _id: true }
);

/* -------------------- MAIN SERVICE -------------------- */
export interface IService extends Document {
  name: string;
  description?: string;
  price?: number;
  category: Types.ObjectId;
  isActive: boolean;
  services: IServicePlan[];
  createdAt: Date;
  updatedAt: Date;
}

const serviceSchema = new Schema<IService>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    price: { type: Number, min: 0 },

    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    isActive: { type: Boolean, default: true },

    services: {
      type: [servicePlanSchema],
      default: [],
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

export const Service = model<IService>("Service", serviceSchema);