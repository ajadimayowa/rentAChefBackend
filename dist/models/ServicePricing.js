"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServicePricing = void 0;
// models/ServicePricing.ts
const mongoose_1 = require("mongoose");
const ServicePricingOptionSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String }
});
const ServicePricingSchema = new mongoose_1.Schema({
    serviceId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Service", index: true },
    specialServiceId: { type: mongoose_1.Schema.Types.ObjectId, ref: "SpecialMenu", index: true },
    serviceCategoryId: { type: mongoose_1.Schema.Types.ObjectId, ref: "ServiceCategory", index: true },
    chefCategoryId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Category", required: true, index: true },
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
ServicePricingSchema.index({ serviceId: 1, chefCategoryId: 1, pricingType: 1 }, {
    unique: true,
    partialFilterExpression: {
        serviceId: { $type: "objectId" },
        isActive: true,
    },
});
ServicePricingSchema.index({ specialServiceId: 1, chefCategoryId: 1, pricingType: 1 }, {
    unique: true,
    partialFilterExpression: {
        specialServiceId: { $type: "objectId" },
        isActive: true,
    },
});
exports.ServicePricing = mongoose_1.models.ServicePricing || (0, mongoose_1.model)("ServicePricing", ServicePricingSchema);
