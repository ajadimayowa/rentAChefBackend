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
exports.deleteProcurement = exports.markProcurementPaid = exports.updateProcurement = exports.getProcurement = exports.getProcurements = exports.createProcurement = void 0;
const Procurement_1 = __importDefault(require("../models/Procurement"));
const axios_1 = __importDefault(require("axios"));
const Booking_1 = require("../models/Booking");
const createProcurement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { bookingId, items, isProcurementPaid, paymentChannel, paymentReference } = req.body;
        if (!bookingId || !Array.isArray(items)) {
            return res.status(400).json({ success: false, message: 'bookingId and items are required' });
        }
        // ensure booking exists
        const booking = yield Booking_1.Booking.findById(bookingId);
        if (!booking)
            return res.status(404).json({ success: false, message: 'Booking not found' });
        const createPayload = { bookingId, items };
        if (typeof isProcurementPaid === 'boolean')
            createPayload.isProcurementPaid = isProcurementPaid;
        if (paymentChannel)
            createPayload.paymentChannel = paymentChannel;
        if (paymentReference)
            createPayload.paymentReference = paymentReference;
        const procurement = yield Procurement_1.default.create(createPayload);
        // attach procurement to booking
        booking.procurementId = procurement._id;
        yield booking.save();
        return res.status(201).json({ success: true, payload: procurement });
    }
    catch (error) {
        console.error('createProcurement error', error);
        return res.status(500).json({ success: false, message: 'Failed to create procurement', error: error.message });
    }
});
exports.createProcurement = createProcurement;
const getProcurements = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { bookingId } = req.query;
        const query = {};
        if (bookingId)
            query.bookingId = bookingId;
        const items = yield Procurement_1.default.find(query).sort({ createdAt: -1 });
        return res.json({ success: true, payload: items });
    }
    catch (error) {
        console.error('getProcurements error', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch procurements', error: error.message });
    }
});
exports.getProcurements = getProcurements;
const getProcurement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const item = yield Procurement_1.default.findById(req.params.id);
        if (!item)
            return res.status(404).json({ success: false, message: 'Procurement not found' });
        return res.json({ success: true, payload: item });
    }
    catch (error) {
        console.error('getProcurement error', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch procurement', error: error.message });
    }
});
exports.getProcurement = getProcurement;
const updateProcurement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { items, isProcurementPaid, paymentChannel, paymentReference } = req.body;
        const procurement = yield Procurement_1.default.findById(req.params.id);
        if (!procurement)
            return res.status(404).json({ success: false, message: 'Procurement not found' });
        if (items)
            procurement.items = items;
        if (typeof isProcurementPaid === 'boolean')
            procurement.isProcurementPaid = isProcurementPaid;
        if (paymentChannel)
            procurement.paymentChannel = paymentChannel;
        if (paymentReference)
            procurement.paymentReference = paymentReference;
        yield procurement.save(); // pre-save will recalc totalCost
        return res.json({ success: true, message: 'Procurement updated', payload: procurement });
    }
    catch (error) {
        console.error('updateProcurement error', error);
        return res.status(500).json({ success: false, message: 'Failed to update procurement', error: error.message });
    }
});
exports.updateProcurement = updateProcurement;
const markProcurementPaid = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { paymentChannel, paymentReference } = req.body;
        if (!paymentChannel || !paymentReference) {
            return res.status(400).json({ success: false, message: 'paymentChannel and paymentReference are required' });
        }
        const procurement = yield Procurement_1.default.findById(req.params.id);
        if (!procurement)
            return res.status(404).json({ success: false, message: 'Procurement not found' });
        // If channel is transfer, only admins should be allowed to mark paid.
        const requester = req.user;
        if (paymentChannel === 'transfer') {
            if (!requester || !requester.isAdmin) {
                return res.status(403).json({ success: false, message: 'Only admins can mark transfer payments as paid' });
            }
            procurement.isProcurementPaid = true;
            procurement.paymentChannel = paymentChannel;
            procurement.paymentReference = paymentReference;
            yield procurement.save();
            return res.json({ success: true, message: 'Procurement marked as paid (transfer)', payload: procurement });
        }
        // For paystack, verify the transaction with Paystack API before marking paid
        if (paymentChannel === 'paystack') {
            const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
            if (!PAYSTACK_SECRET_KEY) {
                return res.status(500).json({ success: false, message: 'Paystack secret key not configured' });
            }
            try {
                const verifyUrl = `https://api.paystack.co/transaction/verify/${paymentReference}`;
                const response = yield axios_1.default.get(verifyUrl, {
                    headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` }
                });
                const data = response.data && response.data.data;
                if (!data || data.status !== 'success') {
                    return res.status(400).json({ success: false, message: 'Paystack verification failed' });
                }
                // Optionally check amount: Paystack returns amount in kobo (NGN) or smallest currency unit
                const paidAmount = Number(data.amount) / 100; // convert kobo to Naira
                // If procurement.totalCost is set, ensure paid amount >= totalCost
                if (typeof procurement.totalCost === 'number' && paidAmount < procurement.totalCost) {
                    // still save payment info but indicate mismatch
                    procurement.paymentChannel = paymentChannel;
                    procurement.paymentReference = paymentReference;
                    yield procurement.save();
                    return res.status(400).json({ success: false, message: 'Payment amount is less than procurement total' });
                }
                // Mark as paid
                procurement.isProcurementPaid = true;
                procurement.paymentChannel = paymentChannel;
                procurement.paymentReference = paymentReference;
                yield procurement.save();
                return res.json({ success: true, message: 'Procurement marked as paid (paystack)', payload: procurement });
            }
            catch (err) {
                console.error('Paystack verification error', ((_a = err === null || err === void 0 ? void 0 : err.response) === null || _a === void 0 ? void 0 : _a.data) || err.message || err);
                return res.status(500).json({ success: false, message: 'Error verifying Paystack payment' });
            }
        }
        return res.status(400).json({ success: false, message: 'Unsupported payment channel' });
    }
    catch (error) {
        console.error('markProcurementPaid error', error);
        return res.status(500).json({ success: false, message: 'Failed to mark procurement as paid', error: error.message });
    }
});
exports.markProcurementPaid = markProcurementPaid;
const deleteProcurement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const procurement = yield Procurement_1.default.findByIdAndDelete(req.params.id);
        if (!procurement)
            return res.status(404).json({ success: false, message: 'Procurement not found' });
        // unlink from booking if attached
        try {
            const booking = yield Booking_1.Booking.findById(procurement.bookingId);
            if (booking && String(booking.procurementId) === String(procurement._id)) {
                booking.procurementId = undefined;
                yield booking.save();
            }
        }
        catch (err) {
            // ignore
        }
        return res.json({ success: true, message: 'Procurement deleted' });
    }
    catch (error) {
        console.error('deleteProcurement error', error);
        return res.status(500).json({ success: false, message: 'Failed to delete procurement', error: error.message });
    }
});
exports.deleteProcurement = deleteProcurement;
