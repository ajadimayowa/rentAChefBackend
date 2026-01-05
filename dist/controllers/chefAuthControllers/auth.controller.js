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
exports.me = exports.chefLogin = exports.resendPasswordChangeOtp = exports.changePasswordWithOtp = exports.requestPasswordChangeOtp = exports.verifyLoginOtp = exports.login = exports.verifyEmail = exports.register = void 0;
// import User from '../models/User';
const User_model_1 = __importDefault(require("../../models/User.model"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const otpUtils_1 = require("../../utils/otpUtils");
const usersEmailNotifs_1 = require("../../services/email/rentAChef/usersEmailNotifs");
const Chef_1 = __importDefault(require("../../models/Chef"));
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password, fullName, phoneNumber } = req.body;
    if (!email || !password || !fullName || !phoneNumber) {
        return res.status(401).json({ success: false, message: 'incomplete details' });
    }
    const formatedEmail = email.trim().toLowerCase();
    try {
        const existing = yield User_model_1.default.findOne({ formatedEmail });
        if (existing) {
            return res.status(400).json({ success: false, message: 'A user with this email already exist.' });
        }
        let firstName = fullName.split(' ')[0];
        const hashed = yield bcryptjs_1.default.hash(password, 10);
        const isAdmin = req.body.adminSecret === process.env.ADMIN_SECRET;
        const emailVerificationOtp = (0, otpUtils_1.generateOtp)();
        const user = yield User_model_1.default.create({ email: formatedEmail, phone: phoneNumber, emailVerificationOtp, password: hashed, fullName, firstName, isAdmin });
        // console.log({ seeEmailVerOtp: emailVerificationOtp })
        yield (0, usersEmailNotifs_1.sendEmailVerificationOtp)({
            firstName,
            email: formatedEmail,
            emailVerificationOtp,
        });
        // const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
        return res.status(201).json({ success: true, payload: { id: user._id, email: user.email, fullName: user.fullName, isAdmin: user.isAdmin } });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
});
exports.register = register;
const verifyEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, otp } = req.body;
        console.log({ email: email, otp: otp });
        // Validate input
        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP are required.",
            });
        }
        // Find the customer
        const customer = yield User_model_1.default.findOne({ email: email.toLowerCase() });
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found.",
            });
        }
        // Check if already verified
        if (customer.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: "Email already verified.",
            });
        }
        // Check if OTP matches
        if (customer.emailVerificationOtp !== otp) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP.",
            });
        }
        // Update verification status
        customer.isEmailVerified = true;
        customer.emailVerificationOtp = "";
        yield customer.save();
        let firstName = customer === null || customer === void 0 ? void 0 : customer.firstName;
        yield (0, usersEmailNotifs_1.sendEmailVerificationSuccessEmail)({
            firstName,
            email,
        });
        return res.status(200).json({
            success: true,
            message: "Email verified successfully.",
        });
    }
    catch (error) {
        console.error("Error verifying email:", error);
        return res.status(500).json({
            success: false,
            message: "Server error. Please try again later.",
        });
    }
});
exports.verifyEmail = verifyEmail;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('see me');
    try {
        const { email, password } = req.body;
        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required.",
            });
        }
        // Normalize email
        const normalizedEmail = email.trim().toLowerCase();
        // ✅ Fix: Query should use `email`, not `{ normalizedEmail }`
        const user = yield User_model_1.default.findOne({ email: normalizedEmail });
        // Prevent timing attacks: always run bcrypt.compare
        const dummyHash = "$2b$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
        const isPasswordMatch = yield bcryptjs_1.default.compare(password, (user === null || user === void 0 ? void 0 : user.password) || dummyHash);
        if (!user || !isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials.",
            });
        }
        // Optional: ensure user has verified their email before logging in
        if (!user.isEmailVerified) {
            return res.status(403).json({
                success: false,
                message: "Please verify your email before logging in.",
            });
        }
        // Generate OTP and expiry (10 minutes)
        const otp = (0, otpUtils_1.generateOtp)(); // e.g. 6-digit random string
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        user.loginOtp = otp;
        user.loginOtpExpires = otpExpires;
        yield user.save();
        // Send OTP via email
        try {
            yield (0, usersEmailNotifs_1.sendLoginOtpEmail)({
                firstName: user.firstName,
                email: user.email,
                loginOtp: otp,
            });
        }
        catch (error) {
            console.error("Error sending OTP email:", error);
            // Don't block login flow if email fails, just log it
        }
        return res.status(200).json({
            success: true,
            message: "OTP sent to email.",
            payload: {
                email: user.email,
                expiresAt: otpExpires,
            },
        });
    }
    catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
});
exports.login = login;
const verifyLoginOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, otp } = req.body;
        // Check for missing fields
        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP are required.",
            });
        }
        // Find the customer
        const customer = yield User_model_1.default.findOne({ email: email.trim().toLowerCase() });
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found.",
            });
        }
        // Ensure OTP exists
        if (!customer.loginOtp || !customer.loginOtpExpires) {
            return res.status(400).json({
                success: false,
                message: "No OTP found for this account. Please request a new one.",
            });
        }
        // Check OTP expiration
        if (customer.loginOtpExpires < new Date()) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired. Please request a new one.",
            });
        }
        // Validate OTP
        if (customer.loginOtp !== otp) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP.",
            });
        }
        // OTP is valid — clear it
        customer.loginOtp = "";
        customer.loginOtpExpires = new Date(0);
        yield customer.save();
        // Optionally generate a JWT token
        const token = jsonwebtoken_1.default.sign({ id: customer._id, email: customer.email, isAdmin: customer.isAdmin }, process.env.JWT_SECRET, { expiresIn: "7d" });
        // Send OTP via email
        try {
            yield (0, usersEmailNotifs_1.sendLoginSuccessEmail)({
                firstName: customer.firstName,
                email: customer.email,
            });
        }
        catch (error) {
            console.log(error);
        }
        return res.status(200).json({
            success: true,
            message: "Login OTP verified successfully.",
            token,
            payload: {
                id: customer.id,
                email: customer.email,
                fullName: customer.fullName,
                isAdmin: customer.isAdmin,
            },
        });
    }
    catch (error) {
        console.error("Error verifying login OTP:", error);
        return res.status(500).json({
            success: false,
            message: "Server error. Please try again later.",
        });
    }
});
exports.verifyLoginOtp = verifyLoginOtp;
/**
 * REQUEST PASSWORD CHANGE OTP
 */
const requestPasswordChangeOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        const user = yield User_model_1.default.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const otp = (0, otpUtils_1.generateOtp)();
        user.loginOtp = otp;
        user.loginOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
        yield user.save();
        // await sendEmail(
        //   user.email,
        //   'Password Reset OTP',
        //   `Your password reset OTP is ${otp}. It expires in 10 minutes.`
        // );
        // Send OTP via email
        try {
            yield (0, usersEmailNotifs_1.sendUserPasswordResetOTPEmail)({
                firstName: user.firstName,
                email: user.email,
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
exports.requestPasswordChangeOtp = requestPasswordChangeOtp;
/**
 * CHANGE PASSWORD WITH OTP
 */
/**
 * CHANGE PASSWORD WITH OTP
 */
const changePasswordWithOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, otp, newPassword } = req.body;
        const user = yield User_model_1.default.findOne({ email });
        if (!user || !user.loginOtp || !user.loginOtpExpires) {
            return res.status(400).json({ message: 'Invalid request' });
        }
        if (user.loginOtp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }
        if (user.loginOtpExpires < new Date()) {
            return res.status(400).json({ message: 'OTP expired' });
        }
        const hashedPassword = yield bcryptjs_1.default.hash(newPassword, 10);
        user.password = hashedPassword;
        // clear otp
        user.loginOtp = undefined;
        user.loginOtpExpires = undefined;
        yield user.save();
        try {
            yield (0, usersEmailNotifs_1.sendPasswordChangeSuccessEmail)({
                firstName: user.firstName,
                email: user.email,
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
exports.changePasswordWithOtp = changePasswordWithOtp;
/**
 * RESEND PASSWORD CHANGE OTP
 */
const resendPasswordChangeOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        const user = yield User_model_1.default.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const otp = (0, otpUtils_1.generateOtp)();
        user.loginOtp = otp;
        user.loginOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
        yield user.save();
        try {
            yield (0, usersEmailNotifs_1.sendPasswordChangeSuccessEmail)({
                firstName: user.firstName,
                email: user.email,
            });
        }
        catch (error) {
            console.log(error);
        }
        return res.status(200).json({
            message: 'OTP resent successfully',
        });
    }
    catch (error) {
        return res.status(500).json({ message: 'Server error' });
    }
});
exports.resendPasswordChangeOtp = resendPasswordChangeOtp;
//chef auths
const chefLogin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        // 1. Validate input
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required",
            });
        }
        // 2. Find chef by email
        const chef = yield Chef_1.default.findOne({ email });
        if (!chef) {
            return res.status(404).json({
                message: "Chef not found",
            });
        }
        // 3. Check if chef is active
        if (!chef.isActive) {
            return res.status(403).json({
                message: "Your account has been disabled. Contact admin.",
            });
        }
        // 4. Check if password exists
        if (!chef.password) {
            return res.status(403).json({
                message: "Password not set. Contact admin.",
            });
        }
        // 5. Compare passwords
        const isMatch = yield bcryptjs_1.default.compare(password, chef.password);
        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid login credentials",
            });
        }
        // 6. Generate JWT
        const token = jsonwebtoken_1.default.sign({
            id: chef._id,
            role: "chef",
            email: chef.email,
        }, process.env.JWT_SECRET, { expiresIn: "7d" });
        // 7. Send response
        res.status(200).json({
            message: "Login successful",
            token,
            chef: {
                id: chef._id,
                staffId: chef.staffId,
                name: chef.name,
                email: chef.email,
                isPasswordUpdated: chef.isPasswordUpdated,
            },
        });
    }
    catch (error) {
        console.error("Chef Login Error:", error);
        res.status(500).json({
            message: "Unable to login at the moment",
        });
    }
});
exports.chefLogin = chefLogin;
const me = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    if (!user)
        return res.status(401).json({ message: 'Unauthorized' });
    res.json({ user });
});
exports.me = me;
