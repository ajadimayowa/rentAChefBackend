"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const BookingSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    chef: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Chef', required: true },
    menu: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Menu', required: true },
    date: { type: Date, required: true },
    address: { type: String, required: true },
    guestsCount: { type: Number, default: 1 },
    totalPrice: { type: Number, required: true },
    paymentStatus: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});
exports.default = (0, mongoose_1.model)('Booking', BookingSchema);
