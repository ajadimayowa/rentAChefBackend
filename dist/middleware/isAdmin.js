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
    const adminSecrete = process.env.ADMIN_SECRET;
    // console.log({seeSec:adminSecrete})
    const { adminPass } = req.body;
    // console.log({seePass:adminPass})
    // if (adminPass !==process.env.ADMIN_SECRET) {
    //   return res.status(401).json({ message: "Not authenticated" });
    // }
    if (adminPass != adminSecrete) {
        return res.status(403).json({ message: "Access denied. Admin only" });
    }
    next();
});
exports.isAdmin = isAdmin;
