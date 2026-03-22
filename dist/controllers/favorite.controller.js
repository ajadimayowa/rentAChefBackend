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
exports.getUserFavorites = exports.toggleFavorite = void 0;
const Favorite_1 = require("../models/Favorite");
const SpecialMenu_1 = require("../models/SpecialMenu");
// Toggle favorite: if exists remove, otherwise create
const toggleFavorite = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        if (!user)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const { menuId } = req.params;
        const menu = yield SpecialMenu_1.SpecialMenu.findById(menuId);
        if (!menu)
            return res.status(404).json({ success: false, message: 'Special menu not found' });
        const existing = yield Favorite_1.Favorite.findOne({ userId: user.id, specialMenuId: menuId });
        if (existing) {
            yield existing.deleteOne();
            return res.status(200).json({ success: true, message: 'Removed from favorites' });
        }
        const fav = yield Favorite_1.Favorite.create({ userId: user.id, specialMenuId: menuId });
        return res.status(201).json({ success: true, payload: fav, message: 'Added to favorites' });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});
exports.toggleFavorite = toggleFavorite;
const getUserFavorites = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        if (!user)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const favs = yield Favorite_1.Favorite.find({ userId: user.id }).populate('specialMenuId');
        res.status(200).json({ success: true, payload: favs });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.getUserFavorites = getUserFavorites;
