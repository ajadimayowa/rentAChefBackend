"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const UserModel = new mongoose_1.Schema({
    email: { type: String, required: true, lowercase: true },
    emailVerificationOtp: { type: String },
    isEmailVerified: { type: Boolean, default: false },
    password: { type: String, required: true },
    loginOtp: { type: String },
    loginOtpExpires: { type: Date },
    fullName: { type: String },
    firstName: { type: String },
    phone: { type: String },
    maritalStatus: { type: String, enum: ['Single', 'Married', 'Divorced', 'Widowed'] },
    gender: { type: String, enum: ['m', 'f'] },
    isAdmin: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    profilePic: { type: String }, // Added optional profilePic
    dob: { type: Date }, // Added optional profilePic
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
        isVerified: { type: Boolean, default: false }
    },
    nok: {
        fullName: { type: String },
        phone: { type: String },
        relationship: { type: String }
    },
    healthInformation: {
        allergies: { type: [String] },
        healthDetails: { type: String },
    },
    rating: { type: Number, default: 0 }
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
UserModel.index({ email: 1 }, { unique: true });
exports.default = (0, mongoose_1.model)('User', UserModel);
