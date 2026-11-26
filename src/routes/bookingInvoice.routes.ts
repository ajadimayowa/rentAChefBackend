import { NextFunction, Request, Response, Router } from "express";
import multer from "multer";
import { requireAdminAuth } from "../middleware/auth/adminAuth.middleware";
import { MAX_UPLOAD_LABEL, uploadInvoicePdf } from "../middleware/upload";
import { createBookingInvoice, deleteBookingInvoice, payBookingInvoice } from "../controllers/invoice/bookingInvoice.controller";
import { requireAuth } from "../middleware/auth/requireAuth.middleware";

const invoicePdfUpload = (req: Request, res: Response, next: NextFunction) =>
  uploadInvoicePdf.single("invoicePdf")(req, res, (err: any) => {
    if (!err) return next();
    const message =
      err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE"
        ? `The PDF must be ${MAX_UPLOAD_LABEL} or smaller`
        : err.message || "Could not upload the invoice";
    return res.status(400).json({ success: false, message });
  });

const router = Router();

// Admins attach invoice PDFs (with an amount) to bookings; customers see them on the booking.
router.post("/invoice/create", requireAdminAuth, invoicePdfUpload, createBookingInvoice);
router.delete("/invoice/:id", requireAdminAuth, deleteBookingInvoice);
// The booking's customer pays an invoice with a Paystack reference.
router.post("/invoices/:id/pay", requireAuth(["Customer"]), payBookingInvoice);

export default router;
