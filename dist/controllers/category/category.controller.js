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
exports.deleteCategory = exports.updateCategory = exports.getSingleCategory = exports.getAllCategories = exports.createCategory = void 0;
const Category_1 = __importDefault(require("../../models/Category"));
/**
 * Create Category
 */
const createCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const catPic = req.file; // multer file
        const { name, description } = req.body;
        if (!name || !description) {
            return res.status(400).json({ message: "name, description are required" });
        }
        const category = yield Category_1.default.create({
            name,
            description,
            image: (catPic === null || catPic === void 0 ? void 0 : catPic.location) || (catPic === null || catPic === void 0 ? void 0 : catPic.path) || "", // depending on S3 or local
        });
        return res.status(201).json({ success: true, payload: category });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
});
exports.createCategory = createCategory;
/**
 * Get All Categories
 */
const getAllCategories = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categories = yield Category_1.default.find().sort({ createdAt: -1 });
        return res.status(200).json({ success: true, payload: categories });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Failed to fetch categories" });
    }
});
exports.getAllCategories = getAllCategories;
/**
 * Get Category by ID or Slug
 */
const getSingleCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const category = yield Category_1.default.findOne({
            $or: [{ _id: id }, { slug: id }],
        });
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }
        return res.status(200).json({ success: true, payload: category });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: "Invalid category ID" });
    }
});
exports.getSingleCategory = getSingleCategory;
/**
 * Update Category
 */
const updateCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const category = yield Category_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }
        return res.status(200).json({ success: true, payload: category });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
});
exports.updateCategory = updateCategory;
/**
 * Delete Category
 */
const deleteCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const category = yield Category_1.default.findByIdAndDelete(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }
        return res.status(200).json({ success: true, message: "Category deleted successfully" });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: "Invalid category ID" });
    }
});
exports.deleteCategory = deleteCategory;
