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
exports.getUserDashboard = exports.getUserById = exports.getAllUsers = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const User_model_1 = __importDefault(require("../../models/User.model"));
const getAllUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = 1, limit = 10, search = "" } = req.query;
        const pageNum = Math.max(parseInt(page, 10), 1);
        const limitNum = Math.max(parseInt(limit, 10), 1);
        const skip = (pageNum - 1) * limitNum;
        const query = {};
        if (search && typeof search === "string") {
            const regex = new RegExp(search.trim(), "i");
            query.$or = [
                { "profile.fullName": regex },
                { "profile.firstName": regex },
                { "profile.lastName": regex },
                { "contact.email": regex },
                { "contact.phoneNumber": regex },
            ];
        }
        const [total, users] = yield Promise.all([
            User_model_1.default.countDocuments(query),
            User_model_1.default.find(query)
                .skip(skip)
                .limit(limitNum)
                .sort({ createdAt: -1 }),
        ]);
        res.status(200).json({
            message: "Users retrieved successfully",
            meta: {
                total,
                page: pageNum,
                totalPages: Math.ceil(total / limitNum),
                limit: limitNum,
            },
            data: users,
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Error fetching users",
            error,
        });
    }
});
exports.getAllUsers = getAllUsers;
// Get single user by ID
const getUserById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({ message: "Invalid user ID" });
            return;
        }
        const user = yield User_model_1.default.findById(id).select("-profile.password");
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        res.status(200).json({
            message: "User retrieved successfully",
            payload: user,
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Error fetching user",
            error,
        });
    }
});
exports.getUserById = getUserById;
const getUserDashboard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({ message: "Invalid user ID" });
            return;
        }
        const user = yield User_model_1.default.findById(id).select("-profile.password");
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        res.status(200).json({
            message: "User retrieved successfully",
            payload: user,
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Error fetching user",
            error,
        });
    }
});
exports.getUserDashboard = getUserDashboard;
