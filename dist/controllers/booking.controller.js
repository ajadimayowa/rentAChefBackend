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
exports.deleteBooking = exports.updateBooking = exports.getBookingById = exports.getAllBookings = exports.createBooking = void 0;
const Booking_1 = require("../models/Booking");
/* ---------------- CREATE BOOKING ---------------- */
const createBooking = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const booking = yield Booking_1.Booking.create(req.body);
        res.status(201).json({
            success: true,
            data: booking,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
});
exports.createBooking = createBooking;
/* ---------------- GET ALL BOOKINGS ---------------- */
const getAllBookings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const bookings = yield Booking_1.Booking.find()
            .populate("clientId", "name email")
            .populate("chefId", "name")
            .populate("categoryId", "title")
            .populate("subCategoryId", "title")
            .populate("specialMenuId", "title")
            .sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
exports.getAllBookings = getAllBookings;
/* ---------------- GET SINGLE BOOKING ---------------- */
const getBookingById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const booking = yield Booking_1.Booking.findById(req.params.id)
            .populate("clientId", "name email")
            .populate("chefId", "name")
            .populate("categoryId", "title")
            .populate("subCategoryId", "title")
            .populate("specialMenuId", "title");
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }
        res.status(200).json({
            success: true,
            data: booking,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
});
exports.getBookingById = getBookingById;
/* ---------------- UPDATE BOOKING ---------------- */
const updateBooking = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const booking = yield Booking_1.Booking.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }
        res.status(200).json({
            success: true,
            data: booking,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
});
exports.updateBooking = updateBooking;
/* ---------------- DELETE BOOKING ---------------- */
const deleteBooking = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const booking = yield Booking_1.Booking.findByIdAndDelete(req.params.id);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }
        res.status(200).json({
            success: true,
            message: "Booking deleted successfully",
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
});
exports.deleteBooking = deleteBooking;
