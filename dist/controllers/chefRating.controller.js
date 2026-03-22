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
exports.getChefRatings = exports.addOrUpdateChefRating = void 0;
const ChefRating_1 = require("../models/ChefRating");
const Chef_1 = __importDefault(require("../models/Chef"));
const Booking_1 = require("../models/Booking");
const addOrUpdateChefRating = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        if (!user)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const { chefId } = req.params;
        const { rating, review, bookingId } = req.body;
        const chef = yield Chef_1.default.findById(chefId);
        if (!chef)
            return res.status(404).json({ success: false, message: 'Chef not found' });
        if (!bookingId)
            return res.status(400).json({ success: false, message: 'bookingId is required' });
        // validate booking
        const booking = yield Booking_1.Booking.findById(bookingId);
        if (!booking)
            return res.status(404).json({ success: false, message: 'Booking not found' });
        // only the booking client can rate
        if (booking.clientId.toString() !== user.id) {
            return res.status(403).json({ success: false, message: 'You can only rate your own bookings' });
        }
        // booking must be for this chef and of type 'chef'
        if (booking.bookingType !== 'chef' || (booking.chefId && booking.chefId.toString() !== chefId)) {
            return res.status(400).json({ success: false, message: 'Booking does not belong to this chef' });
        }
        // require completed bookings for rating
        if (booking.status !== 'completed') {
            return res.status(400).json({ success: false, message: 'Booking must be completed to submit a rating' });
        }
        if (!rating || Number(rating) < 1 || Number(rating) > 5) {
            return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
        }
        const r = yield ChefRating_1.ChefRating.findOneAndUpdate({ bookingId }, { userId: user.id, chefId, bookingId, rating: Number(rating), review }, { upsert: true, new: true, setDefaultsOnInsert: true });
        // Recompute chef's average rating and persist it on the Chef document
        try {
            const all = yield ChefRating_1.ChefRating.find({ chefId });
            const avg = all.length ? all.reduce((s, x) => s + x.rating, 0) / all.length : 0;
            yield Chef_1.default.findByIdAndUpdate(chefId, { rating: avg });
        }
        catch (e) {
            console.warn('Failed to update chef average rating:', e);
        }
        return res.status(200).json({ success: true, payload: r, message: 'Rating saved' });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});
exports.addOrUpdateChefRating = addOrUpdateChefRating;
const getChefRatings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { chefId } = req.params;
        const ratings = yield ChefRating_1.ChefRating.find({ chefId }).populate('userId', 'firstName profilePic fullName');
        const avg = ratings.length ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length : 0;
        res.status(200).json({ success: true, payload: { average: avg, total: ratings.length, items: ratings } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.getChefRatings = getChefRatings;
