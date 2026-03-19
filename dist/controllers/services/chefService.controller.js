"use strict";
// controllers/chefService.controller.ts
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
exports.getServicesByChef = exports.toggleChefServiceAvailability = exports.deleteChefService = exports.updateChefService = exports.getChefService = exports.getChefServices = exports.createChefService = void 0;
const ChefService_1 = require("../../models/ChefService");
/**
 * CREATE CHEF SERVICE
 */
const createChefService = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Accept either a single serviceId or an array of serviceIds
        const { chefId, serviceId, serviceIds, isAvailable } = req.body;
        const ids = Array.isArray(serviceIds)
            ? serviceIds
            : (serviceId ? [serviceId] : []);
        if (!chefId || ids.length === 0) {
            return res.status(400).json({ success: false, message: 'chefId and at least one serviceId are required' });
        }
        // Create each chef-service entry, but tolerate duplicates (unique index on chefId+serviceId)
        const results = yield Promise.allSettled(ids.map((sid) => ChefService_1.ChefService.create({ chefId, serviceId: sid, isAvailable })));
        const created = results
            .filter((r) => r.status === 'fulfilled')
            .map((r) => r.value);
        const dupCount = results.filter((r) => r.status === 'rejected' && r.reason && r.reason.code === 11000).length;
        return res.status(201).json({
            success: true,
            message: `Chef services created${dupCount ? ` (${dupCount} skipped due to duplicates)` : ''}`,
            payload: created
        });
    }
    catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "This chef already offers this service"
            });
        }
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
exports.createChefService = createChefService;
/**
 * GET ALL CHEF SERVICES
 * Supports:
 * - pagination
 * - search by service name
 * - filter by availability
 */
const getChefServices = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = 1, limit = 10, isAvailable, chefId } = req.query;
        const query = {};
        if (isAvailable !== undefined) {
            query.isAvailable = isAvailable;
        }
        if (chefId) {
            query.chefId = chefId;
        }
        const skip = (Number(page) - 1) * Number(limit);
        const chefServices = yield ChefService_1.ChefService
            .find(query)
            .populate("chefId")
            .populate("serviceId")
            .limit(Number(limit))
            .skip(skip)
            .sort({ createdAt: -1 });
        const total = yield ChefService_1.ChefService.countDocuments(query);
        return res.json({
            success: true,
            payload: chefServices,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit))
            }
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
exports.getChefServices = getChefServices;
/**
 * GET SINGLE CHEF SERVICE
 */
const getChefService = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const chefService = yield ChefService_1.ChefService
            .findById(req.params.id)
            .populate("chefId")
            .populate("serviceId");
        if (!chefService) {
            return res.status(404).json({
                success: false,
                message: "Chef service not found"
            });
        }
        return res.json({
            success: true,
            payload: chefService
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
exports.getChefService = getChefService;
/**
 * UPDATE CHEF SERVICE
 */
const updateChefService = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const chefService = yield ChefService_1.ChefService.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!chefService) {
            return res.status(404).json({
                success: false,
                message: "Chef service not found"
            });
        }
        return res.json({
            success: true,
            message: "Chef service updated successfully",
            payload: chefService
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
exports.updateChefService = updateChefService;
/**
 * DELETE CHEF SERVICE
 */
const deleteChefService = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const chefService = yield ChefService_1.ChefService.findByIdAndDelete(req.params.id);
        if (!chefService) {
            return res.status(404).json({
                success: false,
                message: "Chef service not found"
            });
        }
        return res.json({
            success: true,
            message: "Chef service deleted successfully"
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
exports.deleteChefService = deleteChefService;
/**
 * TOGGLE AVAILABILITY
 */
const toggleChefServiceAvailability = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const chefService = yield ChefService_1.ChefService.findById(req.params.id);
        if (!chefService) {
            return res.status(404).json({
                success: false,
                message: "Chef service not found"
            });
        }
        chefService.isAvailable = !chefService.isAvailable;
        yield chefService.save();
        return res.json({
            success: true,
            message: "Availability updated",
            payload: chefService
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
exports.toggleChefServiceAvailability = toggleChefServiceAvailability;
/**
 * GET SERVICES BY CHEF
 */
const getServicesByChef = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { chefId } = req.params;
        const services = yield ChefService_1.ChefService
            .find({ chefId })
            .populate("serviceId");
        return res.json({
            success: true,
            payload: services
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
exports.getServicesByChef = getServicesByChef;
