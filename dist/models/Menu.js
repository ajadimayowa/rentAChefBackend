"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const MenuSchema = new mongoose_1.Schema({
    chef: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Chef' },
    title: { type: String, required: true },
    menuPic: { type: String },
    basePrice: { type: Number, required: true },
    isDefault: { type: Boolean, required: true, default: false },
    items: [
        {
            name: { type: String, required: true },
            price: { type: Number, required: true },
            description: { type: String }
        }
    ],
    createdAt: { type: Date, default: Date.now }
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
exports.default = (0, mongoose_1.model)('Menu', MenuSchema);
