"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const booking_controller_1 = require("../controllers/booking.controller");
const router = (0, express_1.Router)();
router.post("/", booking_controller_1.createBooking); // Create booking
router.get("/", booking_controller_1.getAllBookings); // Get all bookings
router.get("/:id", booking_controller_1.getBookingById); // Get booking by ID
router.put("/:id", booking_controller_1.updateBooking); // Update booking
router.delete("/:id", booking_controller_1.deleteBooking); // Delete booking
exports.default = router;
