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
exports.createAdmin = exports.adminLogin = void 0;
const Admin_1 = __importDefault(require("../../models/Admin"));
const generateToken_1 = require("../../utils/generateToken");
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
