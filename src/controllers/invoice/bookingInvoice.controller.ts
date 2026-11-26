import { Request, Response } from "express";
import axios from "axios";
import { Types } from "mongoose";
import Procurement from "../../models/Procurement";
import { notifyAdmins } from "../../services/adminNotifications";
import { BookingStatus, PaymentStatus } from "../../platform/domain/enums";

/** Stages before payment — paying the invoice moves these bookings to "Paid". */
const AWAITING_PAYMENT_STATUSES: string[] = [
  BookingStatus.SUBMITTED,
  BookingStatus.ADMIN_REVIEW,
  BookingStatus.QUOTATION_SENT,
  BookingStatus.PAYMENT_PENDING,
];
import { InvoiceModel } from "../../models/Invoice";
import { BookingModel } from "../../models/Booking";
import User from "../../models/User.model";
import { notifyUser } from "../../services/userNotifications";
import { sendBookingNotificationEmail } from "../../services/email/rentAChef/bookingEmailNotifications";

const firstNameOf = (fullName?: string) => (fullName || "there").trim().split(" ")[0];
const formatNaira = (amount: number) =>
  `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

/**
 * POST /invoice/create (admin, multipart/form-data)
 *   bookingId  — the booking the invoice belongs to
 *   amount     — what the client must pay, in naira
 *   invoicePdf — the invoice document (PDF, uploaded to S3 by multer)
 * The client is notified (in-app + email) so they can view and download it.
 */
export const createBookingInvoice = async (req: Request, res: Response): Promise<any> => {
  try {
    const file = (req as any).file as { location?: string; originalname?: string } | undefined;
    const { bookingId } = req.body;
    const rawAmount = String(req.body.amount ?? "").trim();
    const amount = Number(rawAmount);

    if (!bookingId || !Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ success: false, message: "A valid bookingId is required" });
    }
    if (!file?.location) return res.status(400).json({ success: false, message: "Upload the invoice PDF" });
    if (!/^\d+(\.\d{1,2})?$/.test(rawAmount) || !(amount > 0)) {
      return res.status(400).json({ success: false, message: "Enter a valid invoice amount" });
    }

    const booking = await BookingModel.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    const invoice = await InvoiceModel.create({
      bookingId,
      amount,
      documentUrl: file.location,
      documentName: file.originalname,
      createdBy: (req as any).user?._id,
    });

    // The invoice is saved — notification/email problems must not fail the request.
    if (booking.customerId) {
      void notifyUser({
        userId: booking.customerId as any,
        type: "invoice-update",
        title: "Invoice added to your booking",
        message: `An invoice of ${formatNaira(amount)} was added to booking ${booking.bookingNumber}. Open the booking to view or download it.`,
        link: `/client/bookings/${booking._id}`,
        resourceId: String(booking._id),
        metadata: { bookingId: String(booking._id), invoiceId: String(invoice._id) },
      });

      try {
        const customer = await User.findById(booking.customerId).select("fullName email");
        if (customer?.email) {
          await sendBookingNotificationEmail({
            firstName: firstNameOf(customer.fullName),
            email: customer.email,
            heading: "Your invoice is ready",
            message: `An invoice of ${formatNaira(amount)} has been added to your booking. Log in to view or download it.`,
            bookingNumber: booking.bookingNumber,
          });
        }
      } catch (err) {
        console.error("createBookingInvoice: customer email failed", err);
      }
    }

    return res.status(201).json({ success: true, payload: invoice });
  } catch (error: any) {
    console.error("createBookingInvoice error", error);
    return res.status(500).json({ success: false, message: "Failed to add the invoice" });
  }
};

/** DELETE /invoice/:id (admin) — only while unpaid. */
export const deleteBookingInvoice = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid invoice id" });

    const invoice = await InvoiceModel.findById(id);
    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });
    if (invoice.isPaid) return res.status(409).json({ success: false, message: "A paid invoice can't be deleted" });

    // Conditional delete so a payment landing at the same moment isn't lost.
    const deleted = await InvoiceModel.findOneAndDelete({ _id: id, isPaid: { $ne: true } });
    if (!deleted) return res.status(409).json({ success: false, message: "A paid invoice can't be deleted" });
    return res.status(200).json({ success: true, message: "Invoice deleted" });
  } catch (error) {
    console.error("deleteBookingInvoice error", error);
    return res.status(500).json({ success: false, message: "Failed to delete the invoice" });
  }
};

/**
 * POST /invoices/:id/pay { paymentReference } — the booking's customer pays an
 * invoice through Paystack. The reference is verified with Paystack, must cover
 * the invoice and can't have paid anything else. When every invoice on a
 * quotation booking is paid, the booking is marked paid.
 */
export const payBookingInvoice = async (req: Request, res: Response): Promise<any> => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const paymentReference = typeof req.body?.paymentReference === "string" ? req.body.paymentReference.trim() : "";

    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid invoice id" });
    if (!paymentReference) return res.status(400).json({ success: false, message: "paymentReference is required" });

    const invoice = await InvoiceModel.findById(id);
    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });
    const booking = await BookingModel.findById(invoice.bookingId);
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
    if (String(booking.customerId) !== String(user?._id)) {
      return res.status(403).json({ success: false, message: "Not allowed to pay this invoice" });
    }
    if (invoice.isPaid) return res.status(409).json({ success: false, message: "This invoice has already been paid" });

    const reused =
      (await InvoiceModel.exists({ _id: { $ne: invoice._id }, paymentReference })) ||
      (await Procurement.exists({ paymentReference }));
    if (reused) return res.status(409).json({ success: false, message: "This payment reference has already been used" });

    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
    if (!PAYSTACK_SECRET_KEY) return res.status(500).json({ success: false, message: "Paystack not configured" });

    let paidAmount = 0;
    try {
      const response = await axios.get(`https://api.paystack.co/transaction/verify/${encodeURIComponent(paymentReference)}`, {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
      });
      const data = response.data?.data;
      if (!data || data.status !== "success") {
        return res.status(400).json({ success: false, message: "Paystack verification failed" });
      }
      paidAmount = Number(data.amount) / 100;
    } catch (err: any) {
      console.error("Invoice Paystack verification error", err?.response?.data || err.message || err);
      return res.status(502).json({ success: false, message: "Error verifying the Paystack payment" });
    }

    // Small tolerance for kobo rounding.
    if (paidAmount + 0.005 < invoice.amount) {
      return res.status(400).json({ success: false, message: "The amount paid is less than the invoice amount" });
    }

    // Conditional update so two confirmations of the same payment can't both succeed.
    const paid = await InvoiceModel.findOneAndUpdate(
      { _id: invoice._id, isPaid: { $ne: true } },
      { $set: { isPaid: true, paidAt: new Date(), paymentReference } },
      { new: true }
    );
    if (!paid) return res.status(409).json({ success: false, message: "This invoice has already been paid" });

    // Once every invoice on the booking is paid, the booking is paid: payment status
    // becomes Paid, and a booking still waiting on payment moves on to the Paid stage.
    const stillUnpaid = await InvoiceModel.exists({ bookingId: booking._id, isPaid: { $ne: true } });
    if (!stillUnpaid) {
      const update: Record<string, any> = {
        $set: { paymentStatus: PaymentStatus.PAID, modeOfPayment: "Paystack", transactnRef: paymentReference },
      };
      if (AWAITING_PAYMENT_STATUSES.includes(String(booking.status))) {
        update.$set.status = BookingStatus.PAID;
        update.$push = {
          timeline: { status: BookingStatus.PAID, changedBy: "system", changedAt: new Date(), reason: "Invoice paid" },
        };
      }
      await BookingModel.updateOne({ _id: booking._id }, update);
    }

    const amountText = formatNaira(invoice.amount);
    void notifyUser({
      userId: booking.customerId as any,
      type: "payment-receipt",
      title: "Invoice paid",
      message: `Your payment of ${amountText} for booking ${booking.bookingNumber} was received. Thank you!`,
      link: `/client/bookings/${booking._id}`,
      resourceId: String(booking._id),
      metadata: { bookingId: String(booking._id), invoiceId: String(invoice._id) },
    });
    if (booking.chefId) {
      void notifyUser({
        userId: booking.chefId as any,
        type: "payment-receipt",
        title: "Invoice paid",
        message: `The client paid the ${amountText} invoice for booking ${booking.bookingNumber}.`,
        link: `/chef/bookings/${booking._id}`,
        resourceId: String(booking._id),
      });
    }
    void notifyAdmins({
      type: "payment-confirmed",
      title: "Invoice paid",
      message: `${amountText} invoice paid for booking ${booking.bookingNumber}.`,
      link: `/admin/bookings/${booking._id}`,
    });

    const invoices = await InvoiceModel.find({ bookingId: booking._id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, message: "Invoice paid", payload: invoices });
  } catch (error) {
    console.error("payBookingInvoice error", error);
    return res.status(500).json({ success: false, message: "Failed to process the invoice payment" });
  }
};
