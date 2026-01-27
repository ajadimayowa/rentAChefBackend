"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Menu = void 0;
const mongoose_1 = require("mongoose");
const ProcurementSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
}, { _id: false });
const MenuDaySchema = new mongoose_1.Schema({
    day: {
        type: String,
        required: true,
        enum: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
        ],
    },
    breakfast: { type: String, required: true },
    lunch: { type: String, required: true },
    dinner: { type: String, required: true },
}, { _id: false });
const MenuWeekSchema = new mongoose_1.Schema({
    weekNumber: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    days: {
        type: [MenuDaySchema],
        required: true,
        validate: [(v) => v.length > 0, "Days cannot be empty"],
    },
}, { _id: false });
const MenuSchema = new mongoose_1.Schema({
    chefId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Chef",
        required: true,
        index: true,
    },
    month: {
        type: String,
        required: true,
        match: /^\d{4}-(0[1-9]|1[0-2])$/, // YYYY-MM
        index: true,
    },
    weeks: {
        type: [MenuWeekSchema],
        required: true,
        validate: [(v) => v.length > 0, "Weeks cannot be empty"],
    },
    procurement: {
        type: [ProcurementSchema],
        default: [],
    },
    menuPic: {
        type: String,
        required: true,
    },
    createdBy: {
        type: String,
        enum: ["chef", "admin"],
        required: true,
    },
    approved: {
        type: Boolean,
        default: false,
    },
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
/* ---------- Prevent Duplicate Menu per Chef per Month ---------- */
MenuSchema.index({ chefId: 1, month: 1 }, { unique: true });
exports.Menu = (0, mongoose_1.model)("Menu", MenuSchema);
