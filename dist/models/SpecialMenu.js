"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpecialMenu = void 0;
const mongoose_1 = require("mongoose");
/** Procurement Schema */
const ProcurementSchema = new mongoose_1.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String },
    price: { type: Number, required: true },
}, { _id: false });
/** Special Menu Schema */
const SpecialMenuSchema = new mongoose_1.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String },
    image: { type: String }, // image URL
    procurements: {
        type: [ProcurementSchema],
        default: [],
    },
    price: { type: Number, required: true },
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
exports.SpecialMenu = (0, mongoose_1.model)("SpecialMenu", SpecialMenuSchema);
