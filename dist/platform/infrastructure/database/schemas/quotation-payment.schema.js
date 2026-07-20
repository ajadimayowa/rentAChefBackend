"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChefPlatformPaymentModel = exports.ChefPlatformQuotationModel = void 0;
const mongoose_1 = require("mongoose");
const enums_1 = require("../../../domain/enums");
const quotationSchema = new mongoose_1.Schema({
    bookingId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
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
}, { timestamps: true });
quotationSchema.index({ bookingId: 1, createdAt: -1 });
const paymentSchema = new mongoose_1.Schema({
    bookingId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    quotationId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Quotation' },
    customerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    provider: { type: String, enum: ['PAYSTACK'], default: 'PAYSTACK', index: true },
    amountMinor: { type: Number, required: true },
    currency: { type: String, default: 'NGN' },
    paymentReference: { type: String, required: true, unique: true, index: true },
    providerTransactionId: { type: String, index: true },
    status: { type: String, enum: Object.values(enums_1.PaymentStatus), default: enums_1.PaymentStatus.PENDING, index: true },
    transactionDetails: { type: mongoose_1.Schema.Types.Mixed },
    paidAt: { type: Date },
}, { timestamps: true });
paymentSchema.index({ bookingId: 1, status: 1 });
paymentSchema.index({ customerId: 1, createdAt: -1 });
exports.ChefPlatformQuotationModel = mongoose_1.models.Quotation || (0, mongoose_1.model)('Quotation', quotationSchema);
exports.ChefPlatformPaymentModel = mongoose_1.models.Payment || (0, mongoose_1.model)('Payment', paymentSchema);
