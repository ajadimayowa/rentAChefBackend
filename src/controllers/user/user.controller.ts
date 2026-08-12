import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import * as crypto from "crypto";
import UserModel from "../../models/User.model";
import { BookingModel } from "../../models/Booking";
import {
  CLOSED_BOOKING_STATUSES,
  bestEffortBookingDate,
  bestEffortGuestCount,
  minorToNaira,
} from "../../utils/bookingStatus";


export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, search = "", userType, isActive } = req.query;

    const pageNum = Math.max(parseInt(page as string, 10), 1);
    const limitNum = Math.max(parseInt(limit as string, 10), 1);
    const skip = (pageNum - 1) * limitNum;

    const query: any = {};

    if (userType && typeof userType === "string") {
      query.userType = userType;
    }

    if (isActive !== undefined) {
      query.isActive = String(isActive) === "true";
    }

    if (search && typeof search === "string" && search.trim()) {
      const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

      query.$or = [
        { fullName: regex },
        { email: regex },
        { phoneNumber: regex },
        { "address.city": regex },
      ];
    }

    const [total, users] = await Promise.all([
      UserModel.countDocuments(query),
      UserModel.find(query)
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 }),
    ]);

    res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      meta: {
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum) || 1,
        limit: limitNum,
      },
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error,
    });
  }
};

/** Admin toggle for a user's active flag — e.g. suspending or reinstating a customer account. There's no separate pending/rejected state on the schema, just isActive. */
export const updateUserActiveStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { isActive } = req.body as { isActive?: boolean };

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({ success: false, message: "isActive must be a boolean" });
    }

    const user = await UserModel.findByIdAndUpdate(id, { isActive }, { new: true });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      message: "User status updated",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error updating user status", error });
  }
};

// Get single user by ID
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid user ID" });
      return;
    }


    const user = await UserModel.findById(id).select("-profile.password");
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "User retrieved successfully",
      payload: user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching user",
      error,
    });
  }
};

