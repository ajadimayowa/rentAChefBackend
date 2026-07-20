"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChefPlatformChefModel = void 0;
const mongoose_1 = require("mongoose");
const enums_1 = require("../../../domain/enums");
const chefSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    level: { type: String, enum: Object.values(enums_1.ChefLevel), required: true, index: true },
    servicesOffered: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Service', required: true }],
    availability: [
        {
            start: { type: Date, required: true, index: true },
            end: { type: Date, required: true, index: true },
            isBooked: { type: Boolean, default: false },
            zone: { type: String },
        },
    ],
    ratings: {
        average: { type: Number, default: 0 },
        totalReviews: { type: Number, default: 0 },
    },
    experienceYears: { type: Number, default: 0 },
    certifications: [{ type: String }],
    isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true });
chefSchema.index({ level: 1, isActive: 1 });
chefSchema.index({ servicesOffered: 1, level: 1 });
exports.ChefPlatformChefModel = mongoose_1.models.Chef || (0, mongoose_1.model)('Chef', chefSchema);
