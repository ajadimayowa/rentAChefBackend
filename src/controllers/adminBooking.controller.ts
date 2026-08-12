import { Request, Response } from "express";
import mongoose from "mongoose";
import { BookingModel } from "../models/Booking";
import User from "../models/User.model";
import { BookingStatus, PaymentStatus } from "../platform/domain/enums";
import { bestEffortBookingDate, bestEffortGuestCount, minorToNaira } from "../utils/bookingStatus";
import { sendBookingNotificationEmail } from "../services/email/rentAChef/bookingEmailNotifications";

const firstNameOf = (fullName?: string) => (fullName || "there").trim().split(" ")[0];

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Admin-wide, filterable booking list. */
export const getAdminBookings = async (req: Request, res: Response): Promise<any> => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const status = req.query.status as string | undefined;
    const paymentStatus = req.query.paymentStatus as string | undefined;
    const search = (req.query.search as string | undefined)?.trim();

    const filter: any = {};
    if (status && status !== "all") filter.status = status;
    if (paymentStatus && paymentStatus !== "all") filter.paymentStatus = paymentStatus;

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      const matchingUsers = await User.find({
        fullName: regex,
        userType: { $in: ["Customer", "Chef"] },
      }).select("_id");
      const userIds = matchingUsers.map((u) => u._id);

      filter.$or = [
        { bookingNumber: regex },
        { customerId: { $in: userIds } },
        { chefId: { $in: userIds } },
      ];
    }

    const [bookings, total, statusCountsAgg] = await Promise.all([
      BookingModel.find(filter)
        .select("bookingNumber customerId chefId serviceId workflow status paymentStatus pricingSnapshot startDate bookingData createdAt")
        .populate("customerId", "fullName")
        .populate("chefId", "fullName")
        .populate("serviceId", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      BookingModel.countDocuments(filter),
      // Unfiltered global breakdown — powers the per-status count cards regardless of the active filter.
      BookingModel.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    ]);

    const statusCounts: Record<string, number> = {};
    for (const row of statusCountsAgg as any[]) {
      statusCounts[row._id] = row.count;
    }

    return res.status(200).json({
      success: true,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1, statusCounts },
      payload: bookings.map((b: any) => ({
        id: b._id,
        bookingNumber: b.bookingNumber,
        customerName: b.customerId?.fullName || "Unassigned",
        chefName: b.chefId?.fullName || "Unassigned",
        serviceName: b.serviceId?.name || "—",
        workflow: b.workflow,
        status: b.status,
        paymentStatus: b.paymentStatus,
        date: bestEffortBookingDate(b),
        guests: bestEffortGuestCount(b.bookingData),
        amount: minorToNaira(b.pricingSnapshot?.estimatedTotalMinor || 0),
        createdAt: b.createdAt,
      })),
    });
  } catch (error) {
    console.error("Get Admin Bookings Error:", error);
    return res.status(500).json({ success: false, message: "Error fetching bookings", error });
  }
};

/** Free-form status move — the mock UI this replaces let admins set any status directly, so this keeps that behaviour rather than gating on the state machine's declared transitions. */
export const updateAdminBookingStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { status } = req.body as { status?: string };

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid booking ID" });
    }

    if (!status || !(Object.values(BookingStatus) as string[]).includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const booking = await BookingModel.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const actorId = (req as any).user?._id ? String((req as any).user._id) : "ADMIN";

    booking.status = status as BookingStatus;
    booking.timeline = booking.timeline || [];
    booking.timeline.push({ status, changedBy: actorId, changedAt: new Date() });
    await booking.save();

    // "Admin Reviewed" is the closest thing this system has to an explicit "approved" status.
    if (status === BookingStatus.ADMIN_REVIEW && booking.customerId) {
      const customer = await User.findById(booking.customerId).select("fullName email");
      if (customer?.email) {
        await sendBookingNotificationEmail({
          firstName: firstNameOf(customer.fullName),
          email: customer.email,
          heading: "Your booking has been approved",
          message: "Your booking has been reviewed and approved by our team. We'll be in touch with the next steps shortly.",
          bookingNumber: booking.bookingNumber,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Booking status updated",
      payload: { id: booking._id, status: booking.status },
    });
  } catch (error) {
    console.error("Update Admin Booking Status Error:", error);
    return res.status(500).json({ success: false, message: "Error updating booking status", error });
  }
};

/** Admin-driven manual chef assignment — lets an admin pick a specific chef rather than relying on auto-assignment. */
export const assignAdminBookingChef = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { chefId } = req.body as { chefId?: string };

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid booking ID" });
    }
    if (!chefId || !mongoose.Types.ObjectId.isValid(chefId)) {
      return res.status(400).json({ success: false, message: "A valid chefId is required" });
    }

    const chef = await User.findById(chefId).select("fullName userType email");
    if (!chef || chef.userType !== "Chef") {
      return res.status(404).json({ success: false, message: "Chef not found" });
    }

    const booking = await BookingModel.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const actorId = (req as any).user?._id ? String((req as any).user._id) : "ADMIN";

    booking.chefId = chef._id as any;
    booking.status = BookingStatus.CHEF_ASSIGNED;
    booking.timeline = booking.timeline || [];
    booking.timeline.push({
      status: BookingStatus.CHEF_ASSIGNED,
      changedBy: actorId,
      changedAt: new Date(),
      reason: `Chef ${chef.fullName} manually assigned by admin`,
    });
    await booking.save();

    if (chef.email) {
      await sendBookingNotificationEmail({
        firstName: firstNameOf(chef.fullName),
        email: chef.email,
        heading: "A new booking has been assigned to you",
        message: "A new booking has been assigned to you, kindly login to your account to see the details of the booking.",
        bookingNumber: booking.bookingNumber,
      });
    }

    if (booking.customerId) {
      const customer = await User.findById(booking.customerId).select("fullName email");
      if (customer?.email) {
        await sendBookingNotificationEmail({
          firstName: firstNameOf(customer.fullName),
          email: customer.email,
          heading: "A chef has been assigned to your booking",
          message: "A chef has been assigned to your booking",
          bookingNumber: booking.bookingNumber,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Chef assigned",
      payload: {
        id: booking._id,
        status: booking.status,
        chef: { id: chef._id, fullName: chef.fullName },
      },
    });
  } catch (error) {
    console.error("Assign Admin Booking Chef Error:", error);
    return res.status(500).json({ success: false, message: "Error assigning chef", error });
  }
};

