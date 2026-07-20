import mongoose, { Schema, Document, Model } from "mongoose";

export interface IService extends Document {
  categoryId: Schema.Types.ObjectId;
  code?: string;
  name: string;
  description?: string;
  icon?: string;
  workflow?: string;
  supportsChefMenu?: boolean;
  supportsCustomerMenuUpload?: boolean;
  supportsProcurement?: boolean;
  allowedChefLevels: ("sous" | "executive" | "junior" | "senior" | "pro" | "head")[];
  bookingType?: "instant" | "quotation";
  isActive: boolean;
  active?: boolean;
}

const ServiceSchema = new Schema<IService>(
  {
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "ServiceCategory",
      required: true,
    },

    name: { type: String, required: true },
    description: { type: String, default: "" },
    icon: { type: String, default: "" },

    code: { type: String, unique: true, sparse: true, index: true },

    workflow: { type: String },

    supportsChefMenu: { type: Boolean, default: false },
    supportsCustomerMenuUpload: { type: Boolean, default: false },
    supportsProcurement: { type: Boolean, default: true },

    allowedChefLevels: {
      type: [String],
      enum: ["sous","executive","junior","senior","pro","head"],
    },

    bookingType: {
      type: String,
      enum: ["instant", "quotation"],
    },

    isActive: { type: Boolean, default: true },
    active: { type: Boolean, default: true, index: true },
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

export const ServiceModel: Model<IService> = mongoose.model("Service", ServiceSchema);