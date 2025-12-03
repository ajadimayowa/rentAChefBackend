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
exports.deleteChef = exports.disableChef = exports.updateChef = exports.getChefById = exports.getAllChefs = exports.createChef = void 0;
const Chef_1 = __importDefault(require("../models/Chef"));
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// ✅ Create Chef (ADMIN only)
const createChef = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { staffId, name, gender, email, bio, phoneNumber, specialties, location, state, stateId, defaultPassword } = req.body;
        if (!staffId || !name || !email || !location || !state) {
            return res.status(400).json({ message: "staffId, location,state, phone number, name & email are required" });
        }
        const exists = yield Chef_1.default.findOne({
            $or: [{ email }, { staffId }]
        });
        if (exists) {
            return res.status(400).json({ message: "Chef already exists" });
        }
        // If admin didn't specify password, generate one
        const pass = defaultPassword || "Chef@123";
        const hashedPassword = yield bcryptjs_1.default.hash(pass, 12);
        const chef = yield Chef_1.default.create({
            staffId,
            name,
            gender,
            email,
            bio,
            specialties,
            location,
            state,
            stateId,
            phoneNumber,
            password: hashedPassword,
            isActive: true,
            isPasswordUpdated: false
        });
        return res.status(201).json({
            message: "Chef created successfully",
            defaultPassword: pass, // Send to admin to give the chef
            chef
        });
    }
    catch (error) {
        return res.status(500).json({ message: "Error creating chef", error });
    }
});
exports.createChef = createChef;
// ✅ Get all chefs (ANY authenticated user)
const getAllChefs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const chefs = yield Chef_1.default.find().select('-password');
        // .populate("menus")
        // .sort({ createdAt: -1 });
        return res.status(200).json({ success: true, payload: chefs });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Error fetching chefs", payload: error });
    }
});
exports.getAllChefs = getAllChefs;
// ✅ Get one chef
const getChefById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!mongoose_1.default.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid ID" });
        }
        const chef = yield Chef_1.default.findById(req.params.id);
        // .populate("menus");
        if (!chef) {
            return res.status(404).json({ message: "Chef not found" });
        }
        res.status(200).json({ chef });
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching chef", error });
    }
});
exports.getChefById = getChefById;
// ✅ Update Chef (Admin OR Chef owner)
const updateChef = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const updates = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid ID" });
        }
        const chef = yield Chef_1.default.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (!chef) {
            return res.status(404).json({ message: "Chef not found" });
        }
        res.status(200).json({
            message: "Chef updated successfully",
            chef,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Error updating chef", error });
    }
});
exports.updateChef = updateChef;
// ✅ Disable Chef (ADMIN only)
const disableChef = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const chef = yield Chef_1.default.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
        if (!chef) {
            return res.status(404).json({ message: "Chef not found" });
        }
        res.status(200).json({
            message: "Chef has been disabled",
            chef
        });
    }
    catch (error) {
        res.status(500).json({ message: "Error disabling chef", error });
    }
});
exports.disableChef = disableChef;
// ✅ Delete Chef (ADMIN only)
const deleteChef = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const chef = yield Chef_1.default.findByIdAndDelete(req.params.id);
        if (!chef) {
            return res.status(404).json({ message: "Chef not found" });
        }
        res.status(200).json({
            message: "Chef deleted permanently",
        });
    }
    catch (error) {
        res.status(500).json({ message: "Error deleting chef", error });
    }
});
exports.deleteChef = deleteChef;
