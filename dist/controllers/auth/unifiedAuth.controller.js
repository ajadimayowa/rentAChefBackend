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
exports.verifyEmail = exports.resetPasswordWithOtp = exports.resendPasswordResetOtp = exports.requestPasswordResetOtp = exports.verifyLoginOtp = exports.login = void 0;
const auth_service_1 = require("../../services/auth/auth.service");
const usersEmailNotifs_1 = require("../../services/email/rentAChef/usersEmailNotifs");
const sendSms_1 = require("../../services/sms/sendSms");
const Category_1 = __importDefault(require("../../models/Category"));
const Service_1 = require("../../models/Service");
const handleAuthError = (res, error, fallbackMessage) => {
    if (error instanceof auth_service_1.AuthError) {
        return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error(error);
    return res.status(500).json({ success: false, message: fallbackMessage });
};
/** Delivers a password-reset OTP by email (all user types) and additionally by SMS when a phone is on file. */
const deliverPasswordResetOtp = (user, otp) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, usersEmailNotifs_1.sendUserPasswordResetOTPEmail)({ firstName: user.firstName || '', email: user.email, loginOtp: otp });
    }
    catch (error) {
        console.error('Error sending password reset OTP email:', error);
    }
    if (user.phoneNumber) {
        try {
            yield (0, sendSms_1.sendSms)({ to: user.phoneNumber, message: `Your RentAChef password reset code is ${otp}` });
        }
        catch (err) {
            console.error(err);
        }
    }
});
/**
 * Single login entry point shared by every user type (Customer, Chef, Admin) — one
 * form, no need to know which portal you're signing into. Password is verified
 * first; a login OTP is then issued (email, plus SMS when a phone is on file) and
 * must be exchanged via verifyLoginOtp for a token.
 */
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const user = yield (0, auth_service_1.authenticateByEmail)(email, password);
        const { otp, expiresAt } = yield (0, auth_service_1.issueLoginOtp)(user);
        try {
            yield (0, usersEmailNotifs_1.sendLoginOtpEmail)({ firstName: user.firstName || '', email: user.email, loginOtp: otp });
        }
        catch (error) {
            console.error('Error sending OTP email:', error);
        }
        if (user.phoneNumber) {
            try {
                yield (0, sendSms_1.sendSms)({ to: user.phoneNumber, message: `Your RentAChef login OTP code is ${otp}` });
            }
            catch (err) {
                console.error(err);
            }
        }
        return res.status(200).json({
            success: true,
            message: 'OTP sent to your email.',
            payload: { email: user.email, expiresAt },
        });
    }
    catch (error) {
        return handleAuthError(res, error, 'Internal server error.');
    }
});
exports.login = login;
/** Exchanges a verified login OTP for a token. The JWT always carries `userType` so middleware can branch on it. */
const verifyLoginOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { email, otp } = req.body;
        const user = yield (0, auth_service_1.verifyLoginOtp)(null, email, otp);
        const token = (0, auth_service_1.signAuthToken)((0, auth_service_1.buildAuthTokenPayload)(user));
        const userObj = user.toJSON();
        delete userObj.password;
        delete userObj.loginOtp;
        delete userObj.loginOtpExpires;
        const payload = Object.assign({}, userObj);
        if (user.userType === 'Admin') {
            payload.role = (_a = user.adminDetails) === null || _a === void 0 ? void 0 : _a.role;
            const [categories, services] = yield Promise.all([
                Category_1.default.find().select('_id name').lean(),
                Service_1.ServiceModel.find().select('_id name').lean(),
            ]);
            // payload.formattedCategories = categories.map((cat: any) => ({ label: cat.name, value: cat._id }));
            // payload.formattedServices = services.map((service: any) => ({ name: service.name, id: service._id }));
        }
        if (user.userType === 'Chef') {
            payload.staffId = (_b = user.chefDetails) === null || _b === void 0 ? void 0 : _b.staffId;
            payload.isPasswordUpdated = (_c = user.chefDetails) === null || _c === void 0 ? void 0 : _c.isPasswordUpdated;
        }
        return res.status(200).json({
            success: true,
            message: 'Login successful.',
            token,
            payload,
        });
    }
    catch (error) {
        return handleAuthError(res, error, 'Server error. Please try again later.');
    }
});
exports.verifyLoginOtp = verifyLoginOtp;
/** Requests a password-reset OTP for any user type — email is globally unique. */
const requestPasswordResetOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        const { user, otp } = yield (0, auth_service_1.requestPasswordChangeOtp)(email);
        yield deliverPasswordResetOtp(user, otp);
        return res.status(200).json({ success: true, message: 'Password reset OTP sent' });
    }
    catch (error) {
        return handleAuthError(res, error, 'Server error');
    }
});
exports.requestPasswordResetOtp = requestPasswordResetOtp;
/** Resends a fresh password-reset OTP for any user type. */
const resendPasswordResetOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        const { user, otp } = yield (0, auth_service_1.requestPasswordChangeOtp)(email);
        yield deliverPasswordResetOtp(user, otp);
        return res.status(200).json({ success: true, message: 'OTP resent successfully' });
    }
    catch (error) {
        return handleAuthError(res, error, 'Server error');
    }
});
exports.resendPasswordResetOtp = resendPasswordResetOtp;
/** Changes the password for any user type via a previously issued OTP. */
const resetPasswordWithOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, otp, newPassword } = req.body;
        const user = yield (0, auth_service_1.changePasswordWithOtp)(email, otp, newPassword);
        try {
            yield (0, usersEmailNotifs_1.sendPasswordChangeSuccessEmail)({ firstName: user.firstName || '', email: user.email });
        }
        catch (error) {
            console.log(error);
        }
        return res.status(200).json({ success: true, message: 'Password changed successfully' });
    }
    catch (error) {
        return handleAuthError(res, error, 'Server error');
    }
});
exports.resetPasswordWithOtp = resetPasswordWithOtp;
/** Verifies a user's email via OTP, for any user type. */
const verifyEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, otp } = req.body;
        const user = yield (0, auth_service_1.verifyEmailOtp)(email, otp);
        try {
            yield (0, usersEmailNotifs_1.sendEmailVerificationSuccessEmail)({ firstName: user.firstName || '', email: user.email });
        }
        catch (error) {
            console.log(error);
        }
        return res.status(200).json({ success: true, message: 'Email verified successfully.' });
    }
    catch (error) {
        return handleAuthError(res, error, 'Server error. Please try again later.');
    }
});
exports.verifyEmail = verifyEmail;
