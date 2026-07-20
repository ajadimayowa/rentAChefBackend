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
exports.registerUploadedMenu = exports.createChefMenu = exports.assignChef = exports.confirmPaymentWebhook = exports.initializeQuotationPayment = exports.initializeInstantPayment = exports.generateQuotation = exports.listBookings = exports.createBooking = exports.getWorkflowDefinitions = void 0;
const axios_1 = __importDefault(require("axios"));
const bootstrap_1 = require("../platform/bootstrap");
const enums_1 = require("../platform/domain/enums");
const AssignedBookingNumber_1 = require("../models/AssignedBookingNumber");
const moduleRef = (0, bootstrap_1.buildChefPlatformModule)();
const getActorId = (req) => {
    var _a;
    const maybeUser = req.user;
    if (maybeUser === null || maybeUser === void 0 ? void 0 : maybeUser.id)
        return String(maybeUser.id);
    if ((_a = req.body) === null || _a === void 0 ? void 0 : _a.actorId)
        return String(req.body.actorId);
    return 'SYSTEM';
};
const normalizeOptionalId = (value) => {
    if (value === undefined || value === null)
        return undefined;
    const parsed = String(value).trim();
    if (!parsed || parsed.toLowerCase() === 'undefined' || parsed.toLowerCase() === 'null') {
        return undefined;
    }
    return parsed;
};
const isValidPaystackTransaction = (reference) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey)
        return false;
    try {
        const response = yield axios_1.default.get(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
            headers: {
                Authorization: `Bearer ${secretKey}`,
            },
        });
        return ((_a = response.data) === null || _a === void 0 ? void 0 : _a.status) === true && ((_c = (_b = response.data) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.status) === 'success';
    }
    catch (_d) {
        return false;
    }
});
const attachAssignedBookingNumberToBooking = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { assignedBookingNumberId, serviceId, customerId, bookingId } = params;
    if (assignedBookingNumberId) {
        const byId = yield AssignedBookingNumber_1.AssignedBookingNumberModel.findById(assignedBookingNumberId);
        if (byId) {
            byId.bookingId = bookingId;
            yield byId.save();
            return;
        }
    }
    if (!serviceId)
        return;
    const latestUnassigned = yield AssignedBookingNumber_1.AssignedBookingNumberModel.findOne({
        serviceId,
        customerId,
        bookingId: { $in: [null, undefined] },
    }).sort({ assignedNumber: -1, createdAt: -1 });
    if (!latestUnassigned)
        return;
    latestUnassigned.bookingId = bookingId;
    yield latestUnassigned.save();
});
const getWorkflowDefinitions = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.status(200).json({
        success: true,
        data: moduleRef.workflowRegistry.list().map((item) => ({
            code: item.code,
            displayName: item.displayName,
            screenName: item.screenName,
            supportsMenuSelection: item.supportsMenuSelection,
            supportsProcurement: item.supportsProcurement,
        })),
    });
});
exports.getWorkflowDefinitions = getWorkflowDefinitions;
const createBooking = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const actorId = getActorId(req);
        const serviceId = normalizeOptionalId(req.body.serviceId);
        const specialServiceId = normalizeOptionalId((_a = req.body.specialServiceId) !== null && _a !== void 0 ? _a : req.body.specialMenuId);
        const assignedBookingNumberId = normalizeOptionalId(req.body.assignedBookingNumberId);
        if (!serviceId && !specialServiceId) {
            res.status(400).json({
                success: false,
                message: 'Either serviceId or specialMenuId/specialServiceId is required',
            });
            return;
        }
        if (serviceId && specialServiceId) {
            res.status(400).json({
                success: false,
                message: 'Provide only one target: serviceId or specialMenuId/specialServiceId',
            });
            return;
        }
        const transactnRef = normalizeOptionalId(req.body.transactnRef);
        const hasTransactionRef = Boolean(transactnRef);
        const isVerifiedPayment = transactnRef ? yield isValidPaystackTransaction(transactnRef) : false;
        const booking = yield moduleRef.customerBookingService.createBooking({
            customerId: String(req.body.customerId),
            serviceId,
            specialServiceId,
            workflow: String(req.body.workflow),
            paymentStatus: isVerifiedPayment ? enums_1.PaymentStatus.PAID : enums_1.PaymentStatus.UNPAID,
            modeOfPayment: hasTransactionRef ? enums_1.ModeOfPayment.PAYSTACK : enums_1.ModeOfPayment.UNPAID,
            transactnRef,
            bookingData: req.body.bookingData || {},
        }, actorId);
        const bookingId = String((booking === null || booking === void 0 ? void 0 : booking.id) || (booking === null || booking === void 0 ? void 0 : booking._id) || '');
        if (bookingId) {
            yield attachAssignedBookingNumberToBooking({
                assignedBookingNumberId,
                serviceId,
                customerId: String(req.body.customerId),
                bookingId,
            });
        }
        res.status(201).json({ success: true, data: booking });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
