import { Request, Response } from "express";
import User from "../models/User.model";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { sendChefApprovedEmail, sendChefCreationSuccessEmail } from "../services/email/rentAChef/chefsEmailNotification";
import { ChefService } from "../models/ChefService";
import { BookingModel} from "../models/Booking";
import { isChefAvailable } from "../utils/checkChefAvailability";
import Menu from "../models/Menu";
import { formatNigerianPhoneNumber, generateStaffId } from "../utils/otpUtils";
import { generateEmailVerificationOtp } from "../services/auth/auth.service";
import {
  CLOSED_BOOKING_STATUSES,
  bestEffortBookingDate,
  bestEffortGuestCount,
  minorToNaira,
} from "../utils/bookingStatus";


/**
 * Services offered live in the ChefService collection, not on
 * `chefDetails.servicesOffered` — this resolves the real assigned services for a
 * batch of chefs and stitches them onto each chef's JSON so admin list/edit views
 * (which only look at `chefDetails.servicesOffered`) see the actual selection.
 */
const attachServicesOffered = async (chefs: any[]): Promise<any[]> => {
  const chefIds = chefs.map((c) => c._id);
  const chefServices = await ChefService.find({ chefId: { $in: chefIds }, isAvailable: true }).lean();

  const servicesByChef = new Map<string, string[]>();
  for (const cs of chefServices) {
    const key = cs.chefId.toString();
    const list = servicesByChef.get(key) ?? [];
    list.push(cs.serviceId.toString());
    servicesByChef.set(key, list);
  }

  return chefs.map((c) => {
    const obj = typeof c.toJSON === "function" ? c.toJSON() : c;
    obj.chefDetails = { ...(obj.chefDetails || {}), servicesOffered: servicesByChef.get(c._id.toString()) ?? [] };
    return obj;
  });
};

export const createChef = async (req: Request, res: Response): Promise<any> => {
  try {
    const chefPic = req.file as any; // multer file

    const {
      name,
      gender,
      email,
      phone,
      bio,
      dob,
      specialties,
      stateId,
      stateName,
      city,
      defaultPassword,
      yearsOfExperience,
      chefLevel,
      servicesOffered
    } = req.body;
     const staffId = generateStaffId();

     const fullName = name.trim();
     const firstName = fullName.split(" ")[0];
     const phoneNumber = formatNigerianPhoneNumber(phone);

    // console.log({ adminSent: req.body });

    if (!staffId || !fullName || !email || !city || !stateId || !phone) {
      return res.status(400).json({ message: "city, state, phone number, name & email are required" });
    }

    // Check if chef already exists
    const exists = await User.findOne({ $or: [{ email }, { "chefDetails.staffId": staffId }] });
    if (exists) {
      return res.status(400).json({ message: "Chef already exists" });
    }

    // Handle password (plaintext here — pre-save hook hashes it on create)
    const pass = defaultPassword || "Chef@123";

    // // Parse specialties JSON
    // let specialtiesArray: string[] = [];
    // try {
    //     specialtiesArray = specialties ? JSON.parse(specialties) : [];
    // } catch (err) {
    //     return res.status(400).json({ message: "Invalid specialties format. Should be an array of strings." });
    // }

    // Create chef
    const chef = await User.create({
      userType: "Chef",
      isActive: false,
      fullName,
      firstName,
      gender,
      email,
      phoneNumber,
      address: { stateId, stateName, city },
      dob,
      password: pass,
      chefDetails: {
        staffId,
        bio,
        yearsOfExperience,
        specialties,
        chefLevel,
        servicesOffered
      },
      profilePic: chefPic?.location || chefPic?.path || "", // depending on S3 or local
    });

    try {
      await sendChefCreationSuccessEmail({
        email,
        firstName: fullName,
        password: pass,
      })
    } catch (error) {
      console.log(error)
    }

    // After creating chef, optionally create ChefService entries if serviceId(s) provided
    try {
      const { serviceId, serviceIds, isAvailable } = req.body as any;
      const ids: string[] = Array.isArray(serviceIds) ? serviceIds : (serviceId ? [serviceId] : []);

      let createdServices: any[] = [];
      let dupCount = 0;

      if (ids.length > 0) {
        const results = await Promise.allSettled(
          ids.map((sid: string) => ChefService.create({ chefId: chef._id, serviceId: sid, isAvailable: isAvailable ?? true }))
        );

        createdServices = results.filter((r: any) => r.status === 'fulfilled').map((r: any) => r.value);
        dupCount = results.filter((r: any) => r.status === 'rejected' && r.reason && r.reason.code === 11000).length;
      }

      const [payload] = await attachServicesOffered([chef]);

      return res.status(201).json({
        success: true,
        message: "Chef created successfully",
        payload,
        defaultPassword: pass,
        chefServicesCreated: createdServices,
        chefServicesDuplicatesSkipped: dupCount
      });

    } catch (err) {
      console.warn('Failed to create chef services:', err);
      return res.status(201).json({
        success: true,
        message: "Chef created successfully (services creation failed)",
        payload: chef,
        defaultPassword: pass
      });
    }

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error creating chef", error });
  }
};

