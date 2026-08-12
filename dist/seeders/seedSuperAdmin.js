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
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const User_model_1 = __importDefault(require("../models/User.model"));
const auth_service_1 = require("../services/auth/auth.service");
const usersEmailNotifs_1 = require("../services/email/rentAChef/usersEmailNotifs");
dotenv_1.default.config();
const seedAdmin = () => __awaiter(void 0, void 0, void 0, function* () {
    const fullName = process.env.SUPER_ADMIN_NAME;
    const firstName = fullName === null || fullName === void 0 ? void 0 : fullName.split(" ")[0];
    const email = process.env.SUPER_ADMIN_EMAIL;
    const password = process.env.SUPER_ADMIN_PASSWORD;
    console.log({ email: email, pass: password });
    if (!fullName || !email || !password) {
        throw new Error("Missing SUPER_ADMIN_NAME, SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD in environment variables");
    }
    yield mongoose_1.default.connect(process.env.MONGO_URI);
    let admin = yield User_model_1.default.findOne({
        email,
        userType: "Admin"
    });
    if (!admin) {
        admin = yield User_model_1.default.create({
            fullName,
            firstName,
            email,
            password,
            userType: "Admin",
            adminDetails: { role: "super_admin" },
            isActive: true,
            isEmailVerified: false,
        });
        console.log("✅ Super Admin created");
    }
    else {
        console.log("⚠️ Super Admin already exists");
    }
    // Re-runnable: resend the verification email as long as the account isn't
    // verified yet, so a prior run that created the admin but failed to deliver
    // the email (e.g. SMTP misconfigured) can be recovered by just re-seeding.
    if (!admin.isEmailVerified) {
        const emailVerificationOtp = (0, auth_service_1.generateEmailVerificationOtp)();
        admin.emailVerificationOtp = emailVerificationOtp;
        yield admin.save();
        const verifyUrl = `${process.env.CLIENT_URL}/verify-email?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(emailVerificationOtp)}`;
        try {
            yield (0, usersEmailNotifs_1.sendWelcomeEmail)({
                firstName: firstName || "",
                email,
                emailVerificationOtp,
                verifyUrl,
            });
            console.log("✅ Verification email sent");
        }
        catch (error) {
            console.error("⚠️ Failed to send verification email:", error);
        }
    }
    else {
        console.log("✅ Super Admin email already verified");
    }
    process.exit();
});
seedAdmin();
