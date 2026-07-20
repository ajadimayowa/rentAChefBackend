import { model, models, Schema } from 'mongoose';
import { BookingType } from '../../../domain/enums';

const serviceCategorySchema = new Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

const serviceSchema = new Schema(
  {
    categoryId: { type: Schema.Types.ObjectId, ref: 'ServiceCategory', required: true, index: true },
    code: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    bookingType: { type: String, enum: Object.values(BookingType), required: true, index: true },
    supportsChefMenu: { type: Boolean, default: false },
    supportsCustomerMenuUpload: { type: Boolean, default: false },
    supportsProcurement: { type: Boolean, default: true },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

const servicePricingSchema = new Schema(
  {
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true, index: true },
    chefLevel: { type: String, required: true, index: true },
    basePriceMinor: { type: Number, required: true },
    currency: { type: String, default: 'NGN' },
    effectiveFrom: { type: Date, required: true, index: true },
    effectiveTo: { type: Date },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

servicePricingSchema.index({ serviceId: 1, chefLevel: 1, effectiveFrom: -1, isActive: 1 });

export const ChefPlatformServiceCategoryModel = models.ServiceCategory || model('ServiceCategory', serviceCategorySchema);
export const ChefPlatformServiceModel = models.Service || model('Service', serviceSchema);
export const ChefPlatformServicePricingModel = models.ServicePricing || model('ServicePricing', servicePricingSchema);
