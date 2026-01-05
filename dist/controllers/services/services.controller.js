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
exports.deleteService = exports.updateService = exports.getServiceById = exports.getServicesByCategory = exports.getAllServices = exports.createService = void 0;
const Service_model_1 = require("../../models/Service.model");
const Category_1 = __importDefault(require("../../models/Category"));
/**
 * CREATE SERVICE
 */
const createService = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, description, price, category, services = [] } = req.body;
        // Validate category existence
        const categoryExists = yield Category_1.default.findById(category);
        if (!categoryExists) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }
        const service = yield Service_model_1.Service.create({
            name,
            description,
            price,
            category,
            services, // 👈 options allowed on create
        });
        return res.status(201).json({
            success: true,
            message: "Service created successfully",
            payload: service,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error creating service",
            payload: error,
        });
    }
});
exports.createService = createService;
/**
 * GET ALL SERVICES
 */
const getAllServices = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = "1", limit = "10", categoryId, priceSort, // asc | desc
         } = req.query;
        const pageNumber = Math.max(parseInt(page, 10), 1);
        const pageSize = Math.max(parseInt(limit, 10), 1);
        const skip = (pageNumber - 1) * pageSize;
        // 🔎 Filters
        const filter = {};
        if (categoryId) {
            filter.category = categoryId;
        }
        // 🔃 Sorting
        const sort = {};
        if (priceSort === "asc")
            sort.price = 1;
        if (priceSort === "desc")
            sort.price = -1;
        // Default sort (newest first)
        if (!priceSort)
            sort.createdAt = -1;
        const [services, total] = yield Promise.all([
            Service_model_1.Service.find(filter)
                .populate("category", "name slug")
                .sort(sort)
                .skip(skip)
                .limit(pageSize),
            Service_model_1.Service.countDocuments(filter),
        ]);
        return res.status(200).json({
            success: true,
            meta: {
                total,
                page: pageNumber,
                limit: pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
            payload: services,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching services",
            payload: error,
        });
    }
});
exports.getAllServices = getAllServices;
/**
 * GET SERVICES BY CATEGORY
 */
const getServicesByCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { categoryId } = req.params;
        const services = yield Service_model_1.Service.find({ category: categoryId })
            .populate("category", "name slug");
        return res.status(200).json({
            success: true,
            payload: services,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching services by category",
            payload: error,
        });
    }
});
exports.getServicesByCategory = getServicesByCategory;
/**
 * GET SINGLE SERVICE
 */
const getServiceById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const service = yield Service_model_1.Service.findById(req.params.id)
            .populate("category", "name slug");
        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Service not found",
            });
        }
        return res.status(200).json({
            success: true,
            payload: service,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching service",
            payload: error,
        });
    }
});
exports.getServiceById = getServiceById;
/**
 * UPDATE SERVICE
 */
const updateService = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const updatedService = yield Service_model_1.Service.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updatedService) {
            return res.status(404).json({
                success: false,
                message: "Service not found",
            });
        }
        return res.status(200).json({
            success: true,
            message: "Service updated successfully",
            payload: updatedService,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error updating service",
            payload: error,
        });
    }
});
exports.updateService = updateService;
/**
 * DELETE SERVICE
 */
const deleteService = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const deletedService = yield Service_model_1.Service.findByIdAndDelete(req.params.id);
        if (!deletedService) {
            return res.status(404).json({
                success: false,
                message: "Service not found",
            });
        }
        return res.status(200).json({
            success: true,
            message: "Service deleted successfully",
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error deleting service",
            payload: error,
        });
    }
});
exports.deleteService = deleteService;
