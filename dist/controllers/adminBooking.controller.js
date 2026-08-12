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
exports.addAdminBookingPayment = exports.addAdminBookingComment = exports.assignAdminBookingChef = exports.updateAdminBookingStatus = exports.getAdminBookings = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Booking_1 = require("../models/Booking");
const User_model_1 = __importDefault(require("../models/User.model"));
const enums_1 = require("../platform/domain/enums");
const bookingStatus_1 = require("../utils/bookingStatus");
const bookingEmailNotifications_1 = require("../services/email/rentAChef/bookingEmailNotifications");
const firstNameOf = (fullName) => (fullName || "there").trim().split(" ")[0];
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Admin-wide, filterable booking list. */
const getAdminBookings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.max(Number(req.query.limit) || 10, 1);
        const skip = (page - 1) * limit;
        const status = req.query.status;
        const paymentStatus = req.query.paymentStatus;
        const search = (_a = req.query.search) === null || _a === void 0 ? void 0 : _a.trim();
        const filter = {};
        if (status && status !== "all")
            filter.status = status;
        if (paymentStatus && paymentStatus !== "all")
            filter.paymentStatus = paymentStatus;
        if (search) {
            const regex = new RegExp(escapeRegex(search), "i");
            const matchingUsers = yield User_model_1.default.find({
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
        const [bookings, total, statusCountsAgg] = yield Promise.all([
            Booking_1.BookingModel.find(filter)
                .select("bookingNumber customerId chefId serviceId workflow status paymentStatus pricingSnapshot startDate bookingData createdAt")
                .populate("customerId", "fullName")
                .populate("chefId", "fullName")
                .populate("serviceId", "name")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Booking_1.BookingModel.countDocuments(filter),
            // Unfiltered global breakdown — powers the per-status count cards regardless of the active filter.
            Booking_1.BookingModel.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
        ]);
        const statusCounts = {};
        for (const row of statusCountsAgg) {
            statusCounts[row._id] = row.count;
        }
        return res.status(200).json({
            success: true,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1, statusCounts },
            payload: bookings.map((b) => {
                var _a, _b, _c, _d;
                return ({
                    id: b._id,
                    bookingNumber: b.bookingNumber,
                    customerName: ((_a = b.customerId) === null || _a === void 0 ? void 0 : _a.fullName) || "Unassigned",
                    chefName: ((_b = b.chefId) === null || _b === void 0 ? void 0 : _b.fullName) || "Unassigned",
                    serviceName: ((_c = b.serviceId) === null || _c === void 0 ? void 0 : _c.name) || "—",
                    workflow: b.workflow,
                    status: b.status,
                    paymentStatus: b.paymentStatus,
                    date: (0, bookingStatus_1.bestEffortBookingDate)(b),
                    guests: (0, bookingStatus_1.bestEffortGuestCount)(b.bookingData),
                    amount: (0, bookingStatus_1.minorToNaira)(((_d = b.pricingSnapshot) === null || _d === void 0 ? void 0 : _d.estimatedTotalMinor) || 0),
                    createdAt: b.createdAt,
                });
            }),
        });
    }
    catch (error) {
        console.error("Get Admin Bookings Error:", error);
        return res.status(500).json({ success: false, message: "Error fetching bookings", error });
    }
});
exports.getAdminBookings = getAdminBookings;
/** Free-form status move — the mock UI this replaces let admins set any status directly, so this keeps that behaviour rather than gating on the state machine's declared transitions. */
const updateAdminBookingStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid booking ID" });
        }
        if (!status || !Object.values(enums_1.BookingStatus).includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }
        const booking = yield Booking_1.BookingModel.findById(id);
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }
        const actorId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) ? String(req.user._id) : "ADMIN";
        booking.status = status;
        booking.timeline = booking.timeline || [];
        booking.timeline.push({ status, changedBy: actorId, changedAt: new Date() });
        yield booking.save();
        // "Admin Reviewed" is the closest thing this system has to an explicit "approved" status.
        if (status === enums_1.BookingStatus.ADMIN_REVIEW && booking.customerId) {
            const customer = yield User_model_1.default.findById(booking.customerId).select("fullName email");
            if (customer === null || customer === void 0 ? void 0 : customer.email) {
                yield (0, bookingEmailNotifications_1.sendBookingNotificationEmail)({
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
    }
    catch (error) {
        console.error("Update Admin Booking Status Error:", error);
        return res.status(500).json({ success: false, message: "Error updating booking status", error });
    }
});
exports.updateAdminBookingStatus = updateAdminBookingStatus;
/** Admin-driven manual chef assignment — lets an admin pick a specific chef rather than relying on auto-assignment. */
const assignAdminBookingChef = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const { chefId } = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid booking ID" });
        }
        if (!chefId || !mongoose_1.default.Types.ObjectId.isValid(chefId)) {
            return res.status(400).json({ success: false, message: "A valid chefId is required" });
        }
        const chef = yield User_model_1.default.findById(chefId).select("fullName userType email");
        if (!chef || chef.userType !== "Chef") {
            return res.status(404).json({ success: false, message: "Chef not found" });
        }
        const booking = yield Booking_1.BookingModel.findById(id);
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }
        const actorId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) ? String(req.user._id) : "ADMIN";
        booking.chefId = chef._id;
        booking.status = enums_1.BookingStatus.CHEF_ASSIGNED;
        booking.timeline = booking.timeline || [];
        booking.timeline.push({
            status: enums_1.BookingStatus.CHEF_ASSIGNED,
            changedBy: actorId,
            changedAt: new Date(),
            reason: `Chef ${chef.fullName} manually assigned by admin`,
        });
        yield booking.save();
        if (chef.email) {
            yield (0, bookingEmailNotifications_1.sendBookingNotificationEmail)({
                firstName: firstNameOf(chef.fullName),
                email: chef.email,
                heading: "A new booking has been assigned to you",
                message: "A new booking has been assigned to you, kindly login to your account to see the details of the booking.",
                bookingNumber: booking.bookingNumber,
            });
        }
        if (booking.customerId) {
            const customer = yield User_model_1.default.findById(booking.customerId).select("fullName email");
            if (customer === null || customer === void 0 ? void 0 : customer.email) {
                yield (0, bookingEmailNotifications_1.sendBookingNotificationEmail)({
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
    }
    catch (error) {
        console.error("Assign Admin Booking Chef Error:", error);
        return res.status(500).json({ success: false, message: "Error assigning chef", error });
    }
});
exports.assignAdminBookingChef = assignAdminBookingChef;
/** Admin note left on a booking — a lightweight comment thread, not customer/chef-facing. */
const addAdminBookingComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { text } = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid booking ID" });
        }
        if (!text || !text.trim()) {
            return res.status(400).json({ success: false, message: "Comment text is required" });
        }
        const booking = yield Booking_1.BookingModel.findById(id);
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }
        const actor = req.user;
        const comment = {
            text: text.trim(),
            authorId: (actor === null || actor === void 0 ? void 0 : actor._id) ? String(actor._id) : "ADMIN",
            authorName: (actor === null || actor === void 0 ? void 0 : actor.fullName) || "Admin",
            createdAt: new Date(),
        };
        booking.comments = booking.comments || [];
        booking.comments.push(comment);
        yield booking.save();
        if (booking.customerId) {
            const customer = yield User_model_1.default.findById(booking.customerId).select("fullName email");
            if (customer === null || customer === void 0 ? void 0 : customer.email) {
                yield (0, bookingEmailNotifications_1.sendBookingNotificationEmail)({
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
    }
    catch (error) {
        console.error("Add Admin Booking Comment Error:", error);
        return res.status(500).json({ success: false, message: "Error adding comment", error });
    }
});
exports.addAdminBookingComment = addAdminBookingComment;
const PAYMENT_MODES = ["Cash", "Transfer"];
/** Admin-recorded manual payment (cash or bank transfer collected outside Paystack) — marks the booking paid. */
const addAdminBookingPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const { transactionRef, mode, bankName, accountNumber, amount, date } = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid booking ID" });
        }
        if (!transactionRef || !transactionRef.trim()) {
            return res.status(400).json({ success: false, message: "Transaction reference is required" });
        }
        if (!mode || !PAYMENT_MODES.includes(mode)) {
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
        const booking = yield Booking_1.BookingModel.findById(id);
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }
        const actorId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) ? String(req.user._id) : "ADMIN";
        booking.paymentStatus = enums_1.PaymentStatus.PAID;
        booking.modeOfPayment = mode;
        booking.transactnRef = transactionRef.trim();
        booking.paymentDetails = {
            mode: mode,
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
        yield booking.save();
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
    }
    catch (error) {
        console.error("Add Admin Booking Payment Error:", error);
        return res.status(500).json({ success: false, message: "Error recording payment", error });
    }
});
exports.addAdminBookingPayment = addAdminBookingPayment;
