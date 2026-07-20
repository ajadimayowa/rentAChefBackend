// models/ServicePricing.ts
import { Schema, model, models, Document, Types } from "mongoose";

export interface IServicePricingOption {
  name: string;
  price: number;
  description?: string;
}

export interface IServicePricing extends Document {
  serviceId?: Types.ObjectId;
  specialServiceId?: Types.ObjectId;
  serviceCategoryId?: Types.ObjectId;
  chefCategoryId: Types.ObjectId;
  pricingType: 'daybased' | 'levelbased';
  numberOfDays?: number;
  monthlySubFee?: number;
  description?: string;
  basePriceMinor: number;
  currency: 'NGN';
  servicePricingOptions: IServicePricingOption[];
  effectiveFrom: Date;
  effectiveTo?: Date;
  isActive: boolean;
}

const ServicePricingOptionSchema = new Schema<IServicePricingOption>({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String }
});

const ServicePricingSchema = new Schema<IServicePricing>(
  {
    serviceId: { type: Schema.Types.ObjectId, ref: "Service", index: true },
    specialServiceId: { type: Schema.Types.ObjectId, ref: "SpecialMenu", index: true },
    serviceCategoryId: { type: Schema.Types.ObjectId, ref: "ServiceCategory", index: true },
    chefCategoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    pricingType: { type: String, enum: ['daybased', 'levelbased'], required: true, default: 'levelbased' },
    numberOfDays: { type: Number, min: 1 },
    description: { type: String, trim: true },
    monthlySubFee: { type: Number, min: 0 },
    basePriceMinor: { type: Number, required: true },
    currency: { type: String, enum: ['NGN'], default: 'NGN' },
    servicePricingOptions: { type: [ServicePricingOptionSchema], default: [] },
    effectiveFrom: { type: Date, required: true, default: () => new Date(), index: true },
    effectiveTo: { type: Date },
    isActive: { type: Boolean, default: true, index: true }
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

ServicePricingSchema.pre("validate", function (next) {
  if (!this.serviceId && !this.specialServiceId) {
    this.invalidate("serviceId", "Either serviceId or specialServiceId is required");
    this.invalidate("specialServiceId", "Either serviceId or specialServiceId is required");
  }

  if (this.serviceId && this.specialServiceId) {
    this.invalidate("serviceId", "Provide only one target: serviceId or specialServiceId");
    this.invalidate("specialServiceId", "Provide only one target: serviceId or specialServiceId");
  }

  if (!this.chefCategoryId) {
    this.invalidate("chefCategoryId", "chefCategoryId is required");
  }

  if (this.pricingType === "daybased" && (this.monthlySubFee === undefined || this.monthlySubFee === null)) {
    this.invalidate("monthlySubFee", "monthlySubFee is required when pricingType is daybased");
  }

  next();
});

ServicePricingSchema.index({ serviceId: 1, specialServiceId: 1, chefCategoryId: 1, effectiveFrom: -1, isActive: 1 });

ServicePricingSchema.index(
  { serviceId: 1, chefCategoryId: 1, pricingType: 1 },
  {
    unique: true,
    partialFilterExpression: {
      serviceId: { $type: "objectId" },
      isActive: true,
    },
  }
);

ServicePricingSchema.index(
  { specialServiceId: 1, chefCategoryId: 1, pricingType: 1 },
  {
    unique: true,
    partialFilterExpression: {
      specialServiceId: { $type: "objectId" },
      isActive: true,
    },
  }
);

export const ServicePricing = models.ServicePricing || model<IServicePricing>("ServicePricing", ServicePricingSchema);