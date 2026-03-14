"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Service = void 0;
// models/Service.ts
const mongoose_1 = require("mongoose");
const ServiceSchema = new mongoose_1.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String },
    isActive: { type: Boolean, default: true },
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        versionKey: false,
        transform(_doc, ret) {
            ret.id = ret._id.toString();
            delete ret._id;
            return ret;
        },
    },
});
exports.Service = (0, mongoose_1.model)("Service", ServiceSchema);
