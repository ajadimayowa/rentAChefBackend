"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Favorite = void 0;
const mongoose_1 = require("mongoose");
const FavoriteSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    specialMenuId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'SpecialMenu', required: true },
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
FavoriteSchema.index({ userId: 1, specialMenuId: 1 }, { unique: true });
exports.Favorite = (0, mongoose_1.model)('Favorite', FavoriteSchema);
