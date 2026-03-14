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
exports.deleteServicePricing = exports.updateServicePricing = exports.getServicePricingById = exports.getServicePricings = exports.createServicePricing = void 0;
const ServicePricing_1 = require("../../models/ServicePricing");
const mongoose_1 = __importDefault(require("mongoose"));
// CREATE a new ServicePricing
const createServicePricing = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { serviceId, chefCategoryId, price, currency } = req.body;
        if (!serviceId || !chefCategoryId || price === undefined) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }
        // Check if combination exists
        const exists = yield ServicePricing_1.ServicePricing.findOne({ serviceId, chefCategoryId });
        if (exists) {
            return res.status(409).json({ success: false, message: "Service pricing already exists for this category" });
        }
        const servicePricing = yield ServicePricing_1.ServicePricing.create({
            serviceId,
            chefCategoryId,
            price,
            currency: currency || "NGN",
        });
        res.status(201).json({ success: true, data: servicePricing });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});
exports.createServicePricing = createServicePricing;
// GET ALL ServicePricings (with optional filters)
const getServicePricings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { serviceId, chefCategoryId } = req.query;
        const filters = {};
        if (serviceId)
            filters.serviceId = serviceId;
        if (chefCategoryId)
            filters.chefCategoryId = chefCategoryId;
        const servicePricings = yield ServicePricing_1.ServicePricing.find(filters)
            .populate("serviceId", "name")
            .populate("chefCategoryId", "name");
        // optional: populate service title
        res.status(200).json({ success: true, data: servicePricings });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});
exports.getServicePricings = getServicePricings;
// GET ONE ServicePricing by ID
const getServicePricingById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid ID" });
        }
        const servicePricing = yield ServicePricing_1.ServicePricing.findById(id)
            .populate("serviceId", "title")
            .populate("chefCategoryId", "name");
        if (!servicePricing) {
            return res.status(404).json({ success: false, message: "ServicePricing not found" });
        }
        res.status(200).json({ success: true, data: servicePricing });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});
exports.getServicePricingById = getServicePricingById;
// UPDATE ServicePricing
const updateServicePricing = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { serviceId, chefCategoryId, price, currency } = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid ID" });
        }
        const servicePricing = yield ServicePricing_1.ServicePricing.findById(id);
        if (!servicePricing) {
            return res.status(404).json({ success: false, message: "ServicePricing not found" });
        }
        // Check for duplicate if serviceId or chefCategoryId changes
        if ((serviceId && serviceId != servicePricing.serviceId.toString()) ||
            (chefCategoryId && chefCategoryId != servicePricing.chefCategoryId.toString())) {
            const exists = yield ServicePricing_1.ServicePricing.findOne({
                serviceId: serviceId || servicePricing.serviceId,
                chefCategoryId: chefCategoryId || servicePricing.chefCategoryId,
            });
            if (exists) {
                return res.status(409).json({ success: false, message: "Service pricing already exists for this category" });
            }
        }
        servicePricing.serviceId = serviceId || servicePricing.serviceId;
        servicePricing.chefCategoryId = chefCategoryId || servicePricing.chefCategoryId;
        if (price !== undefined)
            servicePricing.price = price;
        if (currency)
            servicePricing.currency = currency;
        yield servicePricing.save();
        res.status(200).json({ success: true, data: servicePricing });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});
exports.updateServicePricing = updateServicePricing;
// DELETE ServicePricing
const deleteServicePricing = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid ID" });
        }
        const deleted = yield ServicePricing_1.ServicePricing.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: "ServicePricing not found" });
        }
        res.status(200).json({ success: true, message: "ServicePricing deleted successfully" });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});
exports.deleteServicePricing = deleteServicePricing;
