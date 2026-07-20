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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteServiceCategory = exports.updateServiceCategory = exports.getServiceCategoryById = exports.getServiceCategories = exports.createServiceCategory = void 0;
const mongoose_1 = require("mongoose");
const ServiceCategoryModel_1 = require("../../models/ServiceCategoryModel");
const isDuplicateKeyError = (error) => {
    const typedError = error;
    return (typedError === null || typedError === void 0 ? void 0 : typedError.code) === 11000;
};
const buildCategoryQuery = (idOrSlug) => {
    if (mongoose_1.Types.ObjectId.isValid(idOrSlug)) {
        return { _id: idOrSlug };
    }
    return { slug: String(idOrSlug).toLowerCase().trim() };
};
/* ===================== SERVICE CATEGORY CRUD ===================== */
const createServiceCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, description, isActive } = req.body;
        const normalizedName = typeof name === "string" ? name.trim() : "";
        const normalizedDescription = typeof description === "string" ? description.trim() : "";
        if (!normalizedName) {
            res.status(400).json({ success: false, message: "Category name is required" });
            return;
        }
        const existing = yield ServiceCategoryModel_1.ServiceCategoryModel.findOne({
            name: { $regex: `^${normalizedName}$`, $options: "i" },
        });
        if (existing) {
            res.status(409).json({ success: false, message: "Service category already exists" });
            return;
        }
        const category = yield ServiceCategoryModel_1.ServiceCategoryModel.create({
            name: normalizedName,
            description: normalizedDescription,
            isActive: typeof isActive === "boolean" ? isActive : true,
        });
        res.status(201).json({ success: true, payload: category });
    }
    catch (error) {
        if (isDuplicateKeyError(error)) {
            res.status(409).json({ success: false, message: "Service category already exists" });
            return;
        }
        console.error("Error creating service category:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});
exports.createServiceCategory = createServiceCategory;
const getServiceCategories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status, search, page = 1, limit = 20 } = req.query;
        const query = {};
        if (status === "active")
            query.isActive = true;
        if (status === "inactive")
            query.isActive = false;
        if (search && typeof search === "string") {
            query.name = { $regex: search, $options: "i" };
        }
        const skip = (Number(page) - 1) * Number(limit);
        const categories = yield ServiceCategoryModel_1.ServiceCategoryModel.find(query)
            .skip(skip)
            .limit(Number(limit))
            .sort({ name: 1 });
        const total = yield ServiceCategoryModel_1.ServiceCategoryModel.countDocuments(query);
        res.status(200).json({
            success: true,
            payload: categories,
            meta: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error("Error fetching service categories:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});
exports.getServiceCategories = getServiceCategories;
const getServiceCategoryById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const query = buildCategoryQuery(id);
        const category = yield ServiceCategoryModel_1.ServiceCategoryModel.findOne(query);
        if (!category) {
            res.status(404).json({ success: false, message: "Service category not found" });
            return;
        }
        res.status(200).json({ success: true, payload: category });
    }
    catch (error) {
        console.error("Error fetching service category:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});
exports.getServiceCategoryById = getServiceCategoryById;
const updateServiceCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, description, isActive } = req.body;
        const query = buildCategoryQuery(id);
        const normalizedName = typeof name === "string" ? name.trim() : "";
        const category = yield ServiceCategoryModel_1.ServiceCategoryModel.findOne(query);
        if (!category) {
            res.status(404).json({ success: false, message: "Service category not found" });
            return;
        }
        if (name !== undefined) {
            if (!normalizedName) {
                res.status(400).json({ success: false, message: "Category name cannot be empty" });
                return;
            }
            category.name = normalizedName;
        }
        if (description !== undefined) {
            category.description = typeof description === "string" ? description.trim() : "";
        }
        if (isActive !== undefined) {
            if (typeof isActive !== "boolean") {
                res.status(400).json({ success: false, message: "isActive must be a boolean" });
                return;
            }
            category.isActive = isActive;
        }
        yield category.save();
        res.status(200).json({ success: true, payload: category });
    }
    catch (error) {
        if (isDuplicateKeyError(error)) {
            res.status(409).json({ success: false, message: "Service category already exists" });
            return;
        }
        console.error("Error updating service category:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});
exports.updateServiceCategory = updateServiceCategory;
const deleteServiceCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const query = buildCategoryQuery(id);
        const category = yield ServiceCategoryModel_1.ServiceCategoryModel.findOneAndDelete(query);
        if (!category) {
            res.status(404).json({ success: false, message: "Service category not found" });
            return;
        }
        res.status(200).json({ success: true, message: "Service category deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting service category:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});
exports.deleteServiceCategory = deleteServiceCategory;
