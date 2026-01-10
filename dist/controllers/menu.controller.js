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
exports.addItemsToMenu = exports.deleteMenu = exports.updateMenu = exports.getSingleMenu = exports.getMenus = exports.createMenu = void 0;
const Menu_1 = __importDefault(require("../models/Menu"));
const mongoose_1 = require("mongoose");
/**
 * CREATE MENU
 */
const createMenu = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const menuPic = req.file; // multer file
        const { chef, title, items, basePrice } = req.body;
        if (!chef || !title || !menuPic || !basePrice) {
            return res.status(400).json({ message: "Chef, title,picture and base price are required" });
        }
        const menu = yield Menu_1.default.create({
            chef,
            title,
            menuPic: (menuPic === null || menuPic === void 0 ? void 0 : menuPic.location) || (menuPic === null || menuPic === void 0 ? void 0 : menuPic.path) || "", // depending on S3 or local
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
const getMenus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { chefId, price, name, page = "1", limit = "10", } = req.query;
        const filter = {};
        // Filter by chef
        if (chefId) {
            filter.chef = chefId;
        }
        // Filter by max price
        if (price) {
            filter.basePrice = { $lte: Number(price) };
        }
        // Filter by menu name (case-insensitive)
        if (name) {
            filter.title = { $regex: name, $options: "i" };
        }
        const pageNumber = Math.max(Number(page), 1);
        const limitNumber = Math.max(Number(limit), 1);
        const skip = (pageNumber - 1) * limitNumber;
        const [menus, total] = yield Promise.all([
            Menu_1.default.find(filter)
                .populate("chef", "name email")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNumber),
            Menu_1.default.countDocuments(filter),
        ]);
        return res.status(200).json({
            success: true,
            payload: menus,
            pagination: {
                total,
                page: pageNumber,
                limit: limitNumber,
                totalPages: Math.ceil(total / limitNumber),
            },
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
exports.getMenus = getMenus;
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
        return res.status(200).json({ success: true, payload: menu });
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
    const { id } = req.params;
    const menu = yield Menu_1.default.findByIdAndUpdate(id, {
        title: req.body.title,
        basePrice: req.body.basePrice,
        menuPic: req.body.menuPic,
    }, { new: true, runValidators: true });
    if (!menu) {
        return res.status(404).json({ success: false, message: 'Menu not found' });
    }
    res.status(200).json({ success: true, payload: menu });
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
const addItemsToMenu = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { menuId, items } = req.body;
        if (!menuId) {
            return res.status(400).json({
                success: false,
                message: 'menuId is required',
            });
        }
        if (!Array.isArray(items)) {
            return res.status(400).json({
                success: false,
                message: 'Items must be an array',
            });
        }
        if (items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Menu must have at least one item',
            });
        }
        const formattedItems = items.map((item) => ({
            name: item.name,
            price: Number(item.price),
            description: item.description,
        }));
        const menu = yield Menu_1.default.findByIdAndUpdate(menuId, { items: formattedItems }, {
            new: true,
            runValidators: true,
        });
        if (!menu) {
            return res.status(404).json({
                success: false,
                message: 'Menu not found',
            });
        }
        return res.status(200).json({
            success: true,
            message: 'Menu items updated successfully',
            payload: menu,
        });
    }
    catch (error) {
        console.error('Replace items error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update menu items',
        });
    }
});
exports.addItemsToMenu = addItemsToMenu;
