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
exports.addProcurements = exports.deleteSpecialMenu = exports.updateSpecialMenu = exports.getSpecialMenuById = exports.getAllSpecialMenus = exports.createSpecialMenu = void 0;
const SpecialMenu_1 = require("../models/SpecialMenu");
/** CREATE */
const createSpecialMenu = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const menuPic = req.file; // multer file
        const { title, description, minimumGuests, numberOfDishes, price, } = req.body;
        /** Basic validation */
        if (!title || !minimumGuests || !numberOfDishes || !price) {
            return res.status(400).json({
                success: false,
                message: "title, minimumGuests, numberOfDishes and price are required",
            });
        }
        const specialMenu = yield SpecialMenu_1.SpecialMenu.create({
            title,
            description,
            minimumGuests: Number(minimumGuests),
            numberOfDishes: Number(numberOfDishes),
            image: (menuPic === null || menuPic === void 0 ? void 0 : menuPic.location) || (menuPic === null || menuPic === void 0 ? void 0 : menuPic.path) || "", // depending on S3 or local
            price: Number(price),
        });
        res.status(201).json({
            success: true,
            data: specialMenu,
        });
    }
    catch (error) {
        /** Mongoose validation errors */
        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: Object.values(error.errors).map((err) => err.message),
            });
        }
        res.status(500).json({
            success: false,
            message: "Failed to create special menu",
            error: error.message,
        });
    }
});
exports.createSpecialMenu = createSpecialMenu;
/** GET ALL */
const getAllSpecialMenus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const parsedPage = Number(req.query.page);
        const parsedLimit = Number(req.query.limit);
        const page = Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1;
        const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.floor(parsedLimit) : 10;
        const rawSearch = (_b = (_a = req.query.name) !== null && _a !== void 0 ? _a : req.query.search) !== null && _b !== void 0 ? _b : req.query.q;
        const search = typeof rawSearch === "string" ? rawSearch.trim() : "";
        const filter = {};
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
            ];
        }
        const skip = (page - 1) * limit;
        const [menus, total] = yield Promise.all([
            SpecialMenu_1.SpecialMenu.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            SpecialMenu_1.SpecialMenu.countDocuments(filter),
        ]);
        const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
        res.status(200).json({
            success: true,
            data: menus,
            payload: menus,
            meta: {
                total,
                limit,
                page,
                totalPages,
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.getAllSpecialMenus = getAllSpecialMenus;
/** GET ONE */
const getSpecialMenuById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const menu = yield SpecialMenu_1.SpecialMenu.findById(req.params.id);
        if (!menu) {
            return res.status(404).json({ success: false, message: "Special menu not found" });
        }
        res.status(200).json({ success: true, data: menu });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
exports.getSpecialMenuById = getSpecialMenuById;
/** UPDATE */
const updateSpecialMenu = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const menuPic = req.file;
        const updatePayload = Object.assign({}, req.body);
        if ((menuPic === null || menuPic === void 0 ? void 0 : menuPic.location) || (menuPic === null || menuPic === void 0 ? void 0 : menuPic.path)) {
            updatePayload.image = (menuPic === null || menuPic === void 0 ? void 0 : menuPic.location) || (menuPic === null || menuPic === void 0 ? void 0 : menuPic.path);
        }
        if (Object.prototype.hasOwnProperty.call(updatePayload, "minimumGuests")) {
            updatePayload.minimumGuests = Number(updatePayload.minimumGuests);
        }
        if (Object.prototype.hasOwnProperty.call(updatePayload, "numberOfDishes")) {
            updatePayload.numberOfDishes = Number(updatePayload.numberOfDishes);
        }
        if (Object.prototype.hasOwnProperty.call(updatePayload, "price")) {
            updatePayload.price = Number(updatePayload.price);
        }
        const menu = yield SpecialMenu_1.SpecialMenu.findByIdAndUpdate(req.params.id, updatePayload, { new: true, runValidators: true });
        if (!menu) {
            return res.status(404).json({ success: false, message: "Special menu not found" });
        }
        res.status(200).json({ success: true, data: menu });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
exports.updateSpecialMenu = updateSpecialMenu;
/** DELETE */
const deleteSpecialMenu = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const menu = yield SpecialMenu_1.SpecialMenu.findByIdAndDelete(req.params.id);
        if (!menu) {
            return res.status(404).json({ success: false, message: "Special menu not found" });
        }
        res.status(200).json({ success: true, message: "Special menu deleted successfully" });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
exports.deleteSpecialMenu = deleteSpecialMenu;
const addProcurements = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const procurements = typeof req.body.procurements === "string"
            ? JSON.parse(req.body.procurements)
            : req.body.procurements;
        const menu = yield SpecialMenu_1.SpecialMenu.findByIdAndUpdate(req.params.menuId, { $push: { procurements: { $each: procurements } } }, { new: true, runValidators: true });
        if (!menu) {
            return res.status(404).json({ success: false, message: "Special menu not found" });
        }
        res.status(200).json({
            success: true,
            data: menu,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to add procurements",
            error: error.message,
        });
    }
});
exports.addProcurements = addProcurements;
