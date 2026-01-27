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
exports.deleteMenu = exports.removeProcurementItem = exports.addProcurement = exports.approveMenu = exports.updateMenu = exports.getMenuByChefAndMonth = exports.getMenuById = exports.getMenus = exports.createMenu = void 0;
const Menu_1 = require("../models/Menu");
/* ================= CREATE MENU ================= */
const createMenu = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Menu picture is required" });
        }
        const menuPicFile = req.file; // multer file
        const weeks = JSON.parse(req.body.weeks);
        const menu = yield Menu_1.Menu.create({
            chefId: req.body.chefId,
            month: req.body.month,
            createdBy: req.body.createdBy,
            weeks,
            menuPic: (menuPicFile === null || menuPicFile === void 0 ? void 0 : menuPicFile.location) || (menuPicFile === null || menuPicFile === void 0 ? void 0 : menuPicFile.path) || "",
        });
        res.status(201).json(menu);
    }
    catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "Menu already exists for this chef and month",
            });
        }
        res.status(500).json({ message: error.message });
    }
});
exports.createMenu = createMenu;
/* ================= GET ALL MENUS ================= */
const getMenus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { chefId, month, approved } = req.query;
    const filter = {};
    if (chefId)
        filter.chefId = chefId;
    if (month)
        filter.month = month;
    if (approved !== undefined)
        filter.approved = approved;
    const menus = yield Menu_1.Menu.find(filter)
        .populate("chefId", "name")
        .sort({ createdAt: -1 });
    res.json({ success: true, payload: menus });
});
exports.getMenus = getMenus;
/* ================= GET MENU BY ID ================= */
const getMenuById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const menu = yield Menu_1.Menu.findById(req.params.id)
        .populate("chefId", "name");
    if (!menu) {
        return res.status(404).json({ message: "Menu not found" });
    }
    res.json(menu);
});
exports.getMenuById = getMenuById;
/* ================= GET MENU BY CHEF & MONTH ================= */
const getMenuByChefAndMonth = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { chefId, month } = req.query;
        const menu = yield Menu_1.Menu.findOne({ chefId, month });
        if (!menu) {
            return res.status(404).json({ message: "Menu not found" });
        }
        res.json({ success: true, payload: menu });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getMenuByChefAndMonth = getMenuByChefAndMonth;
/* ================= UPDATE MENU ================= */
const updateMenu = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const updateData = {};
        const menuPicFile = req.file; // multer file
        if (req.body.weeks) {
            updateData.weeks = JSON.parse(req.body.weeks);
        }
        if (req.body.month)
            updateData.month = req.body.month;
        if (req.file) {
            updateData.menuPic = (menuPicFile === null || menuPicFile === void 0 ? void 0 : menuPicFile.location) || (menuPicFile === null || menuPicFile === void 0 ? void 0 : menuPicFile.path) || "";
        }
        const menu = yield Menu_1.Menu.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
        if (!menu) {
            return res.status(404).json({ message: "Menu not found" });
        }
        res.json(menu);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.updateMenu = updateMenu;
/* ================= APPROVE MENU (ADMIN) ================= */
const approveMenu = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const menu = yield Menu_1.Menu.findByIdAndUpdate(req.params.id, { approved: true }, { new: true });
    if (!menu) {
        return res.status(404).json({ message: "Menu not found" });
    }
    res.json(menu);
});
exports.approveMenu = approveMenu;
const addProcurement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { procurement } = req.body;
    const menu = yield Menu_1.Menu.findByIdAndUpdate(req.params.id, {
        $push: { procurement: { $each: procurement } }
    }, { new: true });
    if (!menu) {
        return res.status(404).json({ message: "Menu not found" });
    }
    res.json(menu);
});
exports.addProcurement = addProcurement;
const removeProcurementItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const menu = yield Menu_1.Menu.findByIdAndUpdate(req.params.menuId, {
            $pull: { procurement: { title: req.params.title } },
        }, { new: true });
        if (!menu) {
            return res.status(404).json({ message: "Menu not found" });
        }
        res.json({ success: true, data: menu });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.removeProcurementItem = removeProcurementItem;
/* ================= DELETE MENU ================= */
const deleteMenu = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const menu = yield Menu_1.Menu.findByIdAndDelete(req.params.id);
    if (!menu) {
        return res.status(404).json({ message: "Menu not found" });
    }
    res.json({ message: "Menu deleted successfully" });
});
exports.deleteMenu = deleteMenu;
