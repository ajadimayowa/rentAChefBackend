"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAdmin = exports.updateAdmin = exports.getAdminDashboard = exports.getAdminById = exports.getAdmins = exports.createAdmin = void 0;
const User_model_1 = __importDefault(require("../../models/User.model"));
const Booking_1 = require("../../models/Booking");
const adminEmailNotification_1 = require("../../services/email/rentAChef/adminEmailNotification");
const bookingStatus_1 = require("../../utils/bookingStatus");
/** Flattens an admin user document into the shape the admin dashboard consumes. */
const toAdminPayload = (admin) => {
    var _a;
    return ({
        id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        role: (_a = admin.adminDetails) === null || _a === void 0 ? void 0 : _a.role,
        isActive: admin.isActive,
    });
};
const createAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { fullName, email, password, role } = req.body;
        const existingAdmin = yield User_model_1.default.findOne({ email });
        if (existingAdmin)
            return res.status(400).json({ success: false, message: "Admin already exists" });
        const firstName = fullName === null || fullName === void 0 ? void 0 : fullName.trim().split(" ")[0];
        const admin = yield User_model_1.default.create({
            fullName,
            firstName,
            email,
            password,
            userType: "Admin",
            adminDetails: { role: role || "admin" },
            isActive: true
        });
        try {
            yield (0, adminEmailNotification_1.sendAdminCreationEmail)({
                email,
                fullName: admin.fullName,
                firstName,
                role: ((_a = admin.adminDetails) === null || _a === void 0 ? void 0 : _a.role) || "admin",
            });
        }
        catch (error) {
            console.log(error);
        }
        res.status(201).json({
            success: true,
            message: "Admin created successfully",
            payload: toAdminPayload(admin)
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Failed to create admin", error });
    }
});
exports.createAdmin = createAdmin;
const getAdmins = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.max(Number(req.query.limit) || 10, 1);
        const skip = (page - 1) * limit;
        const [admins, total] = yield Promise.all([
            User_model_1.default.find({ userType: "Admin" })
                .select("-password")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            User_model_1.default.countDocuments({ userType: "Admin" }),
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
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch admins",
            error,
        });
    }
});
exports.getAdmins = getAdmins;
const getAdminById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const admin = yield User_model_1.default.findOne({ _id: req.params.id, userType: "Admin" }).select("-password");
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
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch admin",
            error,
        });
    }
});
exports.getAdminById = getAdminById;
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** Percentage change from `previous` to `current`; null (not 0) when there's no prior-period baseline to compare against. */
const percentDelta = (current, previous) => {
    if (!previous)
        return null;
    return Math.round((current - previous) / previous * 1000) / 10;
};
const monthRange = (monthsAgo) => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 1, 0, 0, 0, 0);
    return { start, end };
};
const getAdminDashboard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const thisMonth = monthRange(0);
        const lastMonth = monthRange(1);
        const [approvedChefs, pendingChefs, customers, customersThisMonth, customersLastMonth, activeBookings, activeBookingsThisMonth, activeBookingsLastMonth, revenueThisMonthAgg, revenueLastMonthAgg, revenueTrendAgg, approvalQueue, upcomingBookingsRaw,] = yield Promise.all([
            User_model_1.default.countDocuments({ userType: "Chef", isActive: true }),
            User_model_1.default.countDocuments({ userType: "Chef", isActive: false }),
            User_model_1.default.countDocuments({ userType: "Customer" }),
            User_model_1.default.countDocuments({ userType: "Customer", createdAt: { $gte: thisMonth.start, $lt: thisMonth.end } }),
            User_model_1.default.countDocuments({ userType: "Customer", createdAt: { $gte: lastMonth.start, $lt: lastMonth.end } }),
            Booking_1.BookingModel.countDocuments({ status: { $in: bookingStatus_1.ACTIVE_BOOKING_STATUSES } }),
            Booking_1.BookingModel.countDocuments({
                status: { $in: bookingStatus_1.ACTIVE_BOOKING_STATUSES },
                createdAt: { $gte: thisMonth.start, $lt: thisMonth.end },
            }),
            Booking_1.BookingModel.countDocuments({
                status: { $in: bookingStatus_1.ACTIVE_BOOKING_STATUSES },
                createdAt: { $gte: lastMonth.start, $lt: lastMonth.end },
            }),
            Booking_1.BookingModel.aggregate([
                { $match: { paymentStatus: "Paid", createdAt: { $gte: thisMonth.start, $lt: thisMonth.end } } },
                { $group: { _id: null, total: { $sum: { $ifNull: ["$pricingSnapshot.estimatedTotalMinor", 0] } } } },
            ]),
            Booking_1.BookingModel.aggregate([
                { $match: { paymentStatus: "Paid", createdAt: { $gte: lastMonth.start, $lt: lastMonth.end } } },
                { $group: { _id: null, total: { $sum: { $ifNull: ["$pricingSnapshot.estimatedTotalMinor", 0] } } } },
            ]),
            Booking_1.BookingModel.aggregate([
                { $match: { paymentStatus: "Paid", createdAt: { $gte: monthRange(5).start } } },
                {
                    $group: {
                        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
                        total: { $sum: { $ifNull: ["$pricingSnapshot.estimatedTotalMinor", 0] } },
                    },
                },
            ]),
            User_model_1.default.find({ userType: "Chef", isActive: false })
                .select("fullName profilePic createdAt")
                .sort({ createdAt: -1 })
                .limit(6),
            Booking_1.BookingModel.find({ status: { $nin: bookingStatus_1.CLOSED_BOOKING_STATUSES } })
                .select("bookingNumber customerId chefId serviceId status pricingSnapshot startDate bookingData createdAt")
                .populate("customerId", "fullName")
                .populate("chefId", "fullName")
                .populate("serviceId", "name")
                .sort({ createdAt: -1 })
                .limit(5),
        ]);
        const revenueThisMonth = (0, bookingStatus_1.minorToNaira)(((_a = revenueThisMonthAgg === null || revenueThisMonthAgg === void 0 ? void 0 : revenueThisMonthAgg[0]) === null || _a === void 0 ? void 0 : _a.total) || 0);
        const revenueLastMonth = (0, bookingStatus_1.minorToNaira)(((_b = revenueLastMonthAgg === null || revenueLastMonthAgg === void 0 ? void 0 : revenueLastMonthAgg[0]) === null || _b === void 0 ? void 0 : _b.total) || 0);
        const trendByMonth = new Map();
        for (const row of revenueTrendAgg) {
            trendByMonth.set(`${row._id.year}-${row._id.month}`, (0, bookingStatus_1.minorToNaira)(row.total));
        }
        const revenueTrend = [];
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
                approvalQueue: approvalQueue.map((chef) => ({
                    id: chef._id,
                    name: chef.fullName,
                    avatar: chef.profilePic || "",
                    joinedAt: chef.createdAt,
                })),
                upcomingBookings: upcomingBookingsRaw.map((booking) => {
                    var _a, _b, _c, _d;
                    return ({
                        id: booking._id,
                        bookingNumber: booking.bookingNumber,
                        customerName: ((_a = booking.customerId) === null || _a === void 0 ? void 0 : _a.fullName) || "Unassigned",
                        chefName: ((_b = booking.chefId) === null || _b === void 0 ? void 0 : _b.fullName) || "Unassigned",
                        serviceName: ((_c = booking.serviceId) === null || _c === void 0 ? void 0 : _c.name) || "—",
                        date: (0, bookingStatus_1.bestEffortBookingDate)(booking),
                        guests: (0, bookingStatus_1.bestEffortGuestCount)(booking.bookingData),
                        amount: (0, bookingStatus_1.minorToNaira)(((_d = booking.pricingSnapshot) === null || _d === void 0 ? void 0 : _d.estimatedTotalMinor) || 0),
                        status: booking.status,
                    });
                }),
            },
        });
    }
    catch (error) {
        console.error("Admin Dashboard Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch admin dashboard",
            error,
        });
    }
});
exports.getAdminDashboard = getAdminDashboard;
/**
 * =====================
 * UPDATE ADMIN
 * =====================
 */
const updateAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fullName, email, role, isActive, password } = req.body;
        const admin = yield User_model_1.default.findOne({ _id: req.params.id, userType: "Admin" });
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found",
            });
        }
        if (fullName !== undefined)
            admin.fullName = fullName;
        if (email !== undefined)
            admin.email = email;
        if (role !== undefined)
            admin.adminDetails = Object.assign(Object.assign({}, admin.adminDetails), { role });
        if (isActive !== undefined)
            admin.isActive = isActive;
        // Allow password update (will be hashed by pre-save hook)
        if (password) {
            admin.password = password;
        }
        yield admin.save();
        return res.status(200).json({
            success: true,
            message: "Admin updated successfully",
            payload: toAdminPayload(admin),
        });
    }
    catch (error) {
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
});
exports.updateAdmin = updateAdmin;
/**
 * =====================
 * DELETE ADMIN
 * =====================
 */
const deleteAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const admin = yield User_model_1.default.findOneAndDelete({ _id: req.params.id, userType: "Admin" });
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
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to delete admin",
            error,
        });
    }
});
exports.deleteAdmin = deleteAdmin;
