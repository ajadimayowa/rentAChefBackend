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
exports.getClientRatings = exports.addOrUpdateClientRating = void 0;
const ClientRating_1 = require("../models/ClientRating");
const Booking_1 = require("../models/Booking");
const User_model_1 = __importDefault(require("../models/User.model"));
const addOrUpdateClientRating = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const actor = req.user; // expected to be Chef or admin
        if (!actor)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const { bookingId } = req.params;
        const { rating, review } = req.body;
        if (!bookingId)
            return res.status(400).json({ success: false, message: 'bookingId is required' });
        const booking = yield Booking_1.Booking.findById(bookingId);
        if (!booking)
            return res.status(404).json({ success: false, message: 'Booking not found' });
        // Ensure actor is the chef for this booking (if actor is Chef)
        const actorId = ((_b = (_a = actor._id) === null || _a === void 0 ? void 0 : _a.toString) === null || _b === void 0 ? void 0 : _b.call(_a)) || actor.id;
        if (booking.chefId && booking.chefId.toString() !== actorId && !actor.isAdmin) {
            return res.status(403).json({ success: false, message: 'You can only rate clients for your bookings' });
        }
        if (booking.status !== 'completed') {
            return res.status(400).json({ success: false, message: 'Booking must be completed to submit a rating' });
        }
        if (!rating || Number(rating) < 1 || Number(rating) > 5) {
            return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
        }
        const clientId = booking.clientId;
        const r = yield ClientRating_1.ClientRating.findOneAndUpdate({ bookingId }, { chefId: actorId, clientId, bookingId, rating: Number(rating), review }, { upsert: true, new: true, setDefaultsOnInsert: true });
        // Recompute client average rating and persist on User
        try {
            const all = yield ClientRating_1.ClientRating.find({ clientId });
            const avg = all.length ? all.reduce((s, x) => s + x.rating, 0) / all.length : 0;
            yield User_model_1.default.findByIdAndUpdate(clientId, { rating: avg });
        }
        catch (e) {
            console.warn('Failed to update client average rating:', e);
        }
        return res.status(200).json({ success: true, payload: r, message: 'Client rating saved' });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});
exports.addOrUpdateClientRating = addOrUpdateClientRating;
const getClientRatings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { clientId } = req.params;
        const items = yield ClientRating_1.ClientRating.find({ clientId }).populate('chefId', 'name profilePic');
        const avg = items.length ? items.reduce((s, r) => s + r.rating, 0) / items.length : 0;
        res.status(200).json({ success: true, payload: { average: avg, total: items.length, items } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.getClientRatings = getClientRatings;
