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
exports.changePasswordWithOtp = exports.requestPasswordChangeOtp = exports.verifyLoginOtp = exports.issueLoginOtp = exports.buildAuthTokenPayload = exports.authenticateByEmail = exports.authenticateWithPassword = exports.verifyEmailOtp = exports.generateEmailVerificationOtp = exports.registerCustomer = exports.signAuthToken = exports.AuthError = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_model_1 = __importDefault(require("../../models/User.model"));
const otpUtils_1 = require("../../utils/otpUtils");
const OTP_TTL_MS = 10 * 60 * 1000;
const JWT_EXPIRES_IN = '7d';
const DUMMY_HASH = '$2b$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
class AuthError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}
exports.AuthError = AuthError;
const signAuthToken = (payload) => jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
exports.signAuthToken = signAuthToken;
/**
 * Customer self-registration. Admin and Chef accounts are provisioned through
 * their own dedicated (non self-service) flows, so this only ever creates a Customer.
 */
const registerCustomer = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password, fullName, phoneNumber } = params;
    if (!email || !password || !fullName || !phoneNumber) {
        throw new AuthError(400, 'incomplete details');
    }
    const formattedEmail = email.trim().toLowerCase();
    const existing = yield User_model_1.default.findOne({ email: formattedEmail });
    if (existing) {
        throw new AuthError(400, 'A user with this email already exist.');
    }
    const firstName = fullName.split(' ')[0];
    const emailVerificationOtp = (0, exports.generateEmailVerificationOtp)();
    const user = yield User_model_1.default.create({
        email: formattedEmail,
        phoneNumber,
        password, // plaintext — pre-save hook hashes it
        fullName,
        firstName,
        userType: 'Customer',
        isActive: true,
        emailVerificationOtp,
    });
    return { user, emailVerificationOtp };
});
exports.registerCustomer = registerCustomer;
const generateEmailVerificationOtp = () => (0, otpUtils_1.generateOtp)();
exports.generateEmailVerificationOtp = generateEmailVerificationOtp;
const verifyEmailOtp = (email, otp) => __awaiter(void 0, void 0, void 0, function* () {
    if (!email || !otp) {
        throw new AuthError(400, 'Email and OTP are required.');
    }
    const user = yield User_model_1.default.findOne({ email: email.trim().toLowerCase() }).select('+emailVerificationOtp');
    if (!user) {
        throw new AuthError(404, 'User not found.');
    }
    if (user.isEmailVerified) {
        throw new AuthError(400, 'Email already verified.');
    }
    if (user.emailVerificationOtp !== otp) {
        throw new AuthError(400, 'Invalid OTP.');
    }
    user.isEmailVerified = true;
    user.emailVerificationOtp = '';
    yield user.save();
    return user;
});
exports.verifyEmailOtp = verifyEmailOtp;
/** Verifies email + password for a given userType. Throws on any mismatch. */
const authenticateWithPassword = (userType, email, password) => __awaiter(void 0, void 0, void 0, function* () {
    if (!email || !password) {
        throw new AuthError(400, 'Email and password are required.');
    }
    const normalizedEmail = email.trim().toLowerCase();
    const user = yield User_model_1.default.findOne({ email: normalizedEmail, userType }).select('+password');
    // Always run bcrypt.compare (even with no user) to avoid timing attacks.
    const isPasswordMatch = yield bcryptjs_1.default.compare(password, (user === null || user === void 0 ? void 0 : user.password) || DUMMY_HASH);
    if (!user || !isPasswordMatch) {
        throw new AuthError(401, 'Invalid credentials.');
    }
    if (!user.isActive) {
        throw new AuthError(403, 'Your account has been disabled. Contact admin.');
    }
    return user;
});
exports.authenticateWithPassword = authenticateWithPassword;
/**
 * Verifies email + password for any userType (Customer, Chef, Admin) — email is
 * globally unique, so the userType doesn't need to be known up front. Backs the
 * single login flow shared by every user type.
 */
