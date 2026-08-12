import { Request, Response } from "express";
import UserModel, { IUser } from "../../models/User.model";
import { BookingModel } from "../../models/Booking";
import { sendAdminCreationEmail } from "../../services/email/rentAChef/adminEmailNotification";
import {
  ACTIVE_BOOKING_STATUSES,
  CLOSED_BOOKING_STATUSES,
  bestEffortBookingDate,
  bestEffortGuestCount,
  minorToNaira,
} from "../../utils/bookingStatus";

/** Flattens an admin user document into the shape the admin dashboard consumes. */
const toAdminPayload = (admin: IUser) => ({
  id: admin._id,
  fullName: admin.fullName,
  email: admin.email,
  role: admin.adminDetails?.role,
  isActive: admin.isActive,
});

export const createAdmin = async (req: Request, res: Response): Promise<any> => {
  try {
    const { fullName, email, password, role } = req.body;

    const existingAdmin = await UserModel.findOne({ email });
    if (existingAdmin)
      return res.status(400).json({ success: false, message: "Admin already exists" });

    const firstName = fullName?.trim().split(" ")[0];

    const admin = await UserModel.create({
      fullName,
      firstName,
      email,
      password,
      userType: "Admin",
      adminDetails: { role: role || "admin" },
      isActive: true
    });

    try {
      await sendAdminCreationEmail({
        email,
        fullName: admin.fullName,
        firstName,
        role: admin.adminDetails?.role || "admin",
      });
    } catch (error) {
      console.log(error);
    }

    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      payload: toAdminPayload(admin)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create admin", error });
  }
};


export const getAdmins = async (req: Request, res: Response): Promise<any> => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const [admins, total] = await Promise.all([
      UserModel.find({ userType: "Admin" })
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      UserModel.countDocuments({ userType: "Admin" }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Admins fetched successfully",
      payload: admins.map(toAdminPayload),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch admins",
      error,
    });
  }
};

export const getAdminById = async (req: Request, res: Response): Promise<any> => {
  try {
    const admin = await UserModel.findOne({ _id: req.params.id, userType: "Admin" }).select("-password");

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Admin fetched successfully",
      payload: toAdminPayload(admin),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin",
      error,
    });
  }
};

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Percentage change from `previous` to `current`; null (not 0) when there's no prior-period baseline to compare against. */
const percentDelta = (current: number, previous: number): number | null => {
  if (!previous) return null;
  return Math.round((current - previous) / previous * 1000) / 10;
};

const monthRange = (monthsAgo: number): { start: Date; end: Date } => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 1, 0, 0, 0, 0);
  return { start, end };
};

