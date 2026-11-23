import { Request, Response } from "express";
import mongoose from "mongoose";
import { BookingModel } from "../models/Booking";
import { BookingStatus } from "../platform/domain/enums";
import { notifyAdmins } from "../services/adminNotifications";

/*
 * A chef confirms whether they can take a booking an admin assigned to them.
 *
 *   POST /chef/bookings/:id/respond   { action: "accept" | "decline", reason? }
 *
 * - accept:  the booking stays with the chef, marked accepted.
 * - decline: the chef is removed from the booking, which returns to the status it had
 *            before assignment, and admins are notified so they can reassign it.
 */

const MAX_REASON = 500;

export const respondToBookingAssignment = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const chef = (req as any).user;
    const action = req.body?.action;
    const reason = typeof req.body?.reason === "string" ? req.body.reason.trim().slice(0, MAX_REASON) : "";

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid booking ID" });
    }
    if (action !== "accept" && action !== "decline") {
      return res.status(400).json({ success: false, message: 'action must be "accept" or "decline"' });
    }
    if (action === "decline" && !reason) {
      return res.status(400).json({ success: false, message: "Please tell us why you can't take this booking." });
    }

    const booking = await BookingModel.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }
    if (!booking.chefId || String(booking.chefId) !== String(chef._id)) {
      return res.status(403).json({ success: false, message: "This booking is not assigned to you." });
    }

    // Bookings assigned before this feature have no chefResponse yet — treat them as awaiting a reply.
    const current = booking.chefResponse?.status ?? "pending";
    if (current !== "pending") {
      return res.status(409).json({ success: false, message: `You have already ${current} this booking.` });
    }

    const now = new Date();
    const chefName = chef.fullName || "The chef";
    const link = `/admin/bookings/${booking._id}`;
    booking.timeline = booking.timeline || [];

    if (action === "accept") {
      booking.chefResponse = {
        ...(booking.chefResponse || {}),
        chefId: chef._id,
        status: "accepted",
        respondedAt: now,
        reason: undefined,
      };
      booking.timeline.push({
        status: booking.status,
        changedBy: String(chef._id),
        changedAt: now,
        reason: `${chefName} accepted the booking`,
      });
      await booking.save();

      void notifyAdmins({
        type: "chef-accepted",
        title: "Chef accepted a booking",
        message: `${chefName} confirmed booking ${booking.bookingNumber}.`,
        link,
        metadata: { bookingId: String(booking._id), chefId: String(chef._id) },
      });
    } else {
      const restoredStatus =
        (booking.chefResponse?.previousStatus as BookingStatus | undefined) || BookingStatus.ADMIN_REVIEW;

      booking.declinedChefs = booking.declinedChefs || [];
      booking.declinedChefs.push({ chefId: chef._id, chefName, reason, declinedAt: now });
      booking.chefResponse = {
        ...(booking.chefResponse || {}),
        chefId: chef._id,
        status: "declined",
        respondedAt: now,
        reason,
      };
      booking.chefId = undefined;
      booking.status = restoredStatus;
      booking.timeline.push({
        status: restoredStatus,
        changedBy: String(chef._id),
        changedAt: now,
        reason: `${chefName} declined the booking: ${reason}`,
      });
      await booking.save();

      void notifyAdmins({
        type: "chef-declined",
        title: "Chef declined a booking — reassign it",
        message: `${chefName} can't take booking ${booking.bookingNumber}: ${reason}`,
        link,
        metadata: { bookingId: String(booking._id), chefId: String(chef._id) },
      });
    }

    return res.status(200).json({
      success: true,
      message: action === "accept" ? "Booking accepted" : "Booking declined",
      payload: {
        id: booking._id,
        status: booking.status,
        chefResponse: booking.chefResponse,
      },
    });
  } catch (error) {
    console.error("Respond to booking assignment error:", error);
    return res.status(500).json({ success: false, message: "Could not save your response" });
  }
};
