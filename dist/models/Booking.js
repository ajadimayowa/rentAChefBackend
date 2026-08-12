"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingModel = exports.PaymentStatus = exports.BookingStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const enums_1 = require("../platform/domain/enums");
Object.defineProperty(exports, "BookingStatus", { enumerable: true, get: function () { return enums_1.BookingStatus; } });
Object.defineProperty(exports, "PaymentStatus", { enumerable: true, get: function () { return enums_1.PaymentStatus; } });
const MenuSelectionSchema = new mongoose_1.Schema({
    source: { type: String, enum: ["chef", "customer"] },
    chefMenuId: { type: mongoose_1.Schema.Types.ObjectId, ref: "ChefMenu" },
    uploadedMenuUrl: String,
    uploadedMenuType: String,
});
const ProcurementSchema = new mongoose_1.Schema({
    option: { type: String, enum: ["customer", "chef"] },
    estimatedCost: Number,
    finalCost: Number,
    procurementFee: Number,
});
const PaymentDetailsSchema = new mongoose_1.Schema({
    mode: { type: String, enum: ["Cash", "Transfer"], required: true },
    transactionRef: { type: String, required: true },
    bankName: { type: String },
    accountNumber: { type: String },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    recordedBy: { type: String, required: true },
    recordedAt: { type: Date, required: true, default: Date.now },
}, { _id: false });
const BookingSchema = new mongoose_1.Schema({
    bookingNumber: { type: String, required: true, unique: true, index: true },
    customerId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", index: true },
    chefId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", index: true },
    specialServiceId: { type: mongoose_1.Schema.Types.ObjectId, ref: "SpecialMenu", index: true },
    serviceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Service",
        index: true,
    },
    chefCategory: {
        type: String,
        ref: "Category",
        index: true,
    },
    workflow: { type: String, index: true },
    bookingType: {
        type: String,
        enum: Object.values(enums_1.BookingType),
    },
    modeOfPayment: {
        type: String,
        enum: ['Paystack', 'Transfer', 'Cash', 'Unpaid'],
        index: true,
    },
    status: {
        type: String,
        enum: Object.values(enums_1.BookingStatus),
        index: true,
        default: enums_1.BookingStatus.SUBMITTED,
    },
    paymentStatus: {
        type: String,
        enum: Object.values(enums_1.PaymentStatus),
        default: enums_1.PaymentStatus.UNPAID,
        index: true,
    },
    bookingData: mongoose_1.Schema.Types.Mixed,
    pricingSnapshot: {
        baseChefFeeMinor: { type: Number, default: 0 },
        estimatedTotalMinor: { type: Number, default: 0 },
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
    menuSelection: MenuSelectionSchema,
    menuSelectionType: { type: String, enum: ['CHEF_MENU', 'CUSTOMER_UPLOAD'] },
    chefMenuId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ChefMenu' },
    customerUploadedMenuFileId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'UploadedFile' },
    procurement: ProcurementSchema,
    comments: [
        {
            text: { type: String, required: true },
            authorId: { type: String, required: true },
            authorName: { type: String },
            createdAt: { type: Date, required: true, default: Date.now },
        },
    ],
    paymentDetails: PaymentDetailsSchema,
    quotationId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Quotation" },
    transactnRef: { type: String, required: true, index: true, default: "" },
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
BookingSchema.index({ customerId: 1, createdAt: -1 });
BookingSchema.index({ status: 1, paymentStatus: 1, createdAt: -1 });
BookingSchema.index({ serviceId: 1, chefLevel: 1, status: 1 });
exports.BookingModel = mongoose_1.default.model("Booking", BookingSchema);
