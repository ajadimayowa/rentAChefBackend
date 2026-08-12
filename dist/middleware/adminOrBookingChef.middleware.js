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
exports.adminOrBookingChef = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_model_1 = __importDefault(require("../models/User.model"));
const Procurement_1 = __importDefault(require("../models/Procurement"));
const Booking_1 = require("../models/Booking");
const adminOrBookingChef = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        return res.status(401).json({ message: 'No token provided' });
    try {
        const token = authHeader.split(' ')[1];
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = yield User_model_1.default.findById(decoded.id);
        if (!user)
            return res.status(403).json({ message: 'Invalid token' });
        // If admin user
        if (user.userType === 'Admin') {
            req.user = user;
            return next();
        }
        // If chef, ensure they own the booking linked to procurement
        if (user.userType === 'Chef') {
            const procurementId = req.params.id;
            if (!procurementId)
                return res.status(400).json({ message: 'Procurement id required' });
            const procurement = yield Procurement_1.default.findById(procurementId);
            if (!procurement)
                return res.status(404).json({ message: 'Procurement not found' });
            const booking = yield Booking_1.BookingModel.findById(procurement.bookingId);
            if (!booking)
                return res.status(404).json({ message: 'Booking not found for procurement' });
            if (String(booking.chefId) !== String(user._id)) {
                return res.status(403).json({ message: 'Not authorized for this procurement' });
            }
            req.user = user;
            return next();
        }
        return res.status(403).json({ message: 'Admin or owning chef only' });
    }
    catch (err) {
        return res.status(401).json({ message: 'Token failed' });
    }
});
exports.adminOrBookingChef = adminOrBookingChef;
