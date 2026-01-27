import { Router } from "express";
import {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
} from "../controllers/booking.controller";

const router = Router();

router.post("/", createBooking);          // Create booking
router.get("/", getAllBookings);           // Get all bookings
router.get("/:id", getBookingById);        // Get booking by ID
router.put("/:id", updateBooking);         // Update booking
router.delete("/:id", deleteBooking);      // Delete booking

export default router;
