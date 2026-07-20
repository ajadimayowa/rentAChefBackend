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
exports.deleteAssignedBookingNumber = exports.updateAssignedBookingNumber = exports.getAssignedBookingNumber = exports.getAssignedBookingNumbers = exports.createAssignedBookingNumber = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const AssignedBookingNumber_1 = require("../models/AssignedBookingNumber");
const isValidObjectId = (id) => mongoose_1.default.Types.ObjectId.isValid(id);
const buildValidationError = (message, res) => {
    return res.status(400).json({
        success: false,
        message,
    });
};
const createAssignedBookingNumber = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { serviceId, customerId, bookingId } = req.body;
        if (!serviceId || !customerId) {
            return buildValidationError("serviceId and customerId are required", res);
        }
        if (!isValidObjectId(String(serviceId)) || !isValidObjectId(String(customerId))) {
            return buildValidationError("Invalid serviceId or customerId", res);
        }
        if (bookingId && !isValidObjectId(String(bookingId))) {
            return buildValidationError("Invalid bookingId", res);
        }
        for (let attempt = 0; attempt < 3; attempt += 1) {
            const lastAssigned = yield AssignedBookingNumber_1.AssignedBookingNumberModel
                .findOne({ serviceId })
                .sort({ assignedNumber: -1 })
                .select("assignedNumber")
                .lean();
            const nextNumber = ((lastAssigned === null || lastAssigned === void 0 ? void 0 : lastAssigned.assignedNumber) || 0) + 1;
            try {
                const assigned = yield AssignedBookingNumber_1.AssignedBookingNumberModel.create({
                    assignedNumber: nextNumber,
                    serviceId,
                    customerId,
                    bookingId: bookingId || undefined,
                });
                return res.status(201).json({
                    success: true,
                    data: assigned,
                });
            }
            catch (createError) {
                if ((createError === null || createError === void 0 ? void 0 : createError.code) === 11000 && attempt < 2) {
                    continue;
                }
                throw createError;
            }
        }
        return res.status(500).json({
            success: false,
            message: "Unable to assign booking number. Please retry.",
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error creating assigned booking number",
            error: error === null || error === void 0 ? void 0 : error.message,
        });
    }
});
exports.createAssignedBookingNumber = createAssignedBookingNumber;
const getAssignedBookingNumbers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { serviceId, customerId, bookingId, page = "1", limit = "10" } = req.query;
        const query = {};
        if (serviceId) {
            if (!isValidObjectId(String(serviceId))) {
                return buildValidationError("Invalid serviceId", res);
            }
            query.serviceId = serviceId;
        }
        if (customerId) {
            if (!isValidObjectId(String(customerId))) {
                return buildValidationError("Invalid customerId", res);
            }
            query.customerId = customerId;
        }
        if (bookingId) {
            if (!isValidObjectId(String(bookingId))) {
                return buildValidationError("Invalid bookingId", res);
            }
            query.bookingId = bookingId;
        }
        const pageNumber = Math.max(Number(page) || 1, 1);
        const limitNumber = Math.max(Number(limit) || 10, 1);
        const skip = (pageNumber - 1) * limitNumber;
        const [data, total] = yield Promise.all([
            AssignedBookingNumber_1.AssignedBookingNumberModel.find(query)
                .sort({ serviceId: 1, assignedNumber: -1 })
                .skip(skip)
                .limit(limitNumber),
            AssignedBookingNumber_1.AssignedBookingNumberModel.countDocuments(query),
        ]);
        return res.status(200).json({
            success: true,
            count: data.length,
            total,
            page: pageNumber,
            totalPages: Math.ceil(total / limitNumber),
            limit: limitNumber,
            data,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching assigned booking numbers",
            error: error === null || error === void 0 ? void 0 : error.message,
        });
    }
});
exports.getAssignedBookingNumbers = getAssignedBookingNumbers;
const getAssignedBookingNumber = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return buildValidationError("Invalid assigned booking number id", res);
        }
        const data = yield AssignedBookingNumber_1.AssignedBookingNumberModel.findById(id);
        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Assigned booking number not found",
            });
        }
        return res.status(200).json({
            success: true,
            data,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching assigned booking number",
            error: error === null || error === void 0 ? void 0 : error.message,
        });
    }
});
exports.getAssignedBookingNumber = getAssignedBookingNumber;
const updateAssignedBookingNumber = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { serviceId, customerId, bookingId } = req.body;
        if (!isValidObjectId(id)) {
            return buildValidationError("Invalid assigned booking number id", res);
        }
        const record = yield AssignedBookingNumber_1.AssignedBookingNumberModel.findById(id);
        if (!record) {
            return res.status(404).json({
                success: false,
                message: "Assigned booking number not found",
            });
        }
        if (serviceId != null) {
            if (!isValidObjectId(String(serviceId))) {
                return buildValidationError("Invalid serviceId", res);
            }
            record.serviceId = serviceId;
        }
        if (customerId != null) {
            if (!isValidObjectId(String(customerId))) {
                return buildValidationError("Invalid customerId", res);
            }
            record.customerId = customerId;
        }
        if (bookingId !== undefined) {
            if (bookingId !== null && String(bookingId).trim() !== "" && !isValidObjectId(String(bookingId))) {
                return buildValidationError("Invalid bookingId", res);
            }
            record.bookingId = bookingId ? new mongoose_1.default.Types.ObjectId(String(bookingId)) : undefined;
        }
        yield record.save();
        return res.status(200).json({
            success: true,
            message: "Assigned booking number updated successfully",
            data: record,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error updating assigned booking number",
            error: error === null || error === void 0 ? void 0 : error.message,
        });
    }
});
exports.updateAssignedBookingNumber = updateAssignedBookingNumber;
const deleteAssignedBookingNumber = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return buildValidationError("Invalid assigned booking number id", res);
        }
        const deleted = yield AssignedBookingNumber_1.AssignedBookingNumberModel.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Assigned booking number not found",
            });
        }
        return res.status(200).json({
            success: true,
            message: "Assigned booking number deleted successfully",
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error deleting assigned booking number",
            error: error === null || error === void 0 ? void 0 : error.message,
        });
    }
});
exports.deleteAssignedBookingNumber = deleteAssignedBookingNumber;
