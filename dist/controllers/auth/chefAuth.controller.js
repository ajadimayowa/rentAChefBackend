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
exports.login = void 0;
const auth_service_1 = require("../../services/auth/auth.service");
const handleAuthError = (res, error, fallbackMessage) => {
    if (error instanceof auth_service_1.AuthError) {
        return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error(error);
    return res.status(500).json({ success: false, message: fallbackMessage });
};
/** Chef login is single-step: password → token. */
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { email, password } = req.body;
        const chef = yield (0, auth_service_1.authenticateWithPassword)('Chef', email, password);
        const token = (0, auth_service_1.signAuthToken)({ id: chef._id, role: 'chef', email: chef.email });
        return res.status(200).json({
            message: 'Login successful',
            token,
            chef: {
                id: chef._id,
                staffId: (_a = chef.chefDetails) === null || _a === void 0 ? void 0 : _a.staffId,
                name: chef.fullName,
                email: chef.email,
                isPasswordUpdated: (_b = chef.chefDetails) === null || _b === void 0 ? void 0 : _b.isPasswordUpdated,
            },
        });
    }
    catch (error) {
        return handleAuthError(res, error, 'Unable to login at the moment');
    }
});
exports.login = login;