export const getAllChefs = async (req: Request, res: Response): Promise<any> => {
  try {
    // Pagination
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    // Filters
    const getQueryValue = (...keys: string[]): string | undefined => {
      for (const key of keys) {
        const raw = req.query[key];
        const value = Array.isArray(raw) ? raw[0] : raw;

        if (value !== undefined && value !== null) {
          const trimmed = String(value).trim();
          if (trimmed) return trimmed;
        }
      }
      return undefined;
    };

    const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const city = getQueryValue("location", "lga", "city", "long", "lat");
    const state = getQueryValue("state", "stateName");
    const isActiveQuery = getQueryValue("isActive", "active");
    const name = getQueryValue("name", "search", "q");

    const filter: any = { userType: "Chef" };

    if (city) {
      filter["address.city"] = { $regex: escapeRegex(city), $options: "i" };
    }

    if (state) {
      filter["address.stateName"] = { $regex: escapeRegex(state), $options: "i" };
    }

    if (isActiveQuery !== undefined) {
      const normalizedActive = isActiveQuery.toLowerCase();
      if (["true", "1", "yes"].includes(normalizedActive)) {
        filter.isActive = true;
      } else if (["false", "0", "no"].includes(normalizedActive)) {
        filter.isActive = false;
      }
    }

    // 🔍 Search by chef name (case-insensitive, partial match)
    if (name) {
      filter.fullName = { $regex: escapeRegex(name), $options: "i" };
    }

    // Query
    const [chefs, total] = await Promise.all([
      User.find(filter)
        .select("-password")
        .populate("chefDetails.chefLevel", "name description")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    const payload = await attachServicesOffered(chefs);

    return res.status(200).json({
      success: true,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      payload,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching chefs",
      payload: error,
    });
  }
};



// ✅ Get one chef
export const getChefById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid ID" });
      return;
    }

    const chef = await User.findOne({ _id: id, userType: "Chef" })
      .select("-password") // ✅ exclude password
      .populate("chefDetails.chefLevel", "name description");

    if (!chef) {
      res.status(404).json({ success: false, message: "Chef not found" });
      return;
    }

    // compute booking counts
    const [totalChefBooking, totalCompletedBooking, totalUpcoming] = await Promise.all([
      BookingModel.countDocuments({ chefId: id }),
      BookingModel.countDocuments({ chefId: id, status: 'Completed' }),
      BookingModel.countDocuments({ chefId: id, status: { $nin: CLOSED_BOOKING_STATUSES } }),
    ]);

    // fetch recent menus for this chef (last 3)
    const getTheChefMenu = await Menu.find({ chefId: id }).sort({ createdAt: -1 }).limit(3).lean();

    // fetch services offered via ChefService
    const { ChefService } = await import('../models/ChefService');
    const services = await ChefService.find({ chefId: id, isAvailable: true }).populate('serviceId', 'name').lean();
    const servicesOffered = services.map((s: any) => ({ id: s.serviceId?._id || s.serviceId, name: s.serviceId?.name || s.serviceId }));

    res.status(200).json({
      success: true,
      payload: {
        chef,
        totalChefBooking,
        totalCompletedBooking,
        totalUpcoming,
        getTheChefMenu,
        servicesOffered,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching chef",
      error,
    });
  }
};

