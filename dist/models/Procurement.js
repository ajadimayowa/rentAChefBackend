"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const ProcurementItemSchema = new mongoose_1.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    amount: { type: Number, required: true, min: 0 },
});
const ProcurementSchema = new mongoose_1.Schema({
    bookingId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Booking', required: true },
    items: { type: [ProcurementItemSchema], default: [] },
    totalCost: { type: Number, required: true, min: 0, default: 0 },
    isProcurementPaid: { type: Boolean, default: false },
    paymentChannel: { type: String, enum: ['paystack', 'transfer'] },
    paymentReference: { type: String, trim: true },
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
// Calculate totalCost before save by summing item amounts
ProcurementSchema.pre('save', function (next) {
    try {
        const doc = this;
        if (Array.isArray(doc.items)) {
            doc.totalCost = doc.items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
        }
        else {
            doc.totalCost = 0;
        }
        next();
    }
    catch (err) {
        next(err);
    }
});
exports.default = (0, mongoose_1.model)('Procurement', ProcurementSchema);
