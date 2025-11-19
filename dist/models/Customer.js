"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const CustomerSchema = new mongoose_1.Schema({
    email: { type: String, required: true, lowercase: true },
    emailVerificationOtp: { type: String },
    isEmailVerified: { type: Boolean, default: false },
    password: { type: String, required: true },
    loginOtp: { type: String },
    loginOtpExpires: { type: Date },
    fullName: { type: String },
    firstName: { type: String },
    phone: { type: String },
    isAdmin: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        versionKey: false,
        transform: function (_doc, ret) {
            ret.id = ret._id.toString();
            delete ret._id;
            return ret;
        },
    },
});
CustomerSchema.index({ email: 1 }, { unique: true });
exports.default = (0, mongoose_1.model)('Customer', CustomerSchema);
