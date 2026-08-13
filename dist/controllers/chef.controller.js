"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.checkChefAvailability = exports.deleteChef = exports.disableChef = exports.updateChefStatus = exports.updateChef = exports.getChefBookings = exports.getChefDashboard = exports.getChefById = exports.getAllChefs = exports.createChef = void 0;
const User_model_1 = __importDefault(require("../models/User.model"));
const mongoose_1 = __importDefault(require("mongoose"));
const chefsEmailNotification_1 = require("../services/email/rentAChef/chefsEmailNotification");
const ChefService_1 = require("../models/ChefService");
const Booking_1 = require("../models/Booking");
const checkChefAvailability_1 = require("../utils/checkChefAvailability");
const Menu_1 = __importDefault(require("../models/Menu"));
const otpUtils_1 = require("../utils/otpUtils");
const auth_service_1 = require("../services/auth/auth.service");
const bookingStatus_1 = require("../utils/bookingStatus");
/**
 * Services offered live in the ChefService collection, not on
 * `chefDetails.servicesOffered` — this resolves the real assigned services for a
 * batch of chefs and stitches them onto each chef's JSON so admin list/edit views
 * (which only look at `chefDetails.servicesOffered`) see the actual selection.
 */
const attachServicesOffered = (chefs) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const chefIds = chefs.map((c) => c._id);
    const chefServices = yield ChefService_1.ChefService.find({ chefId: { $in: chefIds }, isAvailable: true }).lean();
    const servicesByChef = new Map();
    for (const cs of chefServices) {
        const key = cs.chefId.toString();
        const list = (_a = servicesByChef.get(key)) !== null && _a !== void 0 ? _a : [];
        list.push(cs.serviceId.toString());
        servicesByChef.set(key, list);
    }
    return chefs.map((c) => {
        var _a;
        const obj = typeof c.toJSON === "function" ? c.toJSON() : c;
        obj.chefDetails = Object.assign(Object.assign({}, (obj.chefDetails || {})), { servicesOffered: (_a = servicesByChef.get(c._id.toString())) !== null && _a !== void 0 ? _a : [] });
        return obj;
    });
});
const createChef = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const chefPic = req.file; // multer file
        const { name, gender, email, phone, bio, dob, specialties, stateId, stateName, city, defaultPassword, yearsOfExperience, chefLevel, servicesOffered } = req.body;
        const staffId = (0, otpUtils_1.generateStaffId)();
        const fullName = name.trim();
        const firstName = fullName.split(" ")[0];
        const phoneNumber = (0, otpUtils_1.formatNigerianPhoneNumber)(phone);
        // console.log({ adminSent: req.body });
        if (!staffId || !fullName || !email || !city || !stateId || !phone) {
            return res.status(400).json({ message: "city, state, phone number, name & email are required" });
        }
        // Check if chef already exists
        const exists = yield User_model_1.default.findOne({ $or: [{ email }, { "chefDetails.staffId": staffId }] });
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
        const chef = yield User_model_1.default.create({
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
            profilePic: (chefPic === null || chefPic === void 0 ? void 0 : chefPic.location) || (chefPic === null || chefPic === void 0 ? void 0 : chefPic.path) || "", // depending on S3 or local
        });
        try {
            yield (0, chefsEmailNotification_1.sendChefCreationSuccessEmail)({
                email,
                firstName: fullName,
                password: pass,
            });
        }
        catch (error) {
            console.log(error);
        }
        // After creating chef, optionally create ChefService entries if serviceId(s) provided
        try {
            const { serviceId, serviceIds, isAvailable } = req.body;
            const ids = Array.isArray(serviceIds) ? serviceIds : (serviceId ? [serviceId] : []);
            let createdServices = [];
            let dupCount = 0;
            if (ids.length > 0) {
                const results = yield Promise.allSettled(ids.map((sid) => ChefService_1.ChefService.create({ chefId: chef._id, serviceId: sid, isAvailable: isAvailable !== null && isAvailable !== void 0 ? isAvailable : true })));
                createdServices = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
                dupCount = results.filter((r) => r.status === 'rejected' && r.reason && r.reason.code === 11000).length;
            }
            const [payload] = yield attachServicesOffered([chef]);
            return res.status(201).json({
                success: true,
                message: "Chef created successfully",
                payload,
                defaultPassword: pass,
                chefServicesCreated: createdServices,
                chefServicesDuplicatesSkipped: dupCount
            });
        }
        catch (err) {
            console.warn('Failed to create chef services:', err);
            return res.status(201).json({
                success: true,
                message: "Chef created successfully (services creation failed)",
                payload: chef,
                defaultPassword: pass
            });
        }
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error creating chef", error });
    }
});
exports.createChef = createChef;
const getAllChefs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Pagination
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.max(Number(req.query.limit) || 10, 1);
        const skip = (page - 1) * limit;
        // Filters
        const getQueryValue = (...keys) => {
            for (const key of keys) {
                const raw = req.query[key];
                const value = Array.isArray(raw) ? raw[0] : raw;
                if (value !== undefined && value !== null) {
                    const trimmed = String(value).trim();
                    if (trimmed)
                        return trimmed;
                }
            }
            return undefined;
        };
        const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const city = getQueryValue("location", "lga", "city", "long", "lat");
        const state = getQueryValue("state", "stateName");
        const isActiveQuery = getQueryValue("isActive", "active");
        const name = getQueryValue("name", "search", "q");
        const filter = { userType: "Chef" };
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
            }
            else if (["false", "0", "no"].includes(normalizedActive)) {
                filter.isActive = false;
            }
        }
        // 🔍 Search by chef name (case-insensitive, partial match)
        if (name) {
            filter.fullName = { $regex: escapeRegex(name), $options: "i" };
        }
        // Query
        const [chefs, total] = yield Promise.all([
            User_model_1.default.find(filter)
                .select("-password")
                .populate("chefDetails.chefLevel", "name description")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            User_model_1.default.countDocuments(filter),
        ]);
        const payload = yield attachServicesOffered(chefs);
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
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching chefs",
            payload: error,
        });
    }
});
exports.getAllChefs = getAllChefs;
// ✅ Get one chef
const getChefById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({ success: false, message: "Invalid ID" });
            return;
        }
        const chef = yield User_model_1.default.findOne({ _id: id, userType: "Chef" })
            .select("-password") // ✅ exclude password
            .populate("chefDetails.chefLevel", "name description");
        if (!chef) {
            res.status(404).json({ success: false, message: "Chef not found" });
            return;
        }
        // compute booking counts
        const [totalChefBooking, totalCompletedBooking, totalUpcoming] = yield Promise.all([
            Booking_1.BookingModel.countDocuments({ chefId: id }),
            Booking_1.BookingModel.countDocuments({ chefId: id, status: 'Completed' }),
            Booking_1.BookingModel.countDocuments({ chefId: id, status: { $nin: bookingStatus_1.CLOSED_BOOKING_STATUSES } }),
        ]);
        // fetch recent menus for this chef (last 3)
        const getTheChefMenu = yield Menu_1.default.find({ chefId: id }).sort({ createdAt: -1 }).limit(3).lean();
        // fetch services offered via ChefService
        const { ChefService } = yield Promise.resolve().then(() => __importStar(require('../models/ChefService')));
        const services = yield ChefService.find({ chefId: id, isAvailable: true }).populate('serviceId', 'name').lean();
        const servicesOffered = services.map((s) => { var _a, _b; return ({ id: ((_a = s.serviceId) === null || _a === void 0 ? void 0 : _a._id) || s.serviceId, name: ((_b = s.serviceId) === null || _b === void 0 ? void 0 : _b.name) || s.serviceId }); });
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching chef",
            error,
        });
    }
});
exports.getChefById = getChefById;
// ✅ Chef's own dashboard summary (auth required — reads the logged-in chef)
const getChefDashboard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const chefId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const [jobsCompleted, upcomingBookingsCount, menusCreated, upcomingBookingsRaw] = yield Promise.all([
            Booking_1.BookingModel.countDocuments({ chefId, status: "Completed" }),
            Booking_1.BookingModel.countDocuments({ chefId, status: { $nin: bookingStatus_1.CLOSED_BOOKING_STATUSES } }),
            Menu_1.default.countDocuments({ chefId }),
            Booking_1.BookingModel.find({ chefId, status: { $nin: bookingStatus_1.CLOSED_BOOKING_STATUSES } })
                .select("bookingNumber customerId serviceId status pricingSnapshot startDate bookingData createdAt")
                .populate("customerId", "fullName")
                .populate("serviceId", "name")
                .sort({ createdAt: -1 })
                .limit(5),
        ]);
        const chef = req.user;
        return res.status(200).json({
            success: true,
            payload: {
                metrics: {
                    upcomingBookings: upcomingBookingsCount,
                    jobsCompleted,
                    rating: ((_b = chef === null || chef === void 0 ? void 0 : chef.chefDetails) === null || _b === void 0 ? void 0 : _b.rating) || 0,
                    menusCreated,
                },
                upcomingBookings: upcomingBookingsRaw.map((booking) => {
                    var _a, _b, _c;
                    return ({
                        id: booking._id,
                        bookingNumber: booking.bookingNumber,
                        customerName: ((_a = booking.customerId) === null || _a === void 0 ? void 0 : _a.fullName) || "Unassigned",
                        serviceName: ((_b = booking.serviceId) === null || _b === void 0 ? void 0 : _b.name) || "—",
                        date: (0, bookingStatus_1.bestEffortBookingDate)(booking),
                        guests: (0, bookingStatus_1.bestEffortGuestCount)(booking.bookingData),
                        amount: (0, bookingStatus_1.minorToNaira)(((_c = booking.pricingSnapshot) === null || _c === void 0 ? void 0 : _c.estimatedTotalMinor) || 0),
                        status: booking.status,
                    });
                }),
            },
        });
    }
    catch (error) {
        console.error("Chef Dashboard Error:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching chef dashboard",
            error,
        });
    }
});
exports.getChefDashboard = getChefDashboard;
// ✅ Chef's own booking list (auth required — scoped to the logged-in chef)
const getChefBookings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const chefId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.max(Number(req.query.limit) || 10, 1);
        const skip = (page - 1) * limit;
        const status = req.query.status;
        const filter = { chefId };
        if (status && status !== "all")
            filter.status = status;
        const [bookings, total] = yield Promise.all([
            Booking_1.BookingModel.find(filter)
                .select("bookingNumber customerId serviceId workflow status paymentStatus pricingSnapshot startDate bookingData createdAt")
                .populate("customerId", "fullName")
                .populate("serviceId", "name")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Booking_1.BookingModel.countDocuments(filter),
        ]);
        return res.status(200).json({
            success: true,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
            payload: bookings.map((b) => {
                var _a, _b, _c;
                return ({
                    id: b._id,
                    bookingNumber: b.bookingNumber,
                    customerName: ((_a = b.customerId) === null || _a === void 0 ? void 0 : _a.fullName) || "Unassigned",
                    serviceName: ((_b = b.serviceId) === null || _b === void 0 ? void 0 : _b.name) || "—",
                    workflow: b.workflow,
                    status: b.status,
                    paymentStatus: b.paymentStatus,
                    date: (0, bookingStatus_1.bestEffortBookingDate)(b),
                    guests: (0, bookingStatus_1.bestEffortGuestCount)(b.bookingData),
                    amount: (0, bookingStatus_1.minorToNaira)(((_c = b.pricingSnapshot) === null || _c === void 0 ? void 0 : _c.estimatedTotalMinor) || 0),
                    createdAt: b.createdAt,
                });
            }),
        });
    }
    catch (error) {
        console.error("Get Chef Bookings Error:", error);
        return res.status(500).json({ success: false, message: "Error fetching bookings", error });
    }
});
exports.getChefBookings = getChefBookings;
// ✅ Update Chef (Admin OR Chef owner)
const updateChef = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        // ✅ Validate MongoDB ID
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid chef ID" });
        }
        /**
         * ✅ Whitelisted fields
         * Prevent updating sensitive fields like password, isActive, staffId, etc.
         * (password intentionally excluded — password changes must go through the
         * dedicated OTP flow so they're hashed correctly)
         *
         * A chef editing their own record (as opposed to an admin) gets a narrower
         * whitelist — email, rating, staffId and chefLevel stay admin-managed.
         */
        const isSelfEdit = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userType) === "Chef";
        const topLevelUpdates = isSelfEdit ?
            ["gender", "profilePic", "dob", "phoneNumber"] :
            ["gender", "email", "profilePic", "dob", "phoneNumber"];
        const chefDetailUpdates = isSelfEdit ?
            ["bio", "specialties", "yearsOfExperience"] :
            ["bio", "specialties", "rating", "staffId", "yearsOfExperience", "chefLevel"];
        const addressUpdates = ["stateId", "stateName", "city"];
        const updates = {};
        if (req.body.name !== undefined) {
            updates.fullName = req.body.name;
        }
        for (const key of topLevelUpdates) {
            if (req.body[key] !== undefined) {
                updates[key] = req.body[key];
            }
        }
        // ✅ Picture upload (multer-s3) takes precedence over any profilePic string in the body
        const chefPic = req.file;
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
        const chef = yield User_model_1.default.findOneAndUpdate({ _id: id, userType: "Chef" }, updates, {
            new: true,
            runValidators: true,
        }).select("-password");
        if (!chef) {
            return res.status(404).json({ success: false, message: "Chef not found" });
        }
        // Services offered live in the ChefService collection (see createChef) —
        // reconcile it here too, otherwise edits to "services offered" are silently dropped.
        const { serviceId, serviceIds } = req.body;
        const nextServiceIds = Array.isArray(serviceIds) ?
            serviceIds :
            serviceId ? [serviceId] : undefined;
        if (nextServiceIds !== undefined) {
            yield ChefService_1.ChefService.deleteMany({ chefId: chef._id, serviceId: { $nin: nextServiceIds } });
            yield Promise.allSettled(nextServiceIds.map((sid) => ChefService_1.ChefService.updateOne({ chefId: chef._id, serviceId: sid }, { $set: { isAvailable: true } }, { upsert: true })));
        }
        const [payload] = yield attachServicesOffered([chef]);
        return res.status(200).json({
            success: true,
            message: "Chef updated successfully",
            payload,
        });
    }
    catch (error) {
        console.error("Update Chef Error:", error);
        return res.status(500).json({
            success: false,
            message: "Error updating chef",
            error: error.message,
        });
    }
});
exports.updateChef = updateChef;
// ✅ Update chef approval status (ADMIN only)
const updateChefStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid chef ID" });
        }
        const allowedStatuses = ["pending", "approved", "suspended", "rejected"];
        if (!status || !allowedStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }
        const chef = yield User_model_1.default.findOne({ _id: id, userType: "Chef" });
        if (!chef) {
            return res.status(404).json({ success: false, message: "Chef not found" });
        }
        const isApproving = status === "approved";
        chef.isActive = isApproving;
        // Only issue a fresh verification link the first time a chef is approved —
        // a chef reinstated after suspension has already verified their email.
        const needsVerificationEmail = isApproving && !chef.isEmailVerified;
        if (needsVerificationEmail) {
            chef.emailVerificationOtp = (0, auth_service_1.generateEmailVerificationOtp)();
        }
        yield chef.save();
        if (needsVerificationEmail) {
            try {
                const verifyUrl = `${process.env.CLIENT_URL}/verify-email?email=${encodeURIComponent(chef.email)}&otp=${encodeURIComponent(chef.emailVerificationOtp || "")}`;
                yield (0, chefsEmailNotification_1.sendChefApprovedEmail)({
                    firstName: chef.firstName,
                    email: chef.email,
                    verifyUrl,
                });
            }
            catch (error) {
                console.error("Failed to send chef approval email:", error);
            }
        }
        const payload = yield User_model_1.default.findById(chef._id)
            .select("-password")
            .populate("chefDetails.chefLevel", "name description");
        return res.status(200).json({
            success: true,
            message: "Chef status updated",
            payload,
        });
    }
    catch (error) {
        console.error("Update Chef Status Error:", error);
        return res.status(500).json({ success: false, message: "Error updating chef status", error });
    }
});
exports.updateChefStatus = updateChefStatus;
// ✅ Disable Chef (ADMIN only)
const disableChef = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const chef = yield User_model_1.default.findOneAndUpdate({ _id: req.params.id, userType: "Chef" }, { isActive: false }, { new: true });
        if (!chef) {
            return res.status(404).json({ message: "Chef not found" });
        }
        res.status(200).json({
            message: "Chef has been disabled",
            chef
        });
    }
    catch (error) {
        res.status(500).json({ message: "Error disabling chef", error });
    }
});
exports.disableChef = disableChef;
// ✅ Delete Chef (ADMIN only)
const deleteChef = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const chef = yield User_model_1.default.findOneAndDelete({ _id: req.params.id, userType: "Chef" });
        if (!chef) {
            return res.status(404).json({ message: "Chef not found" });
        }
        res.status(200).json({
            message: "Chef deleted permanently",
        });
    }
    catch (error) {
        res.status(500).json({ message: "Error deleting chef", error });
    }
});
exports.deleteChef = deleteChef;
// Controller function to check chef availability
const checkChefAvailability = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { chefId, startDate, endDate } = req.body;
        if (!chefId || !startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: "chefId, startDate and endDate are required"
            });
        }
        const available = yield (0, checkChefAvailability_1.isChefAvailable)(chefId, new Date(startDate), new Date(endDate));
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
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error",
            error
        });
    }
});
exports.checkChefAvailability = checkChefAvailability;
