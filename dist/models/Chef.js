"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const ChefSchema = new mongoose_1.Schema({
    staffId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    bio: { type: String },
    specialties: { type: [String], default: [] },
    location: { type: String },
    profilePic: { type: String },
    menus: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Menu" }],
    password: { type: String, default: null },
    isActive: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});
exports.default = (0, mongoose_1.model)("Chef", ChefSchema);
