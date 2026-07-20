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
exports.ServiceModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ServiceSchema = new mongoose_1.Schema({
    categoryId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "ServiceCategory",
        required: true,
    },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    icon: { type: String, default: "" },
    code: { type: String, unique: true, sparse: true, index: true },
    workflow: { type: String },
    supportsChefMenu: { type: Boolean, default: false },
    supportsCustomerMenuUpload: { type: Boolean, default: false },
    supportsProcurement: { type: Boolean, default: true },
    allowedChefLevels: {
        type: [String],
        enum: ["sous", "executive", "junior", "senior", "pro", "head"],
    },
    bookingType: {
        type: String,
        enum: ["instant", "quotation"],
    },
    isActive: { type: Boolean, default: true },
    active: { type: Boolean, default: true, index: true },
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
exports.ServiceModel = mongoose_1.default.model("Service", ServiceSchema);
