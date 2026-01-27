"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Booking = void 0;
const mongoose_1 = require("mongoose");
const BookingSchema = new mongoose_1.Schema({
    clientId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    chefId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Chef",
        required: true,
    },
    serviceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Service",
        required: true,
    },
    categoryId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
    },
    subCategoryId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "SubCategory",
    },
    specialMenuId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "SpecialMenu",
    },
    dates: {
        type: [Date],
        required: true,
        validate: {
            validator: (v) => v.length > 0,
            message: "At least one booking date is required",
        },
    },
    bookingFeePaid: {
        type: Boolean,
        default: false,
    },
    procurementPaid: {
        type: Boolean,
        default: false,
    },
    bookingFeeAmount: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
    },
    procurementAmount: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0,
    },
    status: {
        type: String,
        enum: ["pending", "confirmed", "ongoing", "completed", "cancelled"],
        default: "pending",
    },
    cancellationReason: {
        type: String,
        trim: true,
    },
}, {
    timestamps: { createdAt: true, updatedAt: false },
});
/* ---------- Indexes ---------- */
BookingSchema.index({ chefId: 1, createdAt: -1 });
BookingSchema.index({ clientId: 1, createdAt: -1 });
BookingSchema.index({ status: 1 });
exports.Booking = (0, mongoose_1.model)("Booking", BookingSchema);
