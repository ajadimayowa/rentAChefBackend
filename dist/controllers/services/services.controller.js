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
exports.deleteOption = exports.updateOptions = exports.updateOption = exports.addOption = exports.deleteServicePlan = exports.updateServicePlan = exports.addServicePlan = exports.deleteService = exports.updateService = exports.getServiceById = exports.getServices = exports.createService = void 0;
const Service_model_1 = require("../../models/Service.model");
/* ===================== SERVICE CRUD ===================== */
// CREATE SERVICE
const createService = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const service = yield Service_model_1.Service.create(req.body);
    res.status(201).json({ success: true, data: service });
});
exports.createService = createService;
// GET ALL SERVICES
const getServices = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const services = yield Service_model_1.Service.find().populate("category", "name");
    res.json({ success: true, payload: services });
});
exports.getServices = getServices;
// GET SINGLE SERVICE
const getServiceById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const service = yield Service_model_1.Service.findById(req.params.id);
    if (!service)
        return res.status(404).json({ message: "Not found" });
    res.json({ success: true, data: service });
});
exports.getServiceById = getServiceById;
// UPDATE SERVICE
const updateService = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const service = yield Service_model_1.Service.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });
    res.json({ success: true, data: service });
});
exports.updateService = updateService;
// DELETE SERVICE
const deleteService = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield Service_model_1.Service.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Deleted" });
});
exports.deleteService = deleteService;
/* ===================== SERVICE PLAN CRUD ===================== */
// ADD SERVICE PLAN
const addServicePlan = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { services } = req.body;
        if (!services || !Array.isArray(services) || services.length === 0) {
            return res.status(400).json({
                success: false,
                message: "services must be a non-empty array",
            });
        }
        const service = yield Service_model_1.Service.findByIdAndUpdate(req.params.serviceId, {
            $push: {
                services: { $each: services },
            },
        }, {
            new: true,
            runValidators: true,
        });
        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Service not found",
            });
        }
        return res.status(200).json({
            success: true,
            data: service,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to add service plan",
        });
    }
});
exports.addServicePlan = addServicePlan;
// UPDATE SERVICE PLAN
const updateServicePlan = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { serviceId, planId } = req.params;
    const service = yield Service_model_1.Service.findOneAndUpdate({ _id: serviceId, "services._id": planId }, { $set: { "services.$": req.body } }, { new: true, runValidators: true });
    res.json({ success: true, data: service });
});
exports.updateServicePlan = updateServicePlan;
// DELETE SERVICE PLAN
const deleteServicePlan = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const service = yield Service_model_1.Service.findByIdAndUpdate(req.params.serviceId, { $pull: { services: { _id: req.params.planId } } }, { new: true });
    res.json({ success: true, data: service });
});
exports.deleteServicePlan = deleteServicePlan;
/* ===================== OPTIONS CRUD ===================== */
// ADD OPTION
const addOption = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { serviceId, planId } = req.params;
        const { options } = req.body;
        if (!options || !Array.isArray(options) || options.length === 0) {
            return res.status(400).json({
                success: false,
                message: "options must be a non-empty array",
            });
        }
        const service = yield Service_model_1.Service.findOneAndUpdate({ _id: serviceId, "services._id": planId }, {
            $push: {
                "services.$.options": { $each: options },
            },
        }, {
            new: true,
            runValidators: true,
        });
        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Service or service plan not found",
            });
        }
        return res.status(200).json({
            success: true,
            data: service,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to add options",
        });
    }
});
exports.addOption = addOption;
// UPDATE OPTION
const updateOption = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { serviceId, planId, optionId } = req.params;
    const service = yield Service_model_1.Service.findOneAndUpdate({
        _id: serviceId,
        "services._id": planId,
        "services.options._id": optionId,
    }, {
        $set: {
            "services.$[s].options.$[o]": req.body,
        },
    }, {
        arrayFilters: [
            { "s._id": planId },
            { "o._id": optionId },
        ],
        new: true,
        runValidators: true,
    });
    res.json({ success: true, data: service });
});
exports.updateOption = updateOption;
const updateOptions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { serviceId, planId } = req.params;
        const { options } = req.body;
        if (!Array.isArray(options)) {
            return res.status(400).json({
                success: false,
                message: "options must be an array",
            });
        }
        const service = yield Service_model_1.Service.findOneAndUpdate({ _id: serviceId, "services._id": planId }, {
            $set: {
                "services.$.options": options, // 🔥 overwrite instead of push
            },
        }, { new: true, runValidators: true });
        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Service plan not found",
            });
        }
        res.json({ success: true, data: service });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.updateOptions = updateOptions;
// DELETE OPTION
const deleteOption = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { serviceId, planId, optionId } = req.params;
    const service = yield Service_model_1.Service.findOneAndUpdate({ _id: serviceId, "services._id": planId }, { $pull: { "services.$.options": { _id: optionId } } }, { new: true });
    res.json({ success: true, data: service });
});
exports.deleteOption = deleteOption;
