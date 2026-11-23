import { Request, Response } from "express";
import mongoose from "mongoose";
import { BookingModel } from "../models/Booking";
import Procurement from "../models/Procurement";
import { bestEffortBookingDate, bestEffortGuestCount, minorToNaira } from "../utils/bookingStatus";

/**
 * Single booking detail — shared by the admin, chef and customer "view booking"
 * pages (each renders this same payload differently). Access is resolved from the
 * requester's role rather than three separate role-scoped endpoints: admins can
 * view any booking, chefs/customers only their own.
 */
export const getBookingDetail = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid booking ID" });
    }

    const booking = await BookingModel.findById(id)
      .populate("customerId", "fullName email phoneNumber profilePic")
      .populate("chefId", "fullName email phoneNumber profilePic chefDetails.rating")
      .populate("serviceId", "name description");

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const requester = (req as any).user;
    const isAdmin = requester?.userType === "Admin";
    const isOwnerChef = requester?.userType === "Chef" && (booking.chefId as any)?._id?.toString() === String(requester._id);
    const isOwnerCustomer =
      requester?.userType === "Customer" && (booking.customerId as any)?._id?.toString() === String(requester._id);

    if (!isAdmin && !isOwnerChef && !isOwnerCustomer) {
      return res.status(403).json({ success: false, message: "You do not have access to this booking" });
    }

    const json = booking.toJSON() as any;
    const { customerId, chefId, serviceId, declinedChefs, ...rest } = json;
    // Who declined (and why) is for admins only; chefs and customers just see the current state.
    if (isAdmin) rest.declinedChefs = declinedChefs || [];
    // Bookings assigned before chef confirmation existed still await the chef's answer.
    if (chefId && !rest.chefResponse?.status) rest.chefResponse = { status: "pending" };
    const pricing = rest.pricingSnapshot || {};
    // Procurement records (PDF + amount) the admin raised for this booking, newest first.
    const procurements = await Procurement.find({ bookingId: booking._id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      payload: {
        ...rest,
        customer: customerId || null,
        chef: chefId || null,
        service: serviceId || null,
        procurements: procurements.map((p) => p.toJSON()),
        date: bestEffortBookingDate(booking),
        guests: bestEffortGuestCount(booking.bookingData),
        pricingSnapshot: {
          ...pricing,
          baseChefFee: minorToNaira(pricing.baseChefFeeMinor || 0),
          estimatedTotal: minorToNaira(pricing.estimatedTotalMinor || 0),
        },
      },
    });
  } catch (error) {
    console.error("Get Booking Detail Error:", error);
    return res.status(500).json({ success: false, message: "Error fetching booking", error });
  }
};
