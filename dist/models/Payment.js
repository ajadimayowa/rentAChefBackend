"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const PaymentSchema = new mongoose_1.Schema({
    booking: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Booking', required: true },
    amount: { type: Number, required: true },
    method: { type: String, required: true },
    providerResponse: { type: mongoose_1.Schema.Types.Mixed },
    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});
exports.default = (0, mongoose_1.model)('Payment', PaymentSchema);
