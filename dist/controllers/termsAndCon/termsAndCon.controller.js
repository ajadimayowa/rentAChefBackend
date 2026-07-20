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
exports.deleteTermsAndCon = exports.updateTermsAndCon = exports.getTermsAndConById = exports.getTermsAndCons = exports.createTermsAndCon = void 0;
const mongoose_1 = require("mongoose");
const TermsAndCon_1 = require("../../models/TermsAndCon");
const Service_1 = require("../../models/Service");
const ServiceCategoryModel_1 = require("../../models/ServiceCategoryModel");
const SpecialMenu_1 = require("../../models/SpecialMenu");
const hasAnyTarget = (serviceId, categoryId, specialMenuId) => {
    return Boolean(serviceId) || Boolean(categoryId) || Boolean(specialMenuId);
};
const isValidObjectId = (value) => {
    return typeof value === "string" && mongoose_1.Types.ObjectId.isValid(value);
};
const createTermsAndCon = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { description, serviceId, categoryId, specialMenuId } = req.body;
        const normalizedDescription = typeof description === "string" ? description.trim() : "";
        if (!normalizedDescription) {
            res.status(400).json({ success: false, message: "description is required" });
            return;
        }
        if (!hasAnyTarget(serviceId, categoryId, specialMenuId)) {
            res
                .status(400)
                .json({ success: false, message: "One of serviceId, categoryId, or specialMenuId must be provided" });
            return;
        }
        if (serviceId !== undefined && serviceId !== null) {
            if (!isValidObjectId(serviceId)) {
                res.status(400).json({ success: false, message: "Invalid serviceId" });
                return;
            }
            const serviceExists = yield Service_1.ServiceModel.findById(serviceId).lean();
            if (!serviceExists) {
                res.status(404).json({ success: false, message: "Service not found" });
                return;
            }
        }
        if (categoryId !== undefined && categoryId !== null) {
            if (!isValidObjectId(categoryId)) {
                res.status(400).json({ success: false, message: "Invalid categoryId" });
                return;
            }
            const categoryExists = yield ServiceCategoryModel_1.ServiceCategoryModel.findById(categoryId).lean();
            if (!categoryExists) {
                res.status(404).json({ success: false, message: "Service category not found" });
                return;
            }
        }
        if (specialMenuId !== undefined && specialMenuId !== null) {
            if (!isValidObjectId(specialMenuId)) {
                res.status(400).json({ success: false, message: "Invalid specialMenuId" });
                return;
            }
            const specialMenuExists = yield SpecialMenu_1.SpecialMenu.findById(specialMenuId).lean();
            if (!specialMenuExists) {
                res.status(404).json({ success: false, message: "Special menu not found" });
                return;
            }
        }
        const record = yield TermsAndCon_1.TermsAndConModel.create({
            description: normalizedDescription,
            serviceId: serviceId || undefined,
            categoryId: categoryId || undefined,
            specialMenuId: specialMenuId || undefined,
        });
        res.status(201).json({ success: true, payload: record });
    }
    catch (error) {
        console.error("Error creating TermsAndCon:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});
exports.createTermsAndCon = createTermsAndCon;
const getTermsAndCons = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { serviceId, categoryId, specialMenuId, page = 1, limit = 20 } = req.query;
        const query = {};
        if (serviceId && isValidObjectId(String(serviceId))) {
            query.serviceId = serviceId;
        }
        if (categoryId && isValidObjectId(String(categoryId))) {
            query.categoryId = categoryId;
        }
        if (specialMenuId && isValidObjectId(String(specialMenuId))) {
            query.specialMenuId = specialMenuId;
        }
        const skip = (Number(page) - 1) * Number(limit);
        const records = yield TermsAndCon_1.TermsAndConModel.find(query)
            .populate("serviceId", "name")
            .populate("categoryId", "name slug")
            .populate("specialMenuId", "title")
            .skip(skip)
            .limit(Number(limit))
            .sort({ createdAt: -1 });
        const total = yield TermsAndCon_1.TermsAndConModel.countDocuments(query);
        res.status(200).json({
            success: true,
            payload: records,
            meta: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error("Error fetching TermsAndCon records:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});
exports.getTermsAndCons = getTermsAndCons;
const getTermsAndConById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            res.status(400).json({ success: false, message: "Invalid TermsAndCon id" });
            return;
        }
        const record = yield TermsAndCon_1.TermsAndConModel.findById(id)
            .populate("serviceId", "name")
            .populate("categoryId", "name slug")
            .populate("specialMenuId", "title");
        if (!record) {
            res.status(404).json({ success: false, message: "TermsAndCon not found" });
            return;
        }
        res.status(200).json({ success: true, payload: record });
    }
    catch (error) {
        console.error("Error fetching TermsAndCon by id:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});
exports.getTermsAndConById = getTermsAndConById;
const updateTermsAndCon = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { description, serviceId, categoryId, specialMenuId } = req.body;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            res.status(400).json({ success: false, message: "Invalid TermsAndCon id" });
            return;
        }
        const record = yield TermsAndCon_1.TermsAndConModel.findById(id);
        if (!record) {
            res.status(404).json({ success: false, message: "TermsAndCon not found" });
            return;
        }
        if (description !== undefined) {
            const normalizedDescription = typeof description === "string" ? description.trim() : "";
            if (!normalizedDescription) {
                res.status(400).json({ success: false, message: "description is required" });
                return;
            }
            record.description = normalizedDescription;
        }
        if (serviceId !== undefined) {
            if (serviceId === null || serviceId === "") {
                record.serviceId = undefined;
            }
            else {
                if (!isValidObjectId(serviceId)) {
                    res.status(400).json({ success: false, message: "Invalid serviceId" });
                    return;
                }
                const serviceExists = yield Service_1.ServiceModel.findById(serviceId).lean();
                if (!serviceExists) {
                    res.status(404).json({ success: false, message: "Service not found" });
                    return;
                }
                record.serviceId = new mongoose_1.Types.ObjectId(serviceId);
            }
        }
        if (categoryId !== undefined) {
            if (categoryId === null || categoryId === "") {
                record.categoryId = undefined;
            }
            else {
                if (!isValidObjectId(categoryId)) {
                    res.status(400).json({ success: false, message: "Invalid categoryId" });
                    return;
                }
                const categoryExists = yield ServiceCategoryModel_1.ServiceCategoryModel.findById(categoryId).lean();
                if (!categoryExists) {
                    res.status(404).json({ success: false, message: "Service category not found" });
                    return;
                }
                record.categoryId = new mongoose_1.Types.ObjectId(categoryId);
            }
        }
        if (specialMenuId !== undefined) {
            if (specialMenuId === null || specialMenuId === "") {
                record.specialMenuId = undefined;
            }
            else {
                if (!isValidObjectId(specialMenuId)) {
                    res.status(400).json({ success: false, message: "Invalid specialMenuId" });
                    return;
                }
                const specialMenuExists = yield SpecialMenu_1.SpecialMenu.findById(specialMenuId).lean();
                if (!specialMenuExists) {
                    res.status(404).json({ success: false, message: "Special menu not found" });
                    return;
                }
                record.specialMenuId = new mongoose_1.Types.ObjectId(specialMenuId);
            }
        }
        if (!hasAnyTarget(record.serviceId, record.categoryId, record.specialMenuId)) {
            res
                .status(400)
                .json({ success: false, message: "One of serviceId, categoryId, or specialMenuId must be provided" });
            return;
        }
        yield record.save();
        res.status(200).json({ success: true, payload: record });
    }
    catch (error) {
        console.error("Error updating TermsAndCon:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});
exports.updateTermsAndCon = updateTermsAndCon;
const deleteTermsAndCon = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            res.status(400).json({ success: false, message: "Invalid TermsAndCon id" });
            return;
        }
        const deleted = yield TermsAndCon_1.TermsAndConModel.findByIdAndDelete(id);
        if (!deleted) {
            res.status(404).json({ success: false, message: "TermsAndCon not found" });
            return;
        }
        res.status(200).json({ success: true, message: "TermsAndCon deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting TermsAndCon:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});
exports.deleteTermsAndCon = deleteTermsAndCon;
