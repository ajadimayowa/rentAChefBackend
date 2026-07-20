"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    fullName: { type: String, trim: true },
    firstName: { type: String, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    phone: { type: String, required: true, default: '' },
    role: { type: String, enum: ['CUSTOMER', 'CHEF', 'ADMIN'], default: 'CUSTOMER', index: true },
    password: { type: String },
    emailVerificationOtp: { type: String },
    isEmailVerified: { type: Boolean, default: false },
    loginOtp: { type: String },
    loginOtpExpires: { type: Date },
    profilePic: { type: String },
    gender: { type: String, enum: ['m', 'f'] },
    maritalStatus: { type: String, enum: ['Single', 'Married', 'Divorced', 'Widowed'] },
    dob: { type: Date },
    isAdmin: { type: Boolean, default: false },
    location: {
        home: { type: String },
        office: { type: String },
        state: { type: String },
        city: { type: String },
        long: { type: String },
        lat: { type: String },
    },
    kyc: {
        idType: { type: String },
        idNumber: { type: String },
        idPicture: { type: String },
        isVerified: { type: Boolean, default: false },
    },
    nok: {
        fullName: { type: String },
        phone: { type: String },
        relationship: { type: String },
    },
    healthInformation: {
        allergies: { type: [String] },
        healthDetails: { type: String },
    },
    rating: { type: Number, default: 0 },
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
exports.default = (0, mongoose_1.model)('User', userSchema);
