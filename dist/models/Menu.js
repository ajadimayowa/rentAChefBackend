"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const MenuSchema = new mongoose_1.Schema({
    chef: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Chef', required: true },
    title: { type: String, required: true },
    items: [
        {
            name: { type: String, required: true },
            price: { type: Number, required: true },
            description: { type: String }
        }
    ],
    createdAt: { type: Date, default: Date.now }
});
exports.default = (0, mongoose_1.model)('Menu', MenuSchema);
