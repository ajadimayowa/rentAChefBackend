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
/* ===================== SERVICE CRUD ===================== */
// CREATE SERVICE
const createService = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, description, isActive } = req.body;
        // 1️⃣ Validate input
        if (!name || typeof name !== "string") {
            return res.status(400).json({ success: false, message: "Service name is required" });
        }
        // 2️⃣ Check for duplicate
        const existingService = yield Service_1.Service.findOne({ name: name.trim() });
        if (existingService) {
            return res.status(409).json({ success: false, message: "Service already exists" });
        }
        // 3️⃣ Create the service
        const service = yield Service_1.Service.create({
            name: name.trim(),
            description: description || "",
            isActive: isActive !== undefined ? isActive : true,
        });
        // 4️⃣ Respond with the created service
        return res.status(201).json({ success: true, data: service });
    }
    catch (error) {
        console.error("Error creating service:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
});
exports.createService = createService;
// GET ALL SERVICES
const getServices = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status, search, page = 1, limit = 20 } = req.query;
        // Build query object
        const query = {};
        // 1️⃣ Filter by status
        if (status === "active")
            query.isActive = true;
        if (status === "inactive")
            query.isActive = false;
        // 2️⃣ Search by name (case-insensitive)
        if (search && typeof search === "string") {
            query.name = { $regex: search, $options: "i" }; // partial match
        }
        // 3️⃣ Pagination
        const skip = (Number(page) - 1) * Number(limit);
        const services = yield Service_1.Service.find(query)
            .skip(skip)
            .limit(Number(limit))
            .sort({ name: 1 }); // sort alphabetically by name
        const total = yield Service_1.Service.countDocuments(query);
        return res.status(200).json({
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
        return res.status(500).json({ success: false, message: "Server error" });
    }
});
exports.getServices = getServices;
// GET SINGLE SERVICE
// GET SINGLE SERVICE
const getServiceById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const service = yield Service_1.Service.findById(id).lean();
        if (!service) {
            return res.status(404).json({ success: false, message: "Service not found" });
        }
        return res.status(200).json({ success: true, data: service });
    }
    catch (error) {
        console.error("Error fetching service:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
});
exports.getServiceById = getServiceById;
// UPDATE SERVICE
const updateService = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, description, isActive } = req.body;
        const service = yield Service_1.Service.findById(id);
        if (!service) {
            return res.status(404).json({ success: false, message: "Service not found" });
        }
        // Update fields if provided
        if (name)
            service.name = name.trim();
        if (description !== undefined)
            service.description = description;
        if (isActive !== undefined)
            service.isActive = isActive;
        yield service.save();
        return res.status(200).json({ success: true, data: service });
    }
    catch (error) {
        console.error("Error updating service:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
});
exports.updateService = updateService;
const deleteService = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Option 1: find and delete
        const service = yield Service_1.Service.findByIdAndDelete(id);
        if (!service) {
            return res.status(404).json({ success: false, message: "Service not found" });
        }
        return res.status(200).json({ success: true, message: "Service deleted successfully" });
        // -----------------------------
        // Option 2: soft delete (recommended)
        // const service = await Service.findById(id);
        // if (!service) return res.status(404).json({ success: false, message: "Service not found" });
        // service.isActive = false;
        // await service.save();
        // return res.status(200).json({ success: true, message: "Service deactivated successfully" });
    }
    catch (error) {
        console.error("Error deleting service:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
});
exports.deleteService = deleteService;
