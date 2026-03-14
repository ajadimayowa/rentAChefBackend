"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServicePricing = void 0;
// models/ServicePricing.ts
const mongoose_1 = require("mongoose");
const ServicePricingOptionSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String } // optional, if not provided, fallback to parent currency
});
const ServicePricingSchema = new mongoose_1.Schema({
    serviceId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Service", required: true },
    chefCategoryId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Category", required: true },
    price: { type: Number, required: true },
    servicePricingOptions: { type: [ServicePricingOptionSchema], default: [] }, // NEW
    currency: { type: String, default: "NGN" },
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
// Ensure no duplicate service+category combination
ServicePricingSchema.index({ serviceId: 1, chefCategoryId: 1 }, { unique: true });
exports.ServicePricing = (0, mongoose_1.model)("ServicePricing", ServicePricingSchema);
