import { model, models, Schema } from 'mongoose';
import { BookingStatus, BookingWorkflow, ChefLevel, MenuSelectionType, ModeOfPayment, PaymentStatus, ProcurementOption } from '../../../domain/enums';

const bookingSchema = new Schema(
  {
    bookingNumber: { type: String, required: true, unique: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', index: true },
    specialServiceId: { type: Schema.Types.ObjectId, ref: 'SpecialMenu', index: true },
    serviceSubCategoryId: { type: Schema.Types.ObjectId, ref: 'ServiceSubCategory', index: true },
    workflow: { type: String, enum: Object.values(BookingWorkflow), required: true, index: true },
    chefLevel: { type: String, enum: Object.values(ChefLevel), index: true },
    assignedChefId: { type: Schema.Types.ObjectId, ref: 'Chef', index: true },
    modeOfPayment: { type: String, enum: Object.values(ModeOfPayment), required: true, index: true },
    status: { type: String, enum: Object.values(BookingStatus), required: true, index: true },
    paymentStatus: { type: String, enum: Object.values(PaymentStatus), required: true, index: true },
    transactnRef: { type: String, index: true },
    menuSelectionType: { type: String, enum: Object.values(MenuSelectionType), index: true },
    chefMenuId: { type: Schema.Types.ObjectId, ref: 'ChefMenu' },
    customerUploadedMenuFileId: { type: Schema.Types.ObjectId, ref: 'UploadedFile' },
    procurement: {
      option: { type: String, enum: Object.values(ProcurementOption) },
      estimatedIngredientCostMinor: { type: Number, default: 0 },
      finalIngredientCostMinor: { type: Number },
      procurementFeeMinor: { type: Number, default: 0 },
    },
    modifiers: [
      {
        code: String,
        label: String,
        amountMinor: Number,
        source: { type: String, enum: ['SYSTEM', 'ADMIN', 'WORKFLOW'] },
      },
    ],
    bookingData: { type: Schema.Types.Mixed, required: true },
    pricingSnapshot: {
      baseChefFeeMinor: { type: Number, required: true },
      estimatedTotalMinor: { type: Number, required: true },
      currency: { type: String, default: 'NGN' },
    },
    timeline: [
      {
        status: { type: String, enum: Object.values(BookingStatus), required: true },
        changedBy: { type: String, required: true },
        changedAt: { type: Date, required: true },
        reason: { type: String },
      },
    ],
  },
  { timestamps: true },
);

bookingSchema.pre('validate', function (next) {
  const hasServiceId = Boolean((this as any).serviceId);
  const hasSpecialServiceId = Boolean((this as any).specialServiceId);

  if (!hasServiceId && !hasSpecialServiceId) {
    return next(new Error('Either serviceId or specialServiceId is required'));
  }

  if (hasServiceId && hasSpecialServiceId) {
    return next(new Error('Provide only one target: serviceId or specialServiceId'));
  }

  return next();
});

bookingSchema.index({ customerId: 1, createdAt: -1 });
bookingSchema.index({ status: 1, paymentStatus: 1, createdAt: -1 });
bookingSchema.index({ serviceId: 1, chefLevel: 1, status: 1 });

export const ChefPlatformBookingModel = models.ChefPlatformBooking || model('ChefPlatformBooking', bookingSchema, 'bookings');
