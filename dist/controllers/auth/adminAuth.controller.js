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
exports.login = void 0;
const auth_service_1 = require("../../services/auth/auth.service");
const Category_1 = __importDefault(require("../../models/Category"));
const Service_1 = require("../../models/Service");
const handleAuthError = (res, error, fallbackMessage) => {
    if (error instanceof auth_service_1.AuthError) {
        return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error(error);
    return res.status(500).json({ success: false, message: fallbackMessage });
};
/** Admin login is single-step: password → token, enriched with category/service lookups the admin dashboard needs on boot. */
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { email, password } = req.body;
        const admin = yield (0, auth_service_1.authenticateWithPassword)('Admin', email, password);
        const token = (0, auth_service_1.signAuthToken)({ id: admin._id, role: (_a = admin.adminDetails) === null || _a === void 0 ? void 0 : _a.role });
        const [categories, services] = yield Promise.all([
            Category_1.default.find().select('_id name').lean(),
            Service_1.ServiceModel.find().select('_id name').lean(),
        ]);
        const formattedCategories = categories.map((cat) => ({ label: cat.name, value: cat._id }));
        const formattedServices = services.map((service) => ({ name: service.name, id: service._id }));
        return res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            payload: {
                id: admin._id,
                fullName: admin.fullName,
                email: admin.email,
                role: (_b = admin.adminDetails) === null || _b === void 0 ? void 0 : _b.role,
                formattedCategories,
                formattedServices,
            },
        });
    }
    catch (error) {
        return handleAuthError(res, error, 'Server error');
    }
});
exports.login = login;
