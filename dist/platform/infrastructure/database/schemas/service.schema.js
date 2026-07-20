"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChefPlatformServicePricingModel = exports.ChefPlatformServiceModel = exports.ChefPlatformServiceCategoryModel = void 0;
const mongoose_1 = require("mongoose");
const enums_1 = require("../../../domain/enums");
const serviceCategorySchema = new mongoose_1.Schema({
    code: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true });
const serviceSchema = new mongoose_1.Schema({
    categoryId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ServiceCategory', required: true, index: true },
    code: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    bookingType: { type: String, enum: Object.values(enums_1.BookingType), required: true, index: true },
    supportsChefMenu: { type: Boolean, default: false },
    supportsCustomerMenuUpload: { type: Boolean, default: false },
    supportsProcurement: { type: Boolean, default: true },
    active: { type: Boolean, default: true, index: true },
}, { timestamps: true });
const servicePricingSchema = new mongoose_1.Schema({
    serviceId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Service', required: true, index: true },
    chefLevel: { type: String, required: true, index: true },
    basePriceMinor: { type: Number, required: true },
    currency: { type: String, default: 'NGN' },
    effectiveFrom: { type: Date, required: true, index: true },
    effectiveTo: { type: Date },
    isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true });
servicePricingSchema.index({ serviceId: 1, chefLevel: 1, effectiveFrom: -1, isActive: 1 });
exports.ChefPlatformServiceCategoryModel = mongoose_1.models.ServiceCategory || (0, mongoose_1.model)('ServiceCategory', serviceCategorySchema);
exports.ChefPlatformServiceModel = mongoose_1.models.Service || (0, mongoose_1.model)('Service', serviceSchema);
exports.ChefPlatformServicePricingModel = mongoose_1.models.ServicePricing || (0, mongoose_1.model)('ServicePricing', servicePricingSchema);
