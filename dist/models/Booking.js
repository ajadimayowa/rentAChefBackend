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
    bookingType: {
        type: String,
        enum: ["special-menu", "chef"],
        required: true,
    },
    clientNote: {
        type: String,
        required: true,
    },
    chefId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Chef",
        required: function () {
            return this.bookingType === "chef";
        },
    },
    serviceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Service",
        required: function () {
            return this.bookingType === "chef";
        },
    },
    categoryId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Category",
    },
    subCategoryId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "SubCategory",
    },
    specialMenuId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "SpecialMenu",
        required: function () {
            return this.bookingType === "special-menu";
        },
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
        validate: {
            validator: function (v) {
                return v > this.startDate;
            },
            message: "End date must be after the start date.",
        },
    },
    bookingFeePaid: {
        type: Boolean,
        default: true,
    },
    bookingFeeAmount: {
        type: Number,
        min: 0,
        default: 0,
        required: true,
    },
    numberOfPeople: {
        type: Number,
        min: 1,
        default: 1,
        required: true,
    },
    procurementId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Procurement',
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0,
    },
    paymentChannel: {
        type: String,
        enum: ["paystack", "invoice"],
    },
    paymentReference: {
        type: String,
        trim: true,
        unique: true,
        sparse: true,
    },
    status: {
        type: String,
        enum: ["pending", "confirmed", "ongoing", "completed", "cancelled"],
        default: "confirmed",
        index: true,
    },
    cancellationReason: {
        type: String,
        trim: true,
    },
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        versionKey: false,
        transform(_doc, ret) {
            ret.id = ret._id.toString();
            delete ret._id;
            return ret;
        },
    },
});
/* Fast chef availability lookup */
BookingSchema.index({
    chefId: 1,
    startDate: 1,
    endDate: 1,
    status: 1,
});
/* Client booking history */
BookingSchema.index({
    clientId: 1,
    createdAt: -1,
});
/* Prevent duplicate booking for same chef + time slot */
BookingSchema.index({ chefId: 1, startDate: 1, endDate: 1 }, {
    unique: true,
    partialFilterExpression: {
        chefId: { $exists: true },
        status: { $in: ["confirmed", "ongoing"] }
    }
});
exports.Booking = (0, mongoose_1.model)("Booking", BookingSchema);
