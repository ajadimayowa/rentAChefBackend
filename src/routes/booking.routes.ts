import { Router } from "express";
import {
  createBooking,
  getBookings,
  getBooking,
  updateBooking,
  deleteBooking
} from "../controllers/booking.controller";
import { verifyUserToken } from "../middleware/auth.middleware";

const router = Router();

router.post("/booking/create",verifyUserToken, createBooking);

/* GET ALL BOOKINGS */
router.get("/bookings", getBookings);

/* GET SINGLE BOOKING */
router.get("/booking/:id", getBooking);

/* UPDATE BOOKING */
router.put("/booking/:id", updateBooking);

/* DELETE BOOKING */
router.delete("/booking/:id", deleteBooking);

export default router;