/** Admin note left on a booking — a lightweight comment thread, not customer/chef-facing. */
export const addAdminBookingComment = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { text } = req.body as { text?: string };

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid booking ID" });
    }
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: "Comment text is required" });
    }

    const booking = await BookingModel.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const actor = (req as any).user;
    const comment = {
      text: text.trim(),
      authorId: actor?._id ? String(actor._id) : "ADMIN",
      authorName: actor?.fullName || "Admin",
      createdAt: new Date(),
    };

    booking.comments = booking.comments || [];
    booking.comments.push(comment);
    await booking.save();

    if (booking.customerId) {
      const customer = await User.findById(booking.customerId).select("fullName email");
      if (customer?.email) {
        await sendBookingNotificationEmail({
          firstName: firstNameOf(customer.fullName),
          email: customer.email,
          heading: "A new comment was added to your booking",
          message: `Our team left a new note on your booking: "${comment.text}"`,
          bookingNumber: booking.bookingNumber,
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: "Comment added",
      payload: booking.comments,
    });
  } catch (error) {
    console.error("Add Admin Booking Comment Error:", error);
    return res.status(500).json({ success: false, message: "Error adding comment", error });
  }
};

const PAYMENT_MODES = ["Cash", "Transfer"] as const;

/** Admin-recorded manual payment (cash or bank transfer collected outside Paystack) — marks the booking paid. */
export const addAdminBookingPayment = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { transactionRef, mode, bankName, accountNumber, amount, date } = req.body as {
      transactionRef?: string;
      mode?: string;
      bankName?: string;
      accountNumber?: string;
      amount?: number | string;
      date?: string;
    };

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid booking ID" });
    }
    if (!transactionRef || !transactionRef.trim()) {
      return res.status(400).json({ success: false, message: "Transaction reference is required" });
    }
    if (!mode || !(PAYMENT_MODES as readonly string[]).includes(mode)) {
      return res.status(400).json({ success: false, message: "Payment mode must be Cash or Transfer" });
    }
    if (mode === "Transfer" && (!bankName || !accountNumber)) {
      return res.status(400).json({ success: false, message: "Bank name and account number are required for a bank transfer" });
    }
    const parsedAmount = Number(amount);
    if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: "A valid amount is required" });
    }
    const parsedDate = date ? new Date(date) : null;
    if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ success: false, message: "A valid payment date is required" });
    }

    const booking = await BookingModel.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const actorId = (req as any).user?._id ? String((req as any).user._id) : "ADMIN";

    booking.paymentStatus = PaymentStatus.PAID;
    booking.modeOfPayment = mode as "Cash" | "Transfer";
    booking.transactnRef = transactionRef.trim();
    booking.paymentDetails = {
      mode: mode as "Cash" | "Transfer",
      transactionRef: transactionRef.trim(),
      bankName: mode === "Transfer" ? bankName : undefined,
      accountNumber: mode === "Transfer" ? accountNumber : undefined,
      amount: parsedAmount,
      date: parsedDate,
      recordedBy: actorId,
      recordedAt: new Date(),
    };
    booking.timeline = booking.timeline || [];
    booking.timeline.push({
      status: booking.status,
      changedBy: actorId,
      changedAt: new Date(),
      reason: `Payment recorded manually (${mode}) — ref ${transactionRef.trim()}`,
    });
    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Payment recorded",
      payload: {
        id: booking._id,
        paymentStatus: booking.paymentStatus,
        modeOfPayment: booking.modeOfPayment,
        transactnRef: booking.transactnRef,
        paymentDetails: booking.paymentDetails,
      },
    });
  } catch (error) {
    console.error("Add Admin Booking Payment Error:", error);
    return res.status(500).json({ success: false, message: "Error recording payment", error });
  }
};
