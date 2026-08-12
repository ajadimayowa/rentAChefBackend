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
exports.updateBioData = exports.updateLocation = exports.updateNok = exports.updateHealthInformation = exports.completeKyc = exports.updateProfilePic = exports.getUserBookings = exports.getUserDashboard = exports.getUserById = exports.updateUserActiveStatus = exports.getAllUsers = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const User_model_1 = __importDefault(require("../../models/User.model"));
const Booking_1 = require("../../models/Booking");
const bookingStatus_1 = require("../../utils/bookingStatus");
const getAllUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = 1, limit = 10, search = "", userType, isActive } = req.query;
        const pageNum = Math.max(parseInt(page, 10), 1);
        const limitNum = Math.max(parseInt(limit, 10), 1);
        const skip = (pageNum - 1) * limitNum;
        const query = {};
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
        const [total, users] = yield Promise.all([
            User_model_1.default.countDocuments(query),
            User_model_1.default.find(query)
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching users",
            error,
        });
    }
});
exports.getAllUsers = getAllUsers;
/** Admin toggle for a user's active flag — e.g. suspending or reinstating a customer account. There's no separate pending/rejected state on the schema, just isActive. */
const updateUserActiveStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid user ID" });
        }
        if (typeof isActive !== "boolean") {
            return res.status(400).json({ success: false, message: "isActive must be a boolean" });
        }
        const user = yield User_model_1.default.findByIdAndUpdate(id, { isActive }, { new: true });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        return res.status(200).json({
            success: true,
            message: "User status updated",
            data: user,
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Error updating user status", error });
    }
});
exports.updateUserActiveStatus = updateUserActiveStatus;
// Get single user by ID
const getUserById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({ message: "Invalid user ID" });
            return;
        }
        const user = yield User_model_1.default.findById(id).select("-profile.password");
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        res.status(200).json({
            success: true,
            message: "User retrieved successfully",
            payload: user,
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Error fetching user",
            error,
        });
    }
});
exports.getUserById = getUserById;
/** Customer's own dashboard summary — booking counts, lifetime spend, and upcoming bookings. */
const getUserDashboard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({ message: "Invalid user ID" });
            return;
        }
        const requester = req.user;
        const isOwner = requester && String(requester._id) === id;
        const isAdmin = (requester === null || requester === void 0 ? void 0 : requester.userType) === "Admin";
        if (!isOwner && !isAdmin) {
            res.status(403).json({ message: "You can only view your own dashboard" });
            return;
        }
        const user = yield User_model_1.default.findOne({ _id: id, userType: "Customer" }).select("-password");
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        const [totalBookings, upcomingBookingsCount, spendAgg, upcomingBookingsRaw] = yield Promise.all([
            Booking_1.BookingModel.countDocuments({ customerId: id }),
            Booking_1.BookingModel.countDocuments({ customerId: id, status: { $nin: bookingStatus_1.CLOSED_BOOKING_STATUSES } }),
            Booking_1.BookingModel.aggregate([
                { $match: { customerId: new mongoose_1.default.Types.ObjectId(id), paymentStatus: "Paid" } },
                { $group: { _id: null, total: { $sum: { $ifNull: ["$pricingSnapshot.estimatedTotalMinor", 0] } } } },
            ]),
            Booking_1.BookingModel.find({ customerId: id, status: { $nin: bookingStatus_1.CLOSED_BOOKING_STATUSES } })
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
                    lifetimeSpend: (0, bookingStatus_1.minorToNaira)(((_a = spendAgg === null || spendAgg === void 0 ? void 0 : spendAgg[0]) === null || _a === void 0 ? void 0 : _a.total) || 0),
                },
                upcomingBookings: upcomingBookingsRaw.map((booking) => {
                    var _a, _b, _c;
                    return ({
                        id: booking._id,
                        bookingNumber: booking.bookingNumber,
                        chefName: ((_a = booking.chefId) === null || _a === void 0 ? void 0 : _a.fullName) || "Unassigned",
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
        res.status(500).json({
            message: "Error fetching user dashboard",
            error,
        });
    }
});
exports.getUserDashboard = getUserDashboard;
/** Customer's own booking list (ownership-checked — same rule as getUserDashboard). */
const getUserBookings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({ message: "Invalid user ID" });
            return;
        }
        const requester = req.user;
        const isOwner = requester && String(requester._id) === id;
        const isAdmin = (requester === null || requester === void 0 ? void 0 : requester.userType) === "Admin";
        if (!isOwner && !isAdmin) {
            res.status(403).json({ message: "You can only view your own bookings" });
            return;
        }
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.max(Number(req.query.limit) || 10, 1);
        const skip = (page - 1) * limit;
        const status = req.query.status;
        const filter = { customerId: id };
        if (status && status !== "all")
            filter.status = status;
        const [bookings, total] = yield Promise.all([
            Booking_1.BookingModel.find(filter)
                .select("bookingNumber chefId serviceId workflow status paymentStatus pricingSnapshot startDate bookingData createdAt")
                .populate("chefId", "fullName")
                .populate("serviceId", "name")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Booking_1.BookingModel.countDocuments(filter),
        ]);
        res.status(200).json({
            message: "Bookings retrieved successfully",
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
            payload: bookings.map((b) => {
                var _a, _b, _c;
                return ({
                    id: b._id,
                    bookingNumber: b.bookingNumber,
                    chefName: ((_a = b.chefId) === null || _a === void 0 ? void 0 : _a.fullName) || "Unassigned",
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
        res.status(500).json({
            message: "Error fetching bookings",
            error,
        });
    }
});
exports.getUserBookings = getUserBookings;
// Update Profile Picture
const updateProfilePic = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params; // Assuming userId is passed in the URL
    const profilePic = req.file; // multer file
    if (!profilePic) {
        return res.status(400).json({ message: 'Profile picture is required' });
    }
    try {
        const updatedUser = yield User_model_1.default.findByIdAndUpdate(id, { profilePic: (profilePic === null || profilePic === void 0 ? void 0 : profilePic.location) || (profilePic === null || profilePic === void 0 ? void 0 : profilePic.path) || "", }, { new: true, runValidators: true });
        console.log({ seeRecord: { id, pic: profilePic === null || profilePic === void 0 ? void 0 : profilePic.location, path: profilePic === null || profilePic === void 0 ? void 0 : profilePic.path } });
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json({ success: true, message: 'Profile picture updated successfully', updatedUser });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
exports.updateProfilePic = updateProfilePic;
// Complete KYC (Know Your Customer)
const completeKyc = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const idPic = req.file; // multer file
    const { userId } = req.params; // Assuming userId is passed in the URL
    const { idType, idNumber } = req.body;
    if (!idType || !idNumber || !idPic) {
        return res.status(400).json({ message: 'All KYC fields are required' });
    }
    try {
        const updatedUser = yield User_model_1.default.findByIdAndUpdate(userId, {
            kyc: { idType, idNumber, idPicture: (idPic === null || idPic === void 0 ? void 0 : idPic.location) || (idPic === null || idPic === void 0 ? void 0 : idPic.path) || "", isVerified: false },
        }, { new: true, runValidators: true });
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json({ success: true, message: 'KYC completed successfully', updatedUser });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
exports.completeKyc = completeKyc;
// Update Health Information
const updateHealthInformation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params; // Assuming userId is passed in the URL
    const { allergies, healthDetails } = req.body;
    if (!allergies && !healthDetails) {
        return res.status(400).json({ message: 'Health information is required' });
    }
    try {
        const updatedUser = yield User_model_1.default.findByIdAndUpdate(userId, {
            "customerDetails.healthInformation": { allergies, healthDetails },
        }, { new: true, runValidators: true });
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json({ success: true, message: 'Health information updated successfully', updatedUser });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
exports.updateHealthInformation = updateHealthInformation;
// Update Next of Kin (NOK)
const updateNok = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params; // Assuming userId is passed in the URL
    const { fullName, phone, relationship } = req.body;
    if (!fullName || !phone || !relationship) {
        return res.status(400).json({ message: 'All NOK fields are required' });
    }
    try {
        const updatedUser = yield User_model_1.default.findByIdAndUpdate(userId, {
            nok: { fullName, phone, relationship },
        }, { new: true, runValidators: true });
        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        return res.status(200).json({ success: true, message: 'Next of kin updated successfully', updatedUser });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
exports.updateNok = updateNok;
// Update Location
const updateLocation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params; // Assuming userId is passed in the URL
    const { home, office, state, city, long, lat } = req.body;
    if (!home && !office && !state && !city && !long && !lat) {
        return res.status(400).json({ message: 'One of the address is required' });
    }
    try {
        const updatedUser = yield User_model_1.default.findByIdAndUpdate(userId, {
            "address.homeAddress": home,
            "address.officeAddress": office,
            "address.stateName": state,
            "address.city": city,
            "address.long": long,
            "address.lat": lat,
        }, { new: true, runValidators: true });
        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        return res.status(200).json({ success: true, message: 'Location updated successfully', updatedUser });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
exports.updateLocation = updateLocation;
// Update Bio Data (Full name, Marital status, etc.)
const updateBioData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params; // Assuming userId is passed in the URL
    const { fullName, dob, maritalStatus, gender, phoneNumber } = req.body;
    if (!fullName && !maritalStatus && !dob) {
        return res.status(400).json({ message: 'At least one field should be provided to update' });
    }
    try {
        const updatedUser = yield User_model_1.default.findByIdAndUpdate(userId, {
            fullName,
            gender,
            dob,
            maritalStatus,
            phoneNumber
        }, { new: true, runValidators: true });
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json({ success: true, message: 'Bio data updated successfully', updatedUser });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
exports.updateBioData = updateBioData;
