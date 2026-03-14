"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChefService = void 0;
// models/ChefService.ts
const mongoose_1 = require("mongoose");
const ChefServiceSchema = new mongoose_1.Schema({
    chefId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Chef", required: true },
    serviceId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Service", required: true },
    isAvailable: { type: Boolean, default: true },
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
// Prevent duplicate chef-service combinations
ChefServiceSchema.index({ chefId: 1, serviceId: 1 }, { unique: true });
exports.ChefService = (0, mongoose_1.model)("ChefService", ChefServiceSchema);
