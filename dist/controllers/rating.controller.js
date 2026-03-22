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
exports.getMenuRatings = exports.addOrUpdateRating = void 0;
const Rating_1 = require("../models/Rating");
const SpecialMenu_1 = require("../models/SpecialMenu");
const addOrUpdateRating = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        if (!user)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const { menuId } = req.params;
        const { rating, review } = req.body;
        const menu = yield SpecialMenu_1.SpecialMenu.findById(menuId);
        if (!menu)
            return res.status(404).json({ success: false, message: 'Special menu not found' });
        if (!rating || Number(rating) < 1 || Number(rating) > 5) {
            return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
        }
        const r = yield Rating_1.Rating.findOneAndUpdate({ userId: user.id, specialMenuId: menuId }, { rating: Number(rating), review }, { upsert: true, new: true, setDefaultsOnInsert: true });
        return res.status(200).json({ success: true, payload: r, message: 'Rating saved' });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});
exports.addOrUpdateRating = addOrUpdateRating;
const getMenuRatings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { menuId } = req.params;
        const ratings = yield Rating_1.Rating.find({ specialMenuId: menuId }).populate('userId', 'firstName profilePic fullName');
        const avg = ratings.length ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length : 0;
        res.status(200).json({ success: true, payload: { average: avg, total: ratings.length, items: ratings } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.getMenuRatings = getMenuRatings;
