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
exports.isAdmin = void 0;
const isAdmin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const adminSecret = process.env.ADMIN_SECRET;
    const adminPass = (_a = req.body) === null || _a === void 0 ? void 0 : _a.adminPass;
    console.log({ see: adminPass });
    if (!adminPass) {
        return res.status(400).json({ message: "adminPass missing from request body" });
    }
    if (adminPass !== adminSecret) {
        return res.status(403).json({ message: "Access denied. Admin only" });
    }
    next();
});
exports.isAdmin = isAdmin;
