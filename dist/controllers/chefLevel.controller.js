"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllChefLevels = void 0;
const Category_1 = __importDefault(require("../models/Category"));
/**
 * Get All Chef Levels
 */
const getAllChefLevels = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const levels = yield Category_1.default.find({ isActive: true }).sort({ name: 1 });
        return res.status(200).json({
            success: true,
            message: "Chef levels fetched successfully",
            payload: levels.map((level) => ({ id: level._id, name: level.name })),
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Failed to fetch chef levels", error });
    }
});
exports.getAllChefLevels = getAllChefLevels;
