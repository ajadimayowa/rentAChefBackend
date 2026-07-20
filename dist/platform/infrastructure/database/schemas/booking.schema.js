"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChefPlatformBookingModel = void 0;
const mongoose_1 = require("mongoose");
const enums_1 = require("../../../domain/enums");
const bookingSchema = new mongoose_1.Schema({
    bookingNumber: { type: String, required: true, unique: true, index: true },
    customerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    serviceId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Service', index: true },
    specialServiceId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'SpecialMenu', index: true },
    serviceSubCategoryId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ServiceSubCategory', index: true },
    workflow: { type: String, enum: Object.values(enums_1.BookingWorkflow), required: true, index: true },
    chefLevel: { type: String, enum: Object.values(enums_1.ChefLevel), index: true },
    assignedChefId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Chef', index: true },
    modeOfPayment: { type: String, enum: Object.values(enums_1.ModeOfPayment), required: true, index: true },
    status: { type: String, enum: Object.values(enums_1.BookingStatus), required: true, index: true },
    paymentStatus: { type: String, enum: Object.values(enums_1.PaymentStatus), required: true, index: true },
    transactnRef: { type: String, index: true },
    menuSelectionType: { type: String, enum: Object.values(enums_1.MenuSelectionType), index: true },
    chefMenuId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ChefMenu' },
    customerUploadedMenuFileId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'UploadedFile' },
    procurement: {
        option: { type: String, enum: Object.values(enums_1.ProcurementOption) },
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
    bookingData: { type: mongoose_1.Schema.Types.Mixed, required: true },
    pricingSnapshot: {
        baseChefFeeMinor: { type: Number, required: true },
        estimatedTotalMinor: { type: Number, required: true },
        currency: { type: String, default: 'NGN' },
    },
    timeline: [
        {
            status: { type: String, enum: Object.values(enums_1.BookingStatus), required: true },
            changedBy: { type: String, required: true },
            changedAt: { type: Date, required: true },
            reason: { type: String },
        },
    ],
}, { timestamps: true });
bookingSchema.pre('validate', function (next) {
    const hasServiceId = Boolean(this.serviceId);
    const hasSpecialServiceId = Boolean(this.specialServiceId);
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
exports.ChefPlatformBookingModel = mongoose_1.models.ChefPlatformBooking || (0, mongoose_1.model)('ChefPlatformBooking', bookingSchema, 'bookings');
