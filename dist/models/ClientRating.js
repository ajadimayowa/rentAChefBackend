"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientRating = void 0;
const mongoose_1 = require("mongoose");
const ClientRatingSchema = new mongoose_1.Schema({
    chefId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Chef', required: true },
    clientId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    bookingId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Booking', required: true },
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
// each booking can only be rated once
ClientRatingSchema.index({ bookingId: 1 }, { unique: true });
exports.ClientRating = (0, mongoose_1.model)('ClientRating', ClientRatingSchema);
