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
exports.deleteMenu = exports.updateMenu = exports.getSingleMenu = exports.getAllMenus = exports.createMenu = void 0;
const Menu_1 = __importDefault(require("../models/Menu"));
const mongoose_1 = require("mongoose");
/**
 * CREATE MENU
 */
const createMenu = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { chef, title, items, basePrice } = req.body;
        if (!chef || !title || !items || !items.length) {
            return res.status(400).json({ message: "Chef, title and items are required" });
        }
        const menu = yield Menu_1.default.create({
            chef,
            title,
            items,
            basePrice
        });
        return res.status(201).json({
            success: true,
            message: "Menu created successfully",
            data: menu,
        });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
exports.createMenu = createMenu;
/**
 * GET ALL MENUS
 */
const getAllMenus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const menus = yield Menu_1.default.find()
            .populate("chef", "name email")
            .sort({ createdAt: -1 });
        return res.status(200).json({ success: true, payload: menus });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
exports.getAllMenus = getAllMenus;
/**
 * GET SINGLE MENU
 */
const getSingleMenu = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid menu ID" });
        }
        const menu = yield Menu_1.default.findById(id).populate("chef", "name email");
        if (!menu) {
            return res.status(404).json({ message: "Menu not found" });
        }
        return res.status(200).json({ data: menu });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
exports.getSingleMenu = getSingleMenu;
/**
 * UPDATE MENU
 */
const updateMenu = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { title, items } = req.body;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid menu ID" });
        }
        const updatedMenu = yield Menu_1.default.findByIdAndUpdate(id, { title, items }, { new: true, runValidators: true });
        if (!updatedMenu) {
            return res.status(404).json({ message: "Menu not found" });
        }
        return res.status(200).json({
            message: "Menu updated successfully",
            data: updatedMenu,
        });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
exports.updateMenu = updateMenu;
/**
 * DELETE MENU
 */
const deleteMenu = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid menu ID" });
        }
        const deletedMenu = yield Menu_1.default.findByIdAndDelete(id);
        if (!deletedMenu) {
            return res.status(404).json({ message: "Menu not found" });
        }
        return res.status(200).json({ message: "Menu deleted successfully" });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
exports.deleteMenu = deleteMenu;
