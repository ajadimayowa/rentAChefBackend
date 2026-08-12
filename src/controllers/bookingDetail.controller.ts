import { Request, Response } from "express";
import mongoose from "mongoose";
import { BookingModel } from "../models/Booking";
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
    const { customerId, chefId, serviceId, ...rest } = json;
    const pricing = rest.pricingSnapshot || {};

    return res.status(200).json({
      success: true,
      payload: {
        ...rest,
        customer: customerId || null,
        chef: chefId || null,
        service: serviceId || null,
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
