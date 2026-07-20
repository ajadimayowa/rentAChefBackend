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
exports.deleteService = exports.updateService = exports.getServiceById = exports.getServices = exports.createService = void 0;
const Service_1 = require("../../models/Service");
const mongoose_1 = require("mongoose");
const ServiceCategoryModel_1 = require("../../models/ServiceCategoryModel");
/* ===================== SERVICE CRUD ===================== */
const ALLOWED_CHEF_LEVELS = ["sous", "executive", "junior", "senior", "pro", "head"];
const ALLOWED_BOOKING_TYPES = ["instant", "quotation"];
const isDuplicateKeyError = (error) => {
    const typedError = error;
    return (typedError === null || typedError === void 0 ? void 0 : typedError.code) === 11000;
};
const normalizeChefLevels = (allowedChefLevels) => {
    if (allowedChefLevels === undefined)
        return [];
    if (!Array.isArray(allowedChefLevels)) {
        return null;
    }
    const normalized = allowedChefLevels
        .filter((level) => typeof level === "string")
        .map((level) => level.trim().toLowerCase())
        .filter((level) => ALLOWED_CHEF_LEVELS.includes(level));
    return [...new Set(normalized)];
};
// CREATE SERVICE
const createService = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, icon, categoryId, description, workflow, allowedChefLevels, bookingType, isActive } = req.body;
        const normalizedName = typeof name === "string" ? name.trim() : "";
        const normalizedDescription = typeof description === "string" ? description.trim() : "";
        const normalizedIcon = typeof icon === "string" ? icon.trim() : "";
        const normalizedWorkflow = typeof workflow === "string" ? workflow.trim() : "";
        const normalizedBookingType = typeof bookingType === "string" ? bookingType.trim().toLowerCase() : "";
        const normalizedChefLevels = normalizeChefLevels(allowedChefLevels);
        if (!normalizedName) {
            res.status(400).json({ success: false, message: "Service name is required" });
            return;
        }
        if (!categoryId || !mongoose_1.Types.ObjectId.isValid(categoryId)) {
            res.status(400).json({ success: false, message: "Valid categoryId is required" });
            return;
        }
        if (!normalizedWorkflow) {
            res.status(400).json({ success: false, message: "workflow is required" });
            return;
        }
        if (!ALLOWED_BOOKING_TYPES.includes(normalizedBookingType)) {
            res
                .status(400)
                .json({ success: false, message: "bookingType must be either instant or quotation" });
            return;
        }
        if (normalizedChefLevels === null) {
            res
                .status(400)
                .json({ success: false, message: "allowedChefLevels must be an array of valid chef levels" });
            return;
        }
        const categoryExists = yield ServiceCategoryModel_1.ServiceCategoryModel.findById(categoryId).lean();
        if (!categoryExists) {
            res.status(404).json({ success: false, message: "Service category not found" });
            return;
        }
        const existingService = yield Service_1.ServiceModel.findOne({
            categoryId,
            name: { $regex: `^${normalizedName}$`, $options: "i" },
        }).lean();
        if (existingService) {
            res.status(409).json({ success: false, message: "Service already exists in this category" });
            return;
        }
        const service = yield Service_1.ServiceModel.create({
            categoryId,
            icon: typeof normalizedIcon === "string" ? normalizedIcon : "",
            name: normalizedName,
            description: normalizedDescription,
            workflow: normalizedWorkflow,
            allowedChefLevels: normalizedChefLevels,
            bookingType: normalizedBookingType,
            isActive: typeof isActive === "boolean" ? isActive : true,
        });
        res.status(201).json({ success: true, payload: service });
    }
    catch (error) {
        if (isDuplicateKeyError(error)) {
            res.status(409).json({ success: false, message: "Service already exists" });
            return;
        }
        console.error("Error creating service:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});
exports.createService = createService;
// GET ALL SERVICES
const getServices = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status, search, page = 1, limit = 20, categoryId, bookingType, workflow } = req.query;
        const query = {};
        if (status === "active")
            query.isActive = true;
        if (status === "inactive")
            query.isActive = false;
        if (search && typeof search === "string") {
            query.name = { $regex: search.trim(), $options: "i" };
        }
        if (categoryId && mongoose_1.Types.ObjectId.isValid(String(categoryId))) {
            query.categoryId = categoryId;
        }
        if (bookingType &&
            typeof bookingType === "string" &&
            ALLOWED_BOOKING_TYPES.includes(bookingType.trim().toLowerCase())) {
            query.bookingType = bookingType.trim().toLowerCase();
        }
        if (workflow && typeof workflow === "string" && workflow.trim()) {
            query.workflow = workflow.trim();
        }
        const skip = (Number(page) - 1) * Number(limit);
        const services = yield Service_1.ServiceModel.find(query)
            .populate("categoryId", "name slug")
            .skip(skip)
            .limit(Number(limit))
            .sort({ name: 1 });
        const total = yield Service_1.ServiceModel.countDocuments(query);
        res.status(200).json({
            success: true,
            payload: services,
            meta: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error("Error fetching services:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});
exports.getServices = getServices;
// GET SINGLE SERVICE
const getServiceById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            res.status(400).json({ success: false, message: "Invalid service id" });
            return;
        }
        const service = yield Service_1.ServiceModel.findById(id).populate("categoryId", "name slug").lean();
        if (!service) {
            res.status(404).json({ success: false, message: "Service not found" });
            return;
        }
        res.status(200).json({ success: true, payload: service });
    }
    catch (error) {
        console.error("Error fetching service:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});
exports.getServiceById = getServiceById;
// UPDATE SERVICE
const updateService = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, categoryId, icon, description, workflow, allowedChefLevels, bookingType, isActive } = req.body;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            res.status(400).json({ success: false, message: "Invalid service id" });
            return;
        }
        const service = yield Service_1.ServiceModel.findById(id);
        if (!service) {
            res.status(404).json({ success: false, message: "Service not found" });
            return;
        }
        if (name !== undefined) {
            const normalizedName = typeof name === "string" ? name.trim() : "";
            if (!normalizedName) {
                res.status(400).json({ success: false, message: "Service name cannot be empty" });
                return;
            }
            service.name = normalizedName;
        }
        if (icon !== undefined) {
            const normalizedIcon = typeof icon === "string" ? icon.trim() : "";
            service.icon = normalizedIcon;
        }
        if (description !== undefined) {
            const normalizedDescription = typeof description === "string" ? description.trim() : "";
            service.description = normalizedDescription;
        }
        if (categoryId !== undefined) {
            if (!mongoose_1.Types.ObjectId.isValid(categoryId)) {
                res.status(400).json({ success: false, message: "Invalid categoryId" });
                return;
            }
            const categoryExists = yield ServiceCategoryModel_1.ServiceCategoryModel.findById(categoryId).lean();
            if (!categoryExists) {
                res.status(404).json({ success: false, message: "Service category not found" });
                return;
            }
            service.categoryId = categoryId;
        }
        if (workflow !== undefined) {
            const normalizedWorkflow = typeof workflow === "string" ? workflow.trim() : "";
            if (!normalizedWorkflow) {
                res.status(400).json({ success: false, message: "workflow cannot be empty" });
                return;
            }
            service.workflow = normalizedWorkflow;
        }
        if (allowedChefLevels !== undefined) {
            const normalizedChefLevels = normalizeChefLevels(allowedChefLevels);
            if (normalizedChefLevels === null) {
                res
                    .status(400)
                    .json({ success: false, message: "allowedChefLevels must be an array of valid chef levels" });
                return;
            }
            service.allowedChefLevels = normalizedChefLevels;
        }
        if (bookingType !== undefined) {
            const normalizedBookingType = typeof bookingType === "string" ? bookingType.trim().toLowerCase() : "";
            if (!ALLOWED_BOOKING_TYPES.includes(normalizedBookingType)) {
                res
                    .status(400)
                    .json({ success: false, message: "bookingType must be either instant or quotation" });
                return;
            }
            service.bookingType = normalizedBookingType;
        }
        if (isActive !== undefined) {
            if (typeof isActive !== "boolean") {
                res.status(400).json({ success: false, message: "isActive must be a boolean" });
                return;
            }
            service.isActive = isActive;
        }
        yield service.save();
        res.status(200).json({ success: true, payload: service });
    }
    catch (error) {
        if (isDuplicateKeyError(error)) {
            res.status(409).json({ success: false, message: "Service already exists" });
            return;
        }
        console.error("Error updating service:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});
exports.updateService = updateService;
const deleteService = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            res.status(400).json({ success: false, message: "Invalid service id" });
            return;
        }
        const service = yield Service_1.ServiceModel.findByIdAndDelete(id);
        if (!service) {
            res.status(404).json({ success: false, message: "Service not found" });
            return;
        }
        res.status(200).json({ success: true, message: "Service deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting service:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});
exports.deleteService = deleteService;
