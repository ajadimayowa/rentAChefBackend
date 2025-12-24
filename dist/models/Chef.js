"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const ChefSchema = new mongoose_1.Schema({
    staffId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    gender: {
        type: String,
        enum: ['m', 'f'],
        required: true
    },
    email: { type: String, required: true, unique: true },
    bio: { type: String },
    specialties: { type: [String], default: [] },
    category: { type: String, required: true },
    phoneNumber: { type: Number, required: true },
    location: { type: String, required: true },
    state: { type: String, required: true },
    stateId: { type: Number, required: true },
    profilePic: { type: String },
    menus: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Menu" }],
    password: { type: String, default: null },
    isPasswordUpdated: { type: Boolean, default: false },
    isActive: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
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
ChefSchema.index({ staffId: 1, phoneNumber: 1 }, { unique: true });
exports.default = (0, mongoose_1.model)("Chef", ChefSchema);