exports.createBooking = createBooking;
const listBookings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const parsedPage = Number(req.query.page);
        const parsedLimit = Number(req.query.limit);
        const rows = yield moduleRef.customerBookingService.listBookings({
            customerId: req.query.customerId ? String(req.query.customerId) : undefined,
            workflow: req.query.workflow ? String(req.query.workflow) : undefined,
            status: req.query.status ? String(req.query.status) : undefined,
            paymentStatus: req.query.paymentStatus ? String(req.query.paymentStatus) : undefined,
            bookingNumber: normalizeOptionalId(req.query.bookingNumber),
            search: normalizeOptionalId(req.query.search),
            page: Number.isFinite(parsedPage) ? parsedPage : 1,
            limit: Number.isFinite(parsedLimit) ? parsedLimit : 10,
        });
        res.status(200).json({ success: true, data: rows.items, pagination: rows.pagination });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
exports.listBookings = listBookings;
const generateQuotation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const actorId = getActorId(req);
        const quotation = yield moduleRef.adminBookingService.generateQuotation({
            bookingId: String(req.body.bookingId),
            chefFeeMinor: Number(req.body.chefFeeMinor || 0),
            ingredientCostMinor: Number(req.body.ingredientCostMinor || 0),
            procurementFeeMinor: Number(req.body.procurementFeeMinor || 0),
            additionalChargesMinor: Number(req.body.additionalChargesMinor || 0),
            discountMinor: Number(req.body.discountMinor || 0),
            taxMinor: Number(req.body.taxMinor || 0),
            notes: req.body.notes,
            generatedBy: actorId,
        });
        res.status(201).json({ success: true, data: quotation });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
exports.generateQuotation = generateQuotation;
const initializeInstantPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield moduleRef.customerBookingService.initializeInstantPayment({
            bookingId: String(req.body.bookingId),
            customerId: String(req.body.customerId),
            customerEmail: String(req.body.customerEmail),
        });
        res.status(200).json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
exports.initializeInstantPayment = initializeInstantPayment;
const initializeQuotationPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield moduleRef.adminBookingService.initializeQuotationPayment({
            bookingId: String(req.body.bookingId),
            quotationId: String(req.body.quotationId),
            customerId: String(req.body.customerId),
            customerEmail: String(req.body.customerEmail),
        });
        res.status(200).json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
exports.initializeQuotationPayment = initializeQuotationPayment;
const confirmPaymentWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const payment = yield moduleRef.adminBookingService.confirmPayment(String(req.params.reference), req.body);
        res.status(200).json({ success: true, data: payment });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
exports.confirmPaymentWebhook = confirmPaymentWebhook;
const assignChef = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const actorId = getActorId(req);
        const result = yield moduleRef.adminBookingService.assignChef(String(req.params.bookingId), actorId);
        res.status(200).json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
exports.assignChef = assignChef;
const createChefMenu = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield moduleRef.menuService.createChefMenu({
            chefId: String(req.body.chefId),
            serviceSubCategoryId: String(req.body.serviceSubCategoryId),
            menuTitle: String(req.body.menuTitle),
            menuDescription: req.body.menuDescription,
            menuItems: Array.isArray(req.body.menuItems) ? req.body.menuItems : [],
            estimatedGuestCount: req.body.estimatedGuestCount,
        });
        res.status(201).json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
exports.createChefMenu = createChefMenu;
const registerUploadedMenu = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield moduleRef.menuService.registerUploadedMenu({
            ownerUserId: String(req.body.ownerUserId),
            fileName: String(req.body.fileName),
            mimeType: String(req.body.mimeType),
            extension: String(req.body.extension),
            fileUrl: String(req.body.fileUrl),
            sizeBytes: Number(req.body.sizeBytes),
        });
        res.status(201).json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
exports.registerUploadedMenu = registerUploadedMenu;
