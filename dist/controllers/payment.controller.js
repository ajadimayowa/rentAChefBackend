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
exports.deleteBooking = exports.updateBooking = exports.getBookingById = exports.getBookings = exports.verifyPayment = exports.initializePayment = void 0;
const Booking_1 = require("../models/Booking"); // Path to your Booking model
const axios_1 = __importDefault(require("axios"));
// Create a new booking
const initializePayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { email, amount, callback_url } = req.body;
    try {
        const response = yield axios_1.default.post("https://api.paystack.co/transaction/initialize", {
            email,
            amount: amount * 100, // Paystack uses kobo
            callback_url
        }, {
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                "Content-Type": "application/json",
            },
        });
        res.json(response.data);
    }
    catch (error) {
        res.status(500).json({ error: (_a = error.response) === null || _a === void 0 ? void 0 : _a.data });
    }
});
exports.initializePayment = initializePayment;
const verifyPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { reference } = req.params;
    try {
        const response = yield axios_1.default.get(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
            }
        });
        res.json(response.data);
    }
    catch (error) {
        res.status(500).json({ error: "Verification failed" });
    }
});
exports.verifyPayment = verifyPayment;
// Get all bookings
const getBookings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const bookings = yield Booking_1.Booking.find().populate("clientId chefId serviceId categoryId subCategoryId specialMenuId");
        return res.status(200).json({
            success: true,
            data: bookings,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch bookings",
            error: error.message,
        });
    }
});
exports.getBookings = getBookings;
// Get a single booking by ID
const getBookingById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const booking = yield Booking_1.Booking.findById(req.params.id).populate("clientId chefId serviceId categoryId subCategoryId specialMenuId");
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }
        return res.status(200).json({
            success: true,
            data: booking,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch booking",
            error: error.message,
        });
    }
});
exports.getBookingById = getBookingById;
// Update a booking by ID
const updateBooking = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { clientId, chefId, serviceId, categoryId, subCategoryId, specialMenuId, dates, bookingFeePaid, procurementPaid, bookingFeeAmount, procurementAmount, totalAmount, status, cancellationReason, } = req.body;
        const updatedBooking = yield Booking_1.Booking.findByIdAndUpdate(req.params.id, {
            clientId,
            chefId,
            serviceId,
            categoryId,
            subCategoryId,
            specialMenuId,
            dates,
            bookingFeePaid,
            procurementPaid,
            bookingFeeAmount,
            procurementAmount,
            totalAmount,
            status,
            cancellationReason,
        }, { new: true }).populate("clientId chefId serviceId categoryId subCategoryId specialMenuId");
        if (!updatedBooking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }
        return res.status(200).json({
            success: true,
            message: "Booking updated successfully",
            data: updatedBooking,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to update booking",
            error: error.message,
        });
    }
});
exports.updateBooking = updateBooking;
// Delete a booking by ID
const deleteBooking = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const deletedBooking = yield Booking_1.Booking.findByIdAndDelete(req.params.id);
        if (!deletedBooking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }
        return res.status(200).json({
            success: true,
            message: "Booking deleted successfully",
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to delete booking",
            error: error.message,
        });
    }
});
exports.deleteBooking = deleteBooking;