export const getAdminDashboard = async (req: Request, res: Response): Promise<any> => {
  try {
    const thisMonth = monthRange(0);
    const lastMonth = monthRange(1);

    const [
      approvedChefs,
      pendingChefs,
      customers,
      customersThisMonth,
      customersLastMonth,
      activeBookings,
      activeBookingsThisMonth,
      activeBookingsLastMonth,
      revenueThisMonthAgg,
      revenueLastMonthAgg,
      revenueTrendAgg,
      approvalQueue,
      upcomingBookingsRaw,
    ] = await Promise.all([
      UserModel.countDocuments({ userType: "Chef", isActive: true }),
      UserModel.countDocuments({ userType: "Chef", isActive: false }),
      UserModel.countDocuments({ userType: "Customer" }),
      UserModel.countDocuments({ userType: "Customer", createdAt: { $gte: thisMonth.start, $lt: thisMonth.end } }),
      UserModel.countDocuments({ userType: "Customer", createdAt: { $gte: lastMonth.start, $lt: lastMonth.end } }),
      BookingModel.countDocuments({ status: { $in: ACTIVE_BOOKING_STATUSES } }),
      BookingModel.countDocuments({
        status: { $in: ACTIVE_BOOKING_STATUSES },
        createdAt: { $gte: thisMonth.start, $lt: thisMonth.end },
      }),
      BookingModel.countDocuments({
        status: { $in: ACTIVE_BOOKING_STATUSES },
        createdAt: { $gte: lastMonth.start, $lt: lastMonth.end },
      }),
      BookingModel.aggregate([
        { $match: { paymentStatus: "Paid", createdAt: { $gte: thisMonth.start, $lt: thisMonth.end } } },
        { $group: { _id: null, total: { $sum: { $ifNull: ["$pricingSnapshot.estimatedTotalMinor", 0] } } } },
      ]),
      BookingModel.aggregate([
        { $match: { paymentStatus: "Paid", createdAt: { $gte: lastMonth.start, $lt: lastMonth.end } } },
        { $group: { _id: null, total: { $sum: { $ifNull: ["$pricingSnapshot.estimatedTotalMinor", 0] } } } },
      ]),
      BookingModel.aggregate([
        { $match: { paymentStatus: "Paid", createdAt: { $gte: monthRange(5).start } } },
        {
          $group: {
            _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
            total: { $sum: { $ifNull: ["$pricingSnapshot.estimatedTotalMinor", 0] } },
          },
        },
      ]),
      UserModel.find({ userType: "Chef", isActive: false })
        .select("fullName profilePic createdAt")
        .sort({ createdAt: -1 })
        .limit(6),
      BookingModel.find({ status: { $nin: CLOSED_BOOKING_STATUSES } })
        .select("bookingNumber customerId chefId serviceId status pricingSnapshot startDate bookingData createdAt")
        .populate("customerId", "fullName")
        .populate("chefId", "fullName")
        .populate("serviceId", "name")
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    const revenueThisMonth = minorToNaira(revenueThisMonthAgg?.[0]?.total || 0);
    const revenueLastMonth = minorToNaira(revenueLastMonthAgg?.[0]?.total || 0);

    const trendByMonth = new Map<string, number>();
    for (const row of revenueTrendAgg as any[]) {
      trendByMonth.set(`${row._id.year}-${row._id.month}`, minorToNaira(row.total));
    }

    const revenueTrend: { month: string; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(thisMonth.start.getFullYear(), thisMonth.start.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      revenueTrend.push({ month: MONTH_NAMES[d.getMonth()], revenue: trendByMonth.get(key) || 0 });
    }

    return res.status(200).json({
      success: true,
      payload: {
        metrics: {
          grossRevenue: revenueTrend.reduce((sum, m) => sum + m.revenue, 0),
          revenueThisMonth,
          revenueDeltaPct: percentDelta(revenueThisMonth, revenueLastMonth),
          activeBookings,
          activeBookingsDeltaPct: percentDelta(activeBookingsThisMonth, activeBookingsLastMonth),
          approvedChefs,
          pendingChefs,
          customers,
          newCustomersDeltaPct: percentDelta(customersThisMonth, customersLastMonth),
        },
        revenueTrend,
        approvalQueue: approvalQueue.map((chef: any) => ({
          id: chef._id,
          name: chef.fullName,
          avatar: chef.profilePic || "",
          joinedAt: chef.createdAt,
        })),
        upcomingBookings: upcomingBookingsRaw.map((booking: any) => ({
          id: booking._id,
          bookingNumber: booking.bookingNumber,
          customerName: booking.customerId?.fullName || "Unassigned",
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
    console.error("Admin Dashboard Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin dashboard",
      error,
    });
  }
};

/**
 * =====================
 * UPDATE ADMIN
 * =====================
 */
export const updateAdmin = async (req: Request, res: Response): Promise<any> => {
  try {
    const { fullName, email, role, isActive, password } = req.body;

    const admin = await UserModel.findOne({ _id: req.params.id, userType: "Admin" });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    if (fullName !== undefined) admin.fullName = fullName;
    if (email !== undefined) admin.email = email;
    if (role !== undefined) admin.adminDetails = { ...admin.adminDetails, role };
    if (isActive !== undefined) admin.isActive = isActive;

    // Allow password update (will be hashed by pre-save hook)
    if (password) {
      admin.password = password;
    }

    await admin.save();

    return res.status(200).json({
      success: true,
      message: "Admin updated successfully",
      payload: toAdminPayload(admin),
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update admin",
      error,
    });
  }
};

/**
 * =====================
 * DELETE ADMIN
 * =====================
 */
export const deleteAdmin = async (req: Request, res: Response): Promise<any> => {
  try {
    const admin = await UserModel.findOneAndDelete({ _id: req.params.id, userType: "Admin" });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Admin deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete admin",
      error,
    });
  }
};
