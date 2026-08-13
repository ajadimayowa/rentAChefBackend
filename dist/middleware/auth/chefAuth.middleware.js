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
exports.requireAdminOrChefOwnerAuth = exports.requireChefAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_model_1 = __importDefault(require("../../models/User.model"));
const requireChefAuth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        return res.status(401).json({ success: false, message: 'No token provided' });
    try {
        const token = authHeader.split(' ')[1];
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = yield User_model_1.default.findById(decoded.id);
        if (!user || user.userType !== 'Chef') {
            return res.status(403).json({ success: false, message: 'Chef only' });
        }
        if (!user.isActive) {
            return res.status(403).json({ success: false, message: 'Your account has been disabled. Contact admin.' });
        }
        req.user = user;
        return next();
    }
    catch (err) {
        return res.status(401).json({ success: false, message: 'Token failed' });
    }
});
exports.requireChefAuth = requireChefAuth;
// Allows either an admin, or the chef editing their own record (req.params.id) —
// used by PUT /chef/:id so chefs can maintain their own profile without a
// separate endpoint. The controller still limits which fields a self-editing
// chef may touch.
const requireAdminOrChefOwnerAuth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        return res.status(401).json({ success: false, message: 'No token provided' });
    try {
        const token = authHeader.split(' ')[1];
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = yield User_model_1.default.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid token' });
        }
        if (!user.isActive) {
            return res.status(403).json({ success: false, message: 'Account disabled' });
        }
        const isAdmin = user.userType === 'Admin';
        const isOwnerChef = user.userType === 'Chef' && String(decoded.id) === req.params.id;
        if (!isAdmin && !isOwnerChef) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this chef.' });
        }
        req.user = user;
        return next();
    }
    catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
});
exports.requireAdminOrChefOwnerAuth = requireAdminOrChefOwnerAuth;
