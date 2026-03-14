// models/ServicePricing.ts
import { Schema, model, Document, Types } from "mongoose";

export interface IServicePricingOption {
  name: string;       // Name of the option, e.g., "Extra Sauce"
  price: number;      // Additional price for this option
  description?: string;  // Optional, defaults to service currency
}

export interface IServicePricing extends Document {
    serviceId: Types.ObjectId;
    chefCategoryId: Types.ObjectId;
    price: number;
    servicePricingOptions?: IServicePricingOption[]; // New field
    currency: string;
    createdAt: Date;
    updatedAt: Date;

}

const ServicePricingOptionSchema = new Schema<IServicePricingOption>({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String } // optional, if not provided, fallback to parent currency
});

const ServicePricingSchema = new Schema<IServicePricing>(
    {
        serviceId: { type: Schema.Types.ObjectId, ref: "Service", required: true },
        chefCategoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
        price: { type: Number, required: true },
        servicePricingOptions: { type: [ServicePricingOptionSchema], default: [] }, // NEW
        currency: { type: String, default: "NGN" },
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

// Ensure no duplicate service+category combination
ServicePricingSchema.index({ serviceId: 1, chefCategoryId: 1 }, { unique: true });

export const ServicePricing = model<IServicePricing>("ServicePricing", ServicePricingSchema);