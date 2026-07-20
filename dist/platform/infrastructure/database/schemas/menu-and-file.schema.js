"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChefPlatformUploadedFileModel = exports.ChefPlatformChefMenuModel = void 0;
const mongoose_1 = require("mongoose");
const chefMenuSchema = new mongoose_1.Schema({
    chefId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Chef', required: true, index: true },
    serviceSubCategoryId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ServiceSubCategory', required: true, index: true },
    menuTitle: { type: String, required: true },
    menuDescription: { type: String },
    menuItems: [{ type: String }],
    estimatedGuestCount: { type: Number },
    status: { type: String, enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'], default: 'DRAFT', index: true },
}, { timestamps: true });
chefMenuSchema.index({ chefId: 1, serviceSubCategoryId: 1, status: 1 });
const uploadedFileSchema = new mongoose_1.Schema({
    ownerUserId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    purpose: { type: String, required: true, index: true },
    storageProvider: { type: String, required: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    extension: { type: String, required: true },
    fileUrl: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    metadata: { type: mongoose_1.Schema.Types.Mixed },
    approvedByAdmin: { type: Boolean, default: false, index: true },
}, { timestamps: true });
uploadedFileSchema.index({ ownerUserId: 1, purpose: 1, createdAt: -1 });
exports.ChefPlatformChefMenuModel = mongoose_1.models.ChefMenu || (0, mongoose_1.model)('ChefMenu', chefMenuSchema);
exports.ChefPlatformUploadedFileModel = mongoose_1.models.UploadedFile || (0, mongoose_1.model)('UploadedFile', uploadedFileSchema);
