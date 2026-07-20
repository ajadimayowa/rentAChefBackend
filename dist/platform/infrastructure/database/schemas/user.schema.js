"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChefPlatformUserModel = void 0;
const mongoose_1 = require("mongoose");
const enums_1 = require("../../../domain/enums");
const userSchema = new mongoose_1.Schema({
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    phone: { type: String },
    role: { type: String, enum: Object.values(enums_1.UserRole), required: true, index: true },
}, { timestamps: true });
exports.ChefPlatformUserModel = mongoose_1.models.User || (0, mongoose_1.model)('User', userSchema);
