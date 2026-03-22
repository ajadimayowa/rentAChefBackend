"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rating = void 0;
const mongoose_1 = require("mongoose");
const RatingSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    specialMenuId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'SpecialMenu', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String },
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
RatingSchema.index({ userId: 1, specialMenuId: 1 }, { unique: true });
exports.Rating = (0, mongoose_1.model)('Rating', RatingSchema);
