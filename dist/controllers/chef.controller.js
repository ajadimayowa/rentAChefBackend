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
exports.checkChefAvailability = exports.deleteChef = exports.disableChef = exports.updateChef = exports.getChefById = exports.getAllChefs = exports.changeChefPasswordWithOtp = exports.requestChefPasswordChangeOtp = exports.loginChef = exports.createChef = void 0;
const Chef_1 = __importDefault(require("../models/Chef"));
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const usersEmailNotifs_1 = require("../services/email/rentAChef/usersEmailNotifs");
const chefsEmailNotification_1 = require("../services/email/rentAChef/chefsEmailNotification");
const Category_1 = __importDefault(require("../models/Category"));
const ChefService_1 = require("../models/ChefService");
const Booking_1 = require("../models/Booking");
const otpUtils_1 = require("../utils/otpUtils");
const checkChefAvailability_1 = require("../utils/checkChefAvailability");
const createChef = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const chefPic = req.file; // multer file
        const { staffId, name, gender, email, bio, phoneNumber, specialties, location, state, stateId, defaultPassword, category, yearsOfExperience, rating, dob } = req.body;
        // console.log({ adminSent: req.body });
        if (!staffId || !name || !email || !location || !state || !category) {
            return res.status(400).json({ message: "staffId, category, location, state, name & email are required" });
        }
        // Check if chef already exists
        const exists = yield Chef_1.default.findOne({ $or: [{ email }, { staffId }] });
        if (exists) {
            return res.status(400).json({ message: "Chef already exists" });
        }
        // Handle password
        const pass = defaultPassword || "Chef@123";
        const hashedPassword = yield bcryptjs_1.default.hash(pass, 12);
        // // Parse specialties JSON
        // let specialtiesArray: string[] = [];
        // try {
        //     specialtiesArray = specialties ? JSON.parse(specialties) : [];
        // } catch (err) {
        //     return res.status(400).json({ message: "Invalid specialties format. Should be an array of strings." });
        // }
        //  const categoryName1 = await Category.findById(category).select("name");
        // Create chef
        const chef = yield Chef_1.default.create({
            staffId,
            name,
            gender,
            email,
            bio,
            specialties,
            location,
            state,
            category,
            stateId,
            profilePic: (chefPic === null || chefPic === void 0 ? void 0 : chefPic.location) || (chefPic === null || chefPic === void 0 ? void 0 : chefPic.path) || "", // depending on S3 or local
            phoneNumber,
            dob,
        });
        try {
            yield (0, chefsEmailNotification_1.sendChefCreationSuccessEmail)({
                email,
                firstName: name
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
            return res.status(201).json({
                message: "Chef created successfully",
                defaultPassword: pass,
                chef,
                chefServicesCreated: createdServices,
                chefServicesDuplicatesSkipped: dupCount
            });
        }
        catch (err) {
            console.warn('Failed to create chef services:', err);
            return res.status(201).json({
                message: "Chef created successfully (services creation failed)",
                defaultPassword: pass,
                chef
            });
        }
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error creating chef", error });
    }
});
exports.createChef = createChef;
const loginChef = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }
        const chef = yield Chef_1.default.findOne({ email });
        if (!chef) {
            return res.status(404).json({ message: "Chef not found" });
        }
        const isMatch = yield bcryptjs_1.default.compare(password, chef.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid password" });
        }
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ id: chef._id, email: chef.email, staffId: chef.staffId }, process.env.JWT_SECRET || "your_jwt_secret", { expiresIn: "7d" });
        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            payload: {
                id: chef._id,
                staffId: chef.staffId,
                name: chef.name,
                email: chef.email,
                profilePic: chef.profilePic,
                isActive: chef.isActive
            }
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error logging in chef", error });
    }
});
exports.loginChef = loginChef;
/**
 * REQUEST PASSWORD CHANGE OTP
 */
const requestChefPasswordChangeOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        const chef = yield Chef_1.default.findOne({ email });
        if (!chef) {
            return res.status(404).json({ message: 'User not found' });
        }
        const otp = (0, otpUtils_1.generateOtp)();
        chef.loginOtp = otp;
        chef.loginOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
        yield chef.save();
        // await sendEmail(
        //   user.email,
        //   'Password Reset OTP',
        //   `Your password reset OTP is ${otp}. It expires in 10 minutes.`
        // );
        // Send OTP via email
        try {
            yield (0, usersEmailNotifs_1.sendUserPasswordResetOTPEmail)({
                firstName: chef.name,
                email: chef.email,
                loginOtp: otp,
            });
        }
        catch (error) {
            console.error("Error sending OTP email:", error);
            // Don't block login flow if email fails, just log it
        }
        return res.status(200).json({
            success: true,
            message: 'Password reset OTP sent to email',
        });
    }
    catch (error) {
        return res.status(500).json({ message: 'Server error' });
    }
});
exports.requestChefPasswordChangeOtp = requestChefPasswordChangeOtp;
const changeChefPasswordWithOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, otp, newPassword } = req.body;
        const chef = yield Chef_1.default.findOne({ email });
        if (!chef || !chef.loginOtp || !chef.loginOtpExpires) {
            return res.status(400).json({ message: 'Invalid request' });
        }
        if (chef.loginOtp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }
        if (chef.loginOtpExpires < new Date()) {
            return res.status(400).json({ message: 'OTP expired' });
        }
        const hashedPassword = yield bcryptjs_1.default.hash(newPassword, 10);
        chef.password = hashedPassword;
        // clear otp
        chef.loginOtp = undefined;
        chef.loginOtpExpires = undefined;
        yield chef.save();
        try {
            yield (0, usersEmailNotifs_1.sendPasswordChangeSuccessEmail)({
                firstName: chef.name,
                email: chef.name,
            });
        }
        catch (error) {
            console.log(error);
        }
        return res.status(200).json({
            success: true,
            message: 'Password changed successfully',
        });
    }
    catch (error) {
        return res.status(500).json({ message: 'Server error' });
    }
});
exports.changeChefPasswordWithOtp = changeChefPasswordWithOtp;
const getAllChefs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Pagination
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.max(Number(req.query.limit) || 10, 1);
        const skip = (page - 1) * limit;
        // Filters
        const { location, state, isActive, name } = req.query;
        const filter = {};
        if (location) {
            filter.location = location;
        }
        if (state) {
            filter.state = state;
        }
        if (isActive !== undefined) {
            filter.isActive = isActive === "true";
        }
        // 🔍 Search by chef name (case-insensitive, partial match)
        if (name) {
            filter.name = { $regex: name, $options: "i" };
        }
        // Query
        const [chefs, total] = yield Promise.all([
            Chef_1.default.find(filter)
                .populate("category name")
                .select("-password")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Chef_1.default.countDocuments(filter),
        ]);
        return res.status(200).json({
            success: true,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
            payload: chefs,
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
        const chef = yield Chef_1.default.findById(id)
            .select("-password") // ✅ exclude password
            .populate('category', 'name');
        if (!chef) {
            res.status(404).json({ success: false, message: "Chef not found" });
            return;
        }
        // compute booking counts
        const now = new Date();
        const [totalChefBooking, totalCompletedBooking, totalUpcoming] = yield Promise.all([
            Booking_1.Booking.countDocuments({ chefId: id }),
            Booking_1.Booking.countDocuments({ chefId: id, status: 'completed' }),
            Booking_1.Booking.countDocuments({ chefId: id, status: { $in: ['confirmed', 'ongoing'] }, startDate: { $gte: now } }),
        ]);
        // fetch recent menus for this chef (last 3)
        const { Menu } = yield Promise.resolve().then(() => __importStar(require('../models/Menu')));
        const getTheChefMenu = yield Menu.find({ chefId: id }).sort({ createdAt: -1 }).limit(3).lean();
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
// ✅ Update Chef (Admin OR Chef owner)
const updateChef = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // ✅ Validate MongoDB ID
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid chef ID" });
        }
        /**
         * ✅ Whitelisted fields
         * Prevent updating sensitive fields like password, isActive, staffId, etc.
         */
        const allowedUpdates = [
            "name",
            "gender",
            "email",
            "bio",
            "specialties",
            "category",
            "phoneNumber",
            "location",
            "state",
            "stateId",
            "staffId",
            "profilePic",
            "dob",
            "yearsOfExperience",
            "password",
            "rating"
        ];
        const updates = {};
        for (const key of allowedUpdates) {
            if (req.body[key] !== undefined) {
                updates[key] = req.body[key];
            }
        }
        // ✅ If category is updated, also update categoryName
        if (updates.category) {
            if (!mongoose_1.default.Types.ObjectId.isValid(updates.category)) {
                return res.status(400).json({ success: false, message: "Invalid category ID" });
            }
            const category = yield Category_1.default.findById(updates.category).select("name");
            if (!category) {
                return res.status(404).json({ success: false, message: "Category not found" });
            }
            updates.categoryName = category.name;
        }
        const chef = yield Chef_1.default.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true,
        }).populate("category", "name").select("-password");
        if (!chef) {
            return res.status(404).json({ success: false, message: "Chef not found" });
        }
        return res.status(200).json({
            success: true,
            message: "Chef updated successfully",
            payload: chef,
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
// ✅ Disable Chef (ADMIN only)
const disableChef = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const chef = yield Chef_1.default.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
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
        const chef = yield Chef_1.default.findByIdAndDelete(req.params.id);
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
