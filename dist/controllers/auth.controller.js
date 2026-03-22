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
exports.whoami = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_model_1 = __importDefault(require("../models/User.model"));
const Chef_1 = __importDefault(require("../models/Chef"));
const whoami = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader)
            return res.status(401).json({ success: false, message: 'No token provided' });
        const token = authHeader.split(' ')[1];
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        if (decoded.role === 'chef') {
            const chef = yield Chef_1.default.findById(decoded.id).select('-password');
            if (!chef)
                return res.status(404).json({ success: false, message: 'Chef not found' });
            return res.json({ success: true, payload: { role: 'chef', user: chef } });
        }
        const user = yield User_model_1.default.findById(decoded.id).select('-password');
        if (!user)
            return res.status(404).json({ success: false, message: 'User not found' });
        return res.json({ success: true, payload: { role: 'user', user } });
    }
    catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid token', error: err.message });
    }
});
exports.whoami = whoami;
exports.default = { whoami: exports.whoami };
