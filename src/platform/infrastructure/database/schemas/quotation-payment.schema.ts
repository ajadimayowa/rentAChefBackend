import { model, models, Schema } from 'mongoose';
import { PaymentStatus } from '../../../domain/enums';

const quotationSchema = new Schema(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    chefFeeMinor: { type: Number, required: true },
    ingredientCostMinor: { type: Number, default: 0 },
    procurementFeeMinor: { type: Number, default: 0 },
    additionalChargesMinor: { type: Number, default: 0 },
    discountMinor: { type: Number, default: 0 },
    taxMinor: { type: Number, default: 0 },
    finalAmountMinor: { type: Number, required: true },
    currency: { type: String, default: 'NGN' },
    generatedBy: { type: String, required: true },
    notes: { type: String },
    status: { type: String, enum: ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'], default: 'DRAFT', index: true },
  },
  { timestamps: true },
);

quotationSchema.index({ bookingId: 1, createdAt: -1 });

const paymentSchema = new Schema(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    quotationId: { type: Schema.Types.ObjectId, ref: 'Quotation' },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    provider: { type: String, enum: ['PAYSTACK'], default: 'PAYSTACK', index: true },
    amountMinor: { type: Number, required: true },
    currency: { type: String, default: 'NGN' },
    paymentReference: { type: String, required: true, unique: true, index: true },
    providerTransactionId: { type: String, index: true },
    status: { type: String, enum: Object.values(PaymentStatus), default: PaymentStatus.PENDING, index: true },
    transactionDetails: { type: Schema.Types.Mixed },
    paidAt: { type: Date },
  },
  { timestamps: true },
);

paymentSchema.index({ bookingId: 1, status: 1 });
paymentSchema.index({ customerId: 1, createdAt: -1 });

export const ChefPlatformQuotationModel = models.Quotation || model('Quotation', quotationSchema);
export const ChefPlatformPaymentModel = models.Payment || model('Payment', paymentSchema);