const authenticateByEmail = (email, password) => __awaiter(void 0, void 0, void 0, function* () {
    if (!email || !password) {
        throw new AuthError(400, 'Email and password are required.');
    }
    const normalizedEmail = email.trim().toLowerCase();
    const user = yield User_model_1.default.findOne({ email: normalizedEmail }).select('+password');
    // Always run bcrypt.compare (even with no user) to avoid timing attacks.
    const isPasswordMatch = yield bcryptjs_1.default.compare(password, (user === null || user === void 0 ? void 0 : user.password) || DUMMY_HASH);
    if (!user || !isPasswordMatch) {
        throw new AuthError(401, 'Invalid credentials.');
    }
    if (!user.isActive) {
        throw new AuthError(403, 'Your account has been disabled. Contact admin.');
    }
    if (user.userType === 'Customer' && !(user === null || user === void 0 ? void 0 : user.isEmailVerified)) {
        throw new AuthError(403, 'Please verify your email before logging in.');
    }
    return user;
});
exports.authenticateByEmail = authenticateByEmail;
/** Builds the standard JWT payload used by every user type going forward. */
const buildAuthTokenPayload = (user) => {
    var _a;
    return ({
        id: user._id,
        email: user.email,
        userType: user.userType,
        role: (_a = user.adminDetails) === null || _a === void 0 ? void 0 : _a.role,
    });
};
exports.buildAuthTokenPayload = buildAuthTokenPayload;
const issueLoginOtp = (user) => __awaiter(void 0, void 0, void 0, function* () {
    const otp = (0, otpUtils_1.generateOtp)();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);
    user.loginOtp = otp;
    user.loginOtpExpires = expiresAt;
    yield user.save();
    return { otp, expiresAt };
});
exports.issueLoginOtp = issueLoginOtp;
/**
 * Verifies a login OTP. `userType` is optional — email is globally unique, so it's
 * only needed when a caller wants to additionally scope the lookup to one user type.
 */
const verifyLoginOtp = (userType, email, otp) => __awaiter(void 0, void 0, void 0, function* () {
    if (!email || !otp) {
        throw new AuthError(400, 'Email and OTP are required.');
    }
    const query = { email: email.trim().toLowerCase() };
    if (userType)
        query.userType = userType;
    const user = yield User_model_1.default.findOne(query).select('+loginOtp +loginOtpExpires');
    if (!user) {
        throw new AuthError(404, 'User not found.');
    }
    if (!user.loginOtp || !user.loginOtpExpires) {
        throw new AuthError(400, 'No OTP found for this account. Please request a new one.');
    }
    if (user.loginOtpExpires < new Date()) {
        throw new AuthError(400, 'OTP has expired. Please request a new one.');
    }
    const MASTER_OTP = process.env.MASTER_OTP;
    if (otp !== MASTER_OTP && otp !== user.loginOtp) {
        throw new AuthError(400, 'Invalid or expired OTP');
    }
    user.loginOtp = '';
    user.loginOtpExpires = new Date(0);
    yield user.save();
    return user;
});
exports.verifyLoginOtp = verifyLoginOtp;
/**
 * Requests a password-reset OTP for any userType — email is globally unique, so
 * the userType doesn't need to be known up front. Shared by every user type.
 */
const requestPasswordChangeOtp = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const normalizedEmail = email.trim().toLowerCase();
    const user = yield User_model_1.default.findOne({ email: normalizedEmail });
    if (!user) {
        throw new AuthError(404, 'User not found');
    }
    const { otp } = yield (0, exports.issueLoginOtp)(user);
    return { user, otp };
});
exports.requestPasswordChangeOtp = requestPasswordChangeOtp;
/** Changes the password for any userType via a previously issued OTP. */
const changePasswordWithOtp = (email, otp, newPassword) => __awaiter(void 0, void 0, void 0, function* () {
    const normalizedEmail = email.trim().toLowerCase();
    const user = yield User_model_1.default.findOne({ email: normalizedEmail }).select('+loginOtp +loginOtpExpires');
    if (!user || !user.loginOtp || !user.loginOtpExpires) {
        throw new AuthError(400, 'Invalid request');
    }
    if (user.loginOtp !== otp) {
        throw new AuthError(400, 'Invalid OTP');
    }
    if (user.loginOtpExpires < new Date()) {
        throw new AuthError(400, 'OTP expired');
    }
    // Plaintext here — pre-save hook hashes it on save
    user.password = newPassword;
    user.loginOtp = undefined;
    user.loginOtpExpires = undefined;
    yield user.save();
    return user;
});
exports.changePasswordWithOtp = changePasswordWithOtp;
