import { Schema, model, Document, Types } from "mongoose";

export interface IServiceCategory extends Document {
  code?: string;
  name: string;
  description?: string;
  slug?: string;
  sortOrder?: number;
  isActive: boolean;
}

/**
 * Utility: slug generator
 */
const generateSlug = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

/**
 * Schema definition
 */
const serviceCategorySchema = new Schema<IServiceCategory>(
  {
    code: { type: String, unique: true, sparse: true, index: true },
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: "" },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  }
);

/**
 * Middleware: auto-generate slug
 */
serviceCategorySchema.pre("save", function (next) {
  if (this.isModified("name") || !this.slug) {
    this.slug = generateSlug(this.name);
  }
  if (!this.code) {
    this.code = generateSlug(this.name).toUpperCase().replace(/-/g, '_');
  }
  next();
});

/**
 * Model export
 */
export const ServiceCategoryModel = model<IServiceCategory>(
  "ServiceCategory",
  serviceCategorySchema
);