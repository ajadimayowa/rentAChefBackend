"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const GrocerySchema = new mongoose_1.Schema({
    groceryName: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    unitPrice: {
        type: Number,
        required: true,
        min: 0,
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
const Menu = new mongoose_1.Schema({
    menuCreatorType: {
        type: String,
        enum: ["chef", "organization"],
        required: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    isSignatureMenu: {
        type: Boolean,
        required: function () {
            return this.menuCreatorType === "chef";
        },
    },
    relatedServiceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Service",
        required: true,
    },
    menuType: {
        type: String,
        enum: ["breakfast", "lunch", "dinner"],
        required: true,
    },
    menuClass: {
        type: String,
        enum: ["nigerian", "continental"],
        required: false,
    },
    pricingModel: {
        type: String,
        enum: ["perhead", "plater"],
        required: false,
    },
    samplePicture: {
        type: String,
        trim: true,
        default: null,
    },
    menuCategory: {
        type: [
            {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: "MenuTypes",
            },
        ],
        default: [],
    },
    pricePerHead: {
        type: Number,
        required: true,
        min: 0,
    },
    chefId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: function () {
            return this.menuCreatorType === "chef";
        },
    },
    packages: {
        type: [{
                type: mongoose_1.Schema.Types.ObjectId,
                ref: "Package",
            }],
        default: [],
    },
    groceries: {
        type: [GrocerySchema],
        default: [],
    },
    totalGroceryCost: {
        type: Number,
        default: 0,
        min: 0,
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
Menu.pre("save", function (next) {
    const groceries = Array.isArray(this.groceries) ? this.groceries : [];
    this.totalGroceryCost = groceries.reduce((sum, grocery) => sum + Number((grocery === null || grocery === void 0 ? void 0 : grocery.unitPrice) || 0), 0);
    next();
});
exports.default = mongoose_1.default.model("Menu", Menu);