// ✅ Chef's own dashboard summary (auth required — reads the logged-in chef)
export const getChefDashboard = async (req: Request, res: Response): Promise<any> => {
  try {
    const chefId = (req as any).user?._id;

    const [jobsCompleted, upcomingBookingsCount, earningsAgg, upcomingBookingsRaw] = await Promise.all([
      BookingModel.countDocuments({ chefId, status: "Completed" }),
      BookingModel.countDocuments({ chefId, status: { $nin: CLOSED_BOOKING_STATUSES } }),
      BookingModel.aggregate([
        { $match: { chefId: new mongoose.Types.ObjectId(chefId), paymentStatus: "Paid" } },
        { $group: { _id: null, total: { $sum: { $ifNull: ["$pricingSnapshot.estimatedTotalMinor", 0] } } } },
      ]),
      BookingModel.find({ chefId, status: { $nin: CLOSED_BOOKING_STATUSES } })
        .select("bookingNumber customerId serviceId status pricingSnapshot startDate bookingData createdAt")
        .populate("customerId", "fullName")
        .populate("serviceId", "name")
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    const chef = (req as any).user;

    return res.status(200).json({
      success: true,
      payload: {
        metrics: {
          upcomingBookings: upcomingBookingsCount,
          jobsCompleted,
          rating: chef?.chefDetails?.rating || 0,
          lifetimeEarnings: minorToNaira(earningsAgg?.[0]?.total || 0),
        },
        upcomingBookings: upcomingBookingsRaw.map((booking: any) => ({
          id: booking._id,
          bookingNumber: booking.bookingNumber,
          customerName: booking.customerId?.fullName || "Unassigned",
          serviceName: booking.serviceId?.name || "—",
          date: bestEffortBookingDate(booking),
          guests: bestEffortGuestCount(booking.bookingData),
          amount: minorToNaira(booking.pricingSnapshot?.estimatedTotalMinor || 0),
          status: booking.status,
        })),
      },
    });
  } catch (error) {
    console.error("Chef Dashboard Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching chef dashboard",
      error,
    });
  }
};

// ✅ Chef's own booking list (auth required — scoped to the logged-in chef)
export const getChefBookings = async (req: Request, res: Response): Promise<any> => {
  try {
    const chefId = (req as any).user?._id;
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const status = req.query.status as string | undefined;
    const filter: any = { chefId };
    if (status && status !== "all") filter.status = status;

    const [bookings, total] = await Promise.all([
      BookingModel.find(filter)
        .select("bookingNumber customerId serviceId workflow status paymentStatus pricingSnapshot startDate bookingData createdAt")
        .populate("customerId", "fullName")
        .populate("serviceId", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      BookingModel.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
      payload: bookings.map((b: any) => ({
        id: b._id,
        bookingNumber: b.bookingNumber,
        customerName: b.customerId?.fullName || "Unassigned",
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
    console.error("Get Chef Bookings Error:", error);
    return res.status(500).json({ success: false, message: "Error fetching bookings", error });
  }
};

// ✅ Update Chef (Admin OR Chef owner)
export const updateChef = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    // ✅ Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid chef ID" });
    }

    /**
     * ✅ Whitelisted fields
     * Prevent updating sensitive fields like password, isActive, staffId, etc.
     * (password intentionally excluded — password changes must go through the
     * dedicated OTP flow so they're hashed correctly)
     */
    const topLevelUpdates = ["gender", "email", "profilePic", "dob", "phoneNumber"];
    const chefDetailUpdates = [
      "bio",
      "specialties",
      "rating",
      "staffId",
      "yearsOfExperience",
      "chefLevel",
    ];
    const addressUpdates = ["stateId", "stateName", "city"];

    const updates: Record<string, any> = {};

    if (req.body.name !== undefined) {
      updates.fullName = req.body.name;
    }

    for (const key of topLevelUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    // ✅ Picture upload (multer-s3) takes precedence over any profilePic string in the body
    const chefPic = req.file as any;
    if (chefPic) {
      updates.profilePic = chefPic.location || chefPic.path;
    }

    for (const key of chefDetailUpdates) {
      if (req.body[key] !== undefined) {
        updates[`chefDetails.${key}`] = req.body[key];
      }
    }

    for (const key of addressUpdates) {
      if (req.body[key] !== undefined) {
        updates[`address.${key}`] = req.body[key];
      }
    }

    const chef = await User.findOneAndUpdate({ _id: id, userType: "Chef" }, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!chef) {
      return res.status(404).json({ success: false, message: "Chef not found" });
    }

    // Services offered live in the ChefService collection (see createChef) —
    // reconcile it here too, otherwise edits to "services offered" are silently dropped.
    const { serviceId, serviceIds } = req.body as any;
    const nextServiceIds: string[] | undefined = Array.isArray(serviceIds) ?
    serviceIds :
    serviceId ? [serviceId] : undefined;

    if (nextServiceIds !== undefined) {
      await ChefService.deleteMany({ chefId: chef._id, serviceId: { $nin: nextServiceIds } });
      await Promise.allSettled(
        nextServiceIds.map((sid: string) =>
        ChefService.updateOne(
          { chefId: chef._id, serviceId: sid },
          { $set: { isAvailable: true } },
          { upsert: true }
        )
        )
      );
    }

    const [payload] = await attachServicesOffered([chef]);

    return res.status(200).json({
      success: true,
      message: "Chef updated successfully",
      payload,
    });

  } catch (error: any) {
    console.error("Update Chef Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating chef",
      error: error.message,
    });
  }
};



// ✅ Update chef approval status (ADMIN only)
export const updateChefStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { status } = req.body as { status?: string };

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid chef ID" });
    }

    const allowedStatuses = ["pending", "approved", "suspended", "rejected"];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const chef = await User.findOne({ _id: id, userType: "Chef" });
    if (!chef) {
      return res.status(404).json({ success: false, message: "Chef not found" });
    }

    const isApproving = status === "approved";
    chef.isActive = isApproving;

    // Only issue a fresh verification link the first time a chef is approved —
    // a chef reinstated after suspension has already verified their email.
    const needsVerificationEmail = isApproving && !chef.isEmailVerified;
    if (needsVerificationEmail) {
      chef.emailVerificationOtp = generateEmailVerificationOtp();
    }

    await chef.save();

    if (needsVerificationEmail) {
      try {
        const verifyUrl = `${process.env.CLIENT_URL}/verify-email?email=${encodeURIComponent(chef.email)}&otp=${encodeURIComponent(chef.emailVerificationOtp || "")}`;
        await sendChefApprovedEmail({
          firstName: chef.firstName,
          email: chef.email,
          verifyUrl,
        });
      } catch (error) {
        console.error("Failed to send chef approval email:", error);
      }
    }

    const payload = await User.findById(chef._id)
      .select("-password")
      .populate("chefDetails.chefLevel", "name description");

    return res.status(200).json({
      success: true,
      message: "Chef status updated",
      payload,
    });
  } catch (error) {
    console.error("Update Chef Status Error:", error);
    return res.status(500).json({ success: false, message: "Error updating chef status", error });
  }
};

// ✅ Disable Chef (ADMIN only)
export const disableChef = async (req: Request, res: Response): Promise<any> => {
  try {
    const chef = await User.findOneAndUpdate(
      { _id: req.params.id, userType: "Chef" },
      { isActive: false },
      { new: true }
    );

    if (!chef) {
      return res.status(404).json({ message: "Chef not found" });
    }

    res.status(200).json({
      message: "Chef has been disabled",
      chef
    });

  } catch (error) {
    res.status(500).json({ message: "Error disabling chef", error });
  }
};



// ✅ Delete Chef (ADMIN only)
export const deleteChef = async (req: Request, res: Response): Promise<any> => {
  try {
    const chef = await User.findOneAndDelete({ _id: req.params.id, userType: "Chef" });

    if (!chef) {
      return res.status(404).json({ message: "Chef not found" });
    }

    res.status(200).json({
      message: "Chef deleted permanently",
    });

  } catch (error) {
    res.status(500).json({ message: "Error deleting chef", error });
  }
};

// Controller function to check chef availability
export const checkChefAvailability = async (req: Request, res: Response): Promise<any> => {
  try {

    const { chefId, startDate, endDate } = req.body;

    if (!chefId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "chefId, startDate and endDate are required"
      });
    }

    const available = await isChefAvailable(
      chefId,
      new Date(startDate),
      new Date(endDate)
    );

    if (!available) {
      return res.status(409).json({
        success: false,
        message: "Chef is not available for the selected dates"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Chef is available"
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: "Server error",
      error
    });

  }
};
