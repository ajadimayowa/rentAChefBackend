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
exports.deleteAdmin = exports.updateAdmin = exports.getAdminDashboard = exports.getAdminById = exports.getAdmins = exports.createAdmin = exports.adminLogin = void 0;
const Admin_1 = __importDefault(require("../../models/Admin"));
const generateToken_1 = require("../../utils/generateToken");
const Booking_1 = __importDefault(require("../../models/Booking"));
const Chef_1 = __importDefault(require("../../models/Chef"));
const User_model_1 = __importDefault(require("../../models/User.model"));
const adminLogin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const admin = yield Admin_1.default.findOne({ email });
        if (!admin)
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        if (!admin.isActive)
            return res.status(403).json({ success: false, message: "Admin account disabled" });
        const isMatch = yield admin.comparePassword(password);
        if (!isMatch)
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        const token = (0, generateToken_1.generateToken)({
            id: admin._id,
            role: admin.role
        });
        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            payload: {
                id: admin._id,
                fullName: admin.fullName,
                email: admin.email,
                role: admin.role
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error });
    }
});
exports.adminLogin = adminLogin;
const createAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fullName, email, password, role } = req.body;
        const existingAdmin = yield Admin_1.default.findOne({ email });
        if (existingAdmin)
            return res.status(400).json({ message: "Admin already exists" });
        const admin = yield Admin_1.default.create({
            fullName,
            email,
            password,
            role: role || "admin"
        });
        res.status(201).json({
            message: "Admin created successfully",
            admin: {
                id: admin._id,
                fullName: admin.fullName,
                email: admin.email,
                role: admin.role
            }
        });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to create admin", error });
    }
});
exports.createAdmin = createAdmin;
const getAdmins = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.max(Number(req.query.limit) || 10, 1);
        const skip = (page - 1) * limit;
        const [admins, total] = yield Promise.all([
            Admin_1.default.find()
                .select("-password")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Admin_1.default.countDocuments(),
        ]);
        return res.status(200).json({
            success: true,
            data: admins,
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
        const admin = yield Admin_1.default.findById(req.params.id).select("-password");
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found",
            });
        }
        return res.status(200).json({
            success: true,
            data: admin,
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
const getAdminDashboard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const bookings = yield Booking_1.default.find();
        const chefs = yield Chef_1.default.find();
        const customers = yield User_model_1.default.find();
        const grouped = {};
        bookings.forEach((booking) => {
            const day = booking.createdAt.toLocaleDateString('en-US', {
                weekday: 'short',
            });
            grouped[day] = (grouped[day] || 0) + 1;
        });
        const chartData = Object.entries(grouped).map(([day, count]) => ({
            name: day, // 👈 xKey
            users: count, // 👈 dataKey
        }));
        // const admin = await Admin.findById(req.params.id).select("-password");
        // if (!admin) {
        //   return res.status(404).json({
        //     success: false,
        //     message: "Admin not found",
        //   });
        // }
        return res.status(200).json({
            success: true,
            payload: {
                cardData: {
                    revenue: 500000,
                    customers: customers.length,
                    chefs: chefs.length
                },
                bookings: chartData
            },
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
exports.getAdminDashboard = getAdminDashboard;
/**
 * =====================
 * UPDATE ADMIN
 * =====================
 */
const updateAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fullName, email, role, isActive, password } = req.body;
        const admin = yield Admin_1.default.findById(req.params.id);
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
            admin.role = role;
        if (isActive !== undefined)
            admin.isActive = isActive;
        // Allow password update (will be hashed by pre-save hook)
        if (password) {
            admin.password = password;
        }
        yield admin.save();
        const updatedAdmin = admin.toJSON();
        // delete updatedAdmin.password;
        return res.status(200).json({
            success: true,
            message: "Admin updated successfully",
            data: updatedAdmin,
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
        const admin = yield Admin_1.default.findByIdAndDelete(req.params.id);
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
