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
        const { title, description, price, } = req.body;
        /** Basic validation */
        if (!title || !price) {
            return res.status(400).json({
                message: "Title and price are required",
            });
        }
        const specialMenu = yield SpecialMenu_1.SpecialMenu.create({
            title,
            description,
            image: (menuPic === null || menuPic === void 0 ? void 0 : menuPic.location) || (menuPic === null || menuPic === void 0 ? void 0 : menuPic.path) || "", // depending on S3 or local
            price,
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
                message: "Validation failed",
                errors: Object.values(error.errors).map((err) => err.message),
            });
        }
        res.status(500).json({
            message: "Failed to create special menu",
            error: error.message,
        });
    }
});
exports.createSpecialMenu = createSpecialMenu;
/** GET ALL */
const getAllSpecialMenus = (_, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const menus = yield SpecialMenu_1.SpecialMenu.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, payload: menus });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getAllSpecialMenus = getAllSpecialMenus;
/** GET ONE */
const getSpecialMenuById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const menu = yield SpecialMenu_1.SpecialMenu.findById(req.params.id);
        if (!menu) {
            return res.status(404).json({ message: "Special menu not found" });
        }
        res.status(200).json({ success: true, payload: menu });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.getSpecialMenuById = getSpecialMenuById;
/** UPDATE */
const updateSpecialMenu = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const menu = yield SpecialMenu_1.SpecialMenu.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!menu) {
            return res.status(404).json({ message: "Special menu not found" });
        }
        res.status(200).json(menu);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.updateSpecialMenu = updateSpecialMenu;
/** DELETE */
const deleteSpecialMenu = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const menu = yield SpecialMenu_1.SpecialMenu.findByIdAndDelete(req.params.id);
        if (!menu) {
            return res.status(404).json({ message: "Special menu not found" });
        }
        res.status(200).json({ message: "Special menu deleted successfully" });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.deleteSpecialMenu = deleteSpecialMenu;
const addProcurements = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const procurements = typeof req.body.procurements === "string"
            ? JSON.parse(req.body.procurements)
            : req.body.procurements;
        const menu = yield SpecialMenu_1.SpecialMenu.findByIdAndUpdate(req.params.id, { $push: { procurements: { $each: procurements } } }, { new: true, runValidators: true });
        if (!menu) {
            return res.status(404).json({ message: "Special menu not found" });
        }
        res.status(200).json({
            success: true,
            data: menu,
        });
    }
    catch (error) {
        res.status(400).json({
            message: "Failed to add procurements",
            error: error.message,
        });
    }
});
exports.addProcurements = addProcurements;
