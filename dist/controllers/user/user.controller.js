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
exports.updateBioData = exports.updateLocation = exports.updateNok = exports.updateHealthInformation = exports.completeKyc = exports.updateProfilePic = exports.getUserDashboard = exports.getUserById = exports.getAllUsers = void 0;
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
            success: true,
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
// Update Profile Picture
const updateProfilePic = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params; // Assuming userId is passed in the URL
    const profilePic = req.file; // multer file
    if (!profilePic) {
        return res.status(400).json({ message: 'Profile picture is required' });
    }
    try {
        const updatedUser = yield User_model_1.default.findByIdAndUpdate(id, { profilePic: (profilePic === null || profilePic === void 0 ? void 0 : profilePic.location) || (profilePic === null || profilePic === void 0 ? void 0 : profilePic.path) || "", }, { new: true, runValidators: true });
        console.log({ seeRecord: { id, pic: profilePic === null || profilePic === void 0 ? void 0 : profilePic.location, path: profilePic === null || profilePic === void 0 ? void 0 : profilePic.path } });
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json({ success: true, message: 'Profile picture updated successfully', updatedUser });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
exports.updateProfilePic = updateProfilePic;
// Complete KYC (Know Your Customer)
const completeKyc = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const idPic = req.file; // multer file
    const { userId } = req.params; // Assuming userId is passed in the URL
    const { idType, idNumber } = req.body;
    if (!idType || !idNumber || !idPic) {
        return res.status(400).json({ message: 'All KYC fields are required' });
    }
    try {
        const updatedUser = yield User_model_1.default.findByIdAndUpdate(userId, {
            kyc: { idType, idNumber, idPicture: (idPic === null || idPic === void 0 ? void 0 : idPic.location) || (idPic === null || idPic === void 0 ? void 0 : idPic.path) || "", },
        }, { new: true, runValidators: true });
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json({ success: true, message: 'KYC completed successfully', updatedUser });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
exports.completeKyc = completeKyc;
// Update Health Information
const updateHealthInformation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params; // Assuming userId is passed in the URL
    const { allergies, healthDetails } = req.body;
    if (!allergies && !healthDetails) {
        return res.status(400).json({ message: 'Health information is required' });
    }
    try {
        const updatedUser = yield User_model_1.default.findByIdAndUpdate(userId, {
            healthInformation: { allergies, healthDetails },
        }, { new: true, runValidators: true });
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json({ success: true, message: 'Health information updated successfully', updatedUser });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
exports.updateHealthInformation = updateHealthInformation;
// Update Next of Kin (NOK)
const updateNok = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params; // Assuming userId is passed in the URL
    const { fullName, phone, relationship } = req.body;
    if (!fullName || !phone || !relationship) {
        return res.status(400).json({ message: 'All NOK fields are required' });
    }
    try {
        const updatedUser = yield User_model_1.default.findByIdAndUpdate(userId, {
            nok: { fullName, phone, relationship },
        }, { new: true, runValidators: true });
        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        return res.status(200).json({ success: true, message: 'Next of kin updated successfully', updatedUser });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
exports.updateNok = updateNok;
// Update Location
const updateLocation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params; // Assuming userId is passed in the URL
    const { home, office, state, city, long, lat } = req.body;
    if (!home && !office && !state && !city && !long && !lat) {
        return res.status(400).json({ message: 'One of the address is required' });
    }
    try {
        const updatedUser = yield User_model_1.default.findByIdAndUpdate(userId, {
            location: { home, office, state, city, long, lat },
        }, { new: true, runValidators: true });
        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        return res.status(200).json({ success: true, message: 'Location updated successfully', updatedUser });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
exports.updateLocation = updateLocation;
// Update Bio Data (Full name, Marital status, etc.)
const updateBioData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params; // Assuming userId is passed in the URL
    const { fullName, dob, maritalStatus, gender, phoneNumber } = req.body;
    if (!fullName && !maritalStatus && !dob) {
        return res.status(400).json({ message: 'At least one field should be provided to update' });
    }
    try {
        const updatedUser = yield User_model_1.default.findByIdAndUpdate(userId, {
            fullName,
            gender,
            dob,
            maritalStatus,
            phone: phoneNumber
        }, { new: true, runValidators: true });
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json({ success: true, message: 'Bio data updated successfully', updatedUser });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
exports.updateBioData = updateBioData;
