import { model, models, Schema } from 'mongoose';

const chefMenuSchema = new Schema(
  {
    chefId: { type: Schema.Types.ObjectId, ref: 'Chef', required: true, index: true },
    serviceSubCategoryId: { type: Schema.Types.ObjectId, ref: 'ServiceSubCategory', required: true, index: true },
    menuTitle: { type: String, required: true },
    menuDescription: { type: String },
    menuItems: [{ type: String }],
    estimatedGuestCount: { type: Number },
    status: { type: String, enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'], default: 'DRAFT', index: true },
  },
  { timestamps: true },
);

chefMenuSchema.index({ chefId: 1, serviceSubCategoryId: 1, status: 1 });

const uploadedFileSchema = new Schema(
  {
    ownerUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    purpose: { type: String, required: true, index: true },
    storageProvider: { type: String, required: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    extension: { type: String, required: true },
    fileUrl: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    metadata: { type: Schema.Types.Mixed },
    approvedByAdmin: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

uploadedFileSchema.index({ ownerUserId: 1, purpose: 1, createdAt: -1 });

export const ChefPlatformChefMenuModel = models.ChefMenu || model('ChefMenu', chefMenuSchema);
export const ChefPlatformUploadedFileModel = models.UploadedFile || model('UploadedFile', uploadedFileSchema);
