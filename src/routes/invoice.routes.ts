import { Router } from "express";
import { requireAuth } from "../middleware/auth/requireAuth.middleware";
import { sendBookingInvoice } from "../controllers/invoice/invoice.controller";

const router = Router();

// Customer requests an invoice for the booking they're reviewing; it goes to their registered email.
router.post("/bookings/invoice", requireAuth(["Customer"]), sendBookingInvoice);

export default router;
