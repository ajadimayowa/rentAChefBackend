"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceCategoryModel = void 0;
const mongoose_1 = require("mongoose");
/**
 * Utility: slug generator
 */
const generateSlug = (value) => value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
/**
 * Schema definition
 */
const serviceCategorySchema = new mongoose_1.Schema({
    code: { type: String, unique: true, sparse: true, index: true },
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: "" },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        versionKey: false,
        transform: (_doc, ret) => {
            ret.id = ret._id.toString();
            delete ret._id;
            return ret;
        },
    },
});
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
exports.ServiceCategoryModel = (0, mongoose_1.model)("ServiceCategory", serviceCategorySchema);
