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
exports.chefOrAdmin = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_model_1 = __importDefault(require("../models/User.model"));
const Chef_1 = __importDefault(require("../models/Chef"));
const chefOrAdmin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        return res.status(401).json({ message: 'No token provided' });
    try {
        const token = authHeader.split(' ')[1];
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        if (decoded.role === 'chef') {
            const chef = yield Chef_1.default.findById(decoded.id);
            if (!chef)
                return res.status(403).json({ message: 'Invalid chef token' });
            req.user = chef;
            return next();
        }
        // Otherwise try loading as regular user and ensure admin
        const user = yield User_model_1.default.findById(decoded.id);
        if (!user || !user.isAdmin)
            return res.status(403).json({ message: 'Admin or Chef only' });
        req.user = user;
        return next();
    }
    catch (err) {
        return res.status(401).json({ message: 'Token failed' });
    }
});
exports.chefOrAdmin = chefOrAdmin;
