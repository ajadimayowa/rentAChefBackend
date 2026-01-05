import { Schema, model, Document, Types } from "mongoose";

export interface IServiceOptions {
  _id?: Types.ObjectId;
  description: string;
  price: number;
}

export interface IService extends Document {
  name: string;
  description?: string;
  price?: number;
  category: Types.ObjectId;
  isActive: boolean;
  services: IServiceOptions[];
  createdAt: Date;
  updatedAt: Date;
}

const serviceOptionSchema = new Schema<IServiceOptions>(
  {
    description: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: true }
);

const serviceSchema = new Schema<IService>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    price: {
      type: Number,
      min: 0,
    },

    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    services: {
      type: [serviceOptionSchema],
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