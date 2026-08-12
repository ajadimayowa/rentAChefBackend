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
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const auth_service_1 = require("../../services/auth/auth.service");
const usersEmailNotifs_1 = require("../../services/email/rentAChef/usersEmailNotifs");
const sendSms_1 = require("../../services/sms/sendSms");
const handleAuthError = (res, error, fallbackMessage) => {
    if (error instanceof auth_service_1.AuthError) {
        return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error(error);
    return res.status(500).json({ success: false, message: fallbackMessage });
};
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, fullName, phoneNumber } = req.body;
        const { user, emailVerificationOtp } = yield (0, auth_service_1.registerCustomer)({ email, password, fullName, phoneNumber });
        try {
            yield (0, sendSms_1.sendSms)({
                to: user.phoneNumber || '',
                message: `Your RentAChef verification code is ${emailVerificationOtp}`,
            });
        }
        catch (err) {
            console.error(err);
        }
        try {
            const verifyUrl = `${process.env.CLIENT_URL}/verify-email?email=${encodeURIComponent(user.email)}&otp=${encodeURIComponent(emailVerificationOtp)}`;
            yield (0, usersEmailNotifs_1.sendWelcomeEmail)({
                firstName: user.firstName || '',
                email: user.email,
                emailVerificationOtp,
                verifyUrl,
            });
        }
        catch (error) {
            console.error(error);
        }
        return res.status(201).json({
            success: true,
            payload: { id: user._id, email: user.email, fullName: user.fullName, userType: user.userType },
        });
    }
    catch (error) {
        return handleAuthError(res, error, 'Internal server error.');
    }
});
exports.register = register;