/** Customer's own dashboard summary — booking counts, lifetime spend, and upcoming bookings. */
export const getUserDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid user ID" });
      return;
    }

    const requester = (req as any).user;
    const isOwner = requester && String(requester._id) === id;
    const isAdmin = requester?.userType === "Admin";
    if (!isOwner && !isAdmin) {
      res.status(403).json({ message: "You can only view your own dashboard" });
      return;
    }

    const user = await UserModel.findOne({ _id: id, userType: "Customer" }).select("-password");
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const [totalBookings, upcomingBookingsCount, spendAgg, upcomingBookingsRaw] = await Promise.all([
      BookingModel.countDocuments({ customerId: id }),
      BookingModel.countDocuments({ customerId: id, status: { $nin: CLOSED_BOOKING_STATUSES } }),
      BookingModel.aggregate([
        { $match: { customerId: new mongoose.Types.ObjectId(id), paymentStatus: "Paid" } },
        { $group: { _id: null, total: { $sum: { $ifNull: ["$pricingSnapshot.estimatedTotalMinor", 0] } } } },
      ]),
      BookingModel.find({ customerId: id, status: { $nin: CLOSED_BOOKING_STATUSES } })
        .select("bookingNumber chefId serviceId status pricingSnapshot startDate bookingData createdAt")
        .populate("chefId", "fullName")
        .populate("serviceId", "name")
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    res.status(200).json({
      message: "User dashboard retrieved successfully",
      payload: {
        user: { id: user._id, fullName: user.fullName, firstName: user.firstName, email: user.email },
        metrics: {
          upcomingBookings: upcomingBookingsCount,
          totalBookings,
          lifetimeSpend: minorToNaira(spendAgg?.[0]?.total || 0),
        },
        upcomingBookings: upcomingBookingsRaw.map((booking: any) => ({
          id: booking._id,
          bookingNumber: booking.bookingNumber,
          chefName: booking.chefId?.fullName || "Unassigned",
          serviceName: booking.serviceId?.name || "—",
          date: bestEffortBookingDate(booking),
          guests: bestEffortGuestCount(booking.bookingData),
          amount: minorToNaira(booking.pricingSnapshot?.estimatedTotalMinor || 0),
          status: booking.status,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching user dashboard",
      error,
    });
  }
};

/** Customer's own booking list (ownership-checked — same rule as getUserDashboard). */
export const getUserBookings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid user ID" });
      return;
    }

    const requester = (req as any).user;
    const isOwner = requester && String(requester._id) === id;
    const isAdmin = requester?.userType === "Admin";
    if (!isOwner && !isAdmin) {
      res.status(403).json({ message: "You can only view your own bookings" });
      return;
    }

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const status = req.query.status as string | undefined;
    const filter: any = { customerId: id };
    if (status && status !== "all") filter.status = status;

    const [bookings, total] = await Promise.all([
      BookingModel.find(filter)
        .select("bookingNumber chefId serviceId workflow status paymentStatus pricingSnapshot startDate bookingData createdAt")
        .populate("chefId", "fullName")
        .populate("serviceId", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      BookingModel.countDocuments(filter),
    ]);

    res.status(200).json({
      message: "Bookings retrieved successfully",
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
      payload: bookings.map((b: any) => ({
        id: b._id,
        bookingNumber: b.bookingNumber,
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
    res.status(500).json({
      message: "Error fetching bookings",
      error,
    });
  }
};

// Update Profile Picture
export const updateProfilePic = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params; // Assuming userId is passed in the URL
  const profilePic = req.file as any; // multer file

  if (!profilePic) {
    return res.status(400).json({ message: 'Profile picture is required' });
  }

  try {
    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      { profilePic: profilePic?.location || profilePic?.path || "", },
      { new: true, runValidators: true }
    );

    console.log({ seeRecord: { id, pic: profilePic?.location, path: profilePic?.path } })

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({success:true, message: 'Profile picture updated successfully', updatedUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Complete KYC (Know Your Customer)
export const completeKyc = async (req: Request, res: Response): Promise<any> => {
  const idPic = req.file as any; // multer file
  const { userId } = req.params; // Assuming userId is passed in the URL
  const { idType, idNumber } = req.body;

  if (!idType || !idNumber || !idPic) {
    return res.status(400).json({ message: 'All KYC fields are required' });
  }

  try {
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      {
        "customerDetails.kyc": { idType, idNumber, idPicture: idPic?.location || idPic?.path || "", },
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ success: true, message: 'KYC completed successfully', updatedUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Update Health Information
export const updateHealthInformation = async (req: Request, res: Response): Promise<any> => {
  const { userId } = req.params; // Assuming userId is passed in the URL
  const { allergies, healthDetails } = req.body;

  if (!allergies && !healthDetails) {
    return res.status(400).json({ message: 'Health information is required' });
  }

  try {
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      {
        "customerDetails.healthInformation": { allergies, healthDetails },
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({success:true, message: 'Health information updated successfully', updatedUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Update Next of Kin (NOK)
export const updateNok = async (req: Request, res: Response): Promise<any> => {
  const { userId } = req.params; // Assuming userId is passed in the URL
  const { fullName, phone, relationship } = req.body;

  if (!fullName || !phone || !relationship) {
    return res.status(400).json({ message: 'All NOK fields are required' });
  }

  try {
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      {
        "customerDetails.nok": { fullName, phone, relationship },
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({success:false, message: 'User not found' });
    }

    return res.status(200).json({success:true, message: 'Next of kin updated successfully', updatedUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Update Location
export const updateLocation = async (req: Request, res: Response): Promise<any> => {
  const { userId } = req.params; // Assuming userId is passed in the URL
  const { home, office, state, city, long, lat } = req.body;

  if (!home && !office && !state && !city && !long && !lat) {
    return res.status(400).json({ message: 'One of the address is required' });
  }

  try {
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      {
        "customerDetails.location": { home, office, state, city, long, lat },
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({ success: true, message: 'Location updated successfully', updatedUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Update Bio Data (Full name, Marital status, etc.)
export const updateBioData = async (req: Request, res: Response): Promise<any> => {
  const { userId } = req.params; // Assuming userId is passed in the URL
  const { fullName, dob, maritalStatus, gender,phoneNumber } = req.body;

  if (!fullName && !maritalStatus && !dob) {
    return res.status(400).json({ message: 'At least one field should be provided to update' });
  }

  try {
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      {
        fullName,
        gender,
        dob,
        maritalStatus,
        phoneNumber
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ success: true, message: 'Bio data updated successfully', updatedUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};