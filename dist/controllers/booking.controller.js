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
exports.deleteBooking = exports.updateBooking = exports.getBooking = exports.getBookings = exports.createBooking = void 0;
const Booking_1 = require("../models/Booking"); // Path to your Booking model
const User_model_1 = __importDefault(require("../models/User.model"));
const Chef_1 = __importDefault(require("../models/Chef"));
const axios_1 = __importDefault(require("axios"));
const checkChefAvailability_1 = require("../utils/checkChefAvailability");
const Procurement_1 = __importDefault(require("../models/Procurement"));
const Notification_1 = __importDefault(require("../models/Notification"));
const createBooking = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { clientId, clientNote, numberOfPeople, chefId, serviceId, categoryId, subCategoryId, specialMenuId, startDate, endDate, bookingFeeAmount, totalAmount, paymentChannel, paymentReference } = req.body;
        console.log({ frontSent: req.body });
        if (!clientId || !startDate || !endDate || !paymentReference) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }
        if (!serviceId && !specialMenuId) {
            return res.status(400).json({ success: false, message: "Either Service ID or Special Menu ID is required" });
        }
        /* Determine booking type */
        let bookingType;
        if (specialMenuId)
            bookingType = "special-menu";
        else if (chefId && serviceId)
            bookingType = "chef";
        else
            return res.status(400).json({ success: false, message: "Invalid booking payload" });
        if (bookingType === "chef") {
            const available = yield (0, checkChefAvailability_1.isChefAvailable)(chefId, new Date(startDate), new Date(endDate));
            if (!available)
                return res.status(409).json({ success: false, message: "Chef already booked for this time range" });
        }
        /* Prevent duplicate booking from same payment */
        const existingPayment = yield Booking_1.Booking.findOne({ paymentReference });
        if (existingPayment)
            return res.status(409).json({ success: false, message: "Booking already created for this payment" });
        /* If payment channel is paystack, verify payment */
        if (paymentChannel === "paystack") {
            const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
            if (!PAYSTACK_SECRET_KEY)
                throw new Error("Paystack secret key not configured");
            const verifyUrl = `https://api.paystack.co/transaction/verify/${paymentReference}`;
            const response = yield axios_1.default.get(verifyUrl, { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } });
            if (!response.data || !response.data.data || response.data.data.status !== "success") {
                return res.status(400).json({ success: false, message: "Payment verification failed" });
            }
        }
        /* Chef availability protection */
        if (bookingType === "chef") {
            const conflict = yield Booking_1.Booking.findOne({
                chefId,
                status: { $in: ["confirmed", "ongoing"] },
                startDate: { $lt: new Date(endDate) },
                endDate: { $gt: new Date(startDate) }
            });
            if (conflict)
                return res.status(409).json({ success: false, message: "Chef already booked for this time range" });
        }
        /* Create booking */
        const booking = yield Booking_1.Booking.create({
            bookingType,
            clientId,
            clientNote,
            numberOfPeople,
            chefId,
            serviceId,
            categoryId,
            subCategoryId,
            specialMenuId,
            startDate,
            endDate,
            bookingFeePaid: true,
            bookingFeeAmount,
            // procurement is now handled by Procurement model (linked via booking.procurementId)
            totalAmount: totalAmount || bookingFeeAmount,
            paymentChannel,
            paymentReference,
            status: "confirmed"
        });
        // If procurement items were provided, create Procurement and attach
        if (req.body.procurementItems && Array.isArray(req.body.procurementItems) && req.body.procurementItems.length > 0) {
            const procurement = yield Procurement_1.default.create({ bookingId: booking._id, items: req.body.procurementItems });
            booking.procurementId = procurement._id;
            // if totalAmount was not provided, add procurement total
            if (!totalAmount) {
                booking.totalAmount = (booking.totalAmount || 0) + (procurement.totalCost || 0);
            }
            yield booking.save();
        }
        // Notify chef that a booking was created (if chef assigned)
        try {
            if (booking.chefId) {
                yield Notification_1.default.create({
                    userId: booking.chefId,
                    type: 'booking-confirmation',
                    title: 'New booking received',
                    message: `You have a new booking (${booking._id}) scheduled from ${booking.startDate} to ${booking.endDate}`,
                });
            }
        }
        catch (err) {
            console.error('Failed to create notification for chef on booking creation', err);
        }
        return res.status(201).json({ success: true, message: "Booking created successfully", data: booking });
    }
    catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: "Chef already booked for this time slot" });
        }
        console.log({ seeError: error });
        return res.status(500).json({ success: false, message: "Failed to create booking", error: error.message });
    }
});
exports.createBooking = createBooking;
// Note: Considered adding a dedicated notification sender
// Send notification to chef when a booking is created (inside createBooking above)
/**
 * GET ALL BOOKINGS
 * Filters + Pagination
 */
