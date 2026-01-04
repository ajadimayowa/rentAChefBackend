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
exports.addServiceToCategory = void 0;
const Category_1 = __importDefault(require("../../models/Category"));
/**
 * Add service to category
 */
const addServiceToCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { label, price } = req.body;
        if (!label || price === undefined) {
            return res.status(400).json({
                success: false,
                message: "Service label and price are required",
            });
        }
        const category = yield Category_1.default.findById(req.params.categoryId);
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }
        category.services.push({ label, price });
        yield category.save();
        return res.status(200).json({
            success: true,
            message: "Service added successfully",
            payload: category,
        });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
});
exports.addServiceToCategory = addServiceToCategory;
