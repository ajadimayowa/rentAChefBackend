"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const booking_controller_1 = require("../controllers/booking.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.post("/booking/create", auth_middleware_1.verifyUserToken, booking_controller_1.createBooking);
/* GET ALL BOOKINGS */
router.get("/bookings", booking_controller_1.getBookings);
/* GET SINGLE BOOKING */
router.get("/booking/:id", booking_controller_1.getBooking);
/* UPDATE BOOKING */
router.put("/booking/:id", booking_controller_1.updateBooking);
/* DELETE BOOKING */
router.delete("/booking/:id", booking_controller_1.deleteBooking);
exports.default = router;