const getBookings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = 1, limit = 10, clientId, chefId, status, startDate, endDate, paymentReference } = req.query;
        const { searchByUserName, searchByChefName } = req.query;
        const query = {};
        if (clientId)
            query.clientId = clientId;
        if (chefId)
            query.chefId = chefId;
        // support searching by user name (partial match)
        if (searchByUserName) {
            const regex = new RegExp(String(searchByUserName), 'i');
            const users = yield User_model_1.default.find({
                $or: [
                    { fullName: { $regex: regex } },
                    { firstName: { $regex: regex } },
                    { email: { $regex: regex } }
                ]
            }).select('_id');
            const ids = users.map(u => u._id);
            if (ids.length > 0)
                query.clientId = { $in: ids };
            else
                query.clientId = { $in: [] }; // no matches -> empty result
        }
        // support searching by chef name (partial match)
        if (searchByChefName) {
            const regex = new RegExp(String(searchByChefName), 'i');
            const chefs = yield Chef_1.default.find({ name: { $regex: regex } }).select('_id');
            const chefIds = chefs.map(c => c._id);
            if (chefIds.length > 0)
                query.chefId = { $in: chefIds };
            else
                query.chefId = { $in: [] };
        }
        if (status)
            query.status = status;
        if (paymentReference)
            query.paymentReference = paymentReference;
        /* DATE RANGE FILTER */
        if (startDate || endDate) {
            query.startDate = {};
            if (startDate)
                query.startDate.$gte = new Date(startDate);
            if (endDate)
                query.startDate.$lte = new Date(endDate);
        }
        const skip = (Number(page) - 1) * Number(limit);
        const bookings = yield Booking_1.Booking
            .find(query)
            .populate("clientId")
            .populate("chefId")
            .populate("procurementId")
            .populate("serviceId")
            .populate("specialMenuId")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));
        const total = yield Booking_1.Booking.countDocuments(query);
        return res.json({
            success: true,
            payload: bookings,
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / Number(limit)),
                limit: Number(limit)
            }
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching bookings",
            error
        });
    }
});
exports.getBookings = getBookings;
/**
 * GET SINGLE BOOKING
 */
const getBooking = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const booking = yield Booking_1.Booking
            .findById(req.params.id)
            .populate("clientId")
            .populate("chefId")
            .populate("serviceId")
            .populate("specialMenuId")
            .populate("procurementId");
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }
        return res.json({
            success: true,
            payload: booking
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching booking",
            error
        });
    }
});
exports.getBooking = getBooking;
/**
 * UPDATE BOOKING
 */
const updateBooking = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const booking = yield Booking_1.Booking.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }
        return res.json({
            success: true,
            message: "Booking updated successfully",
            payload: booking
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error updating booking",
            error
        });
    }
});
exports.updateBooking = updateBooking;
/**
 * DELETE BOOKING
 */
const deleteBooking = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const booking = yield Booking_1.Booking.findByIdAndDelete(req.params.id);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }
        return res.json({
            success: true,
            message: "Booking deleted successfully"
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error deleting booking",
            error
        });
    }
});
exports.deleteBooking = deleteBooking;
