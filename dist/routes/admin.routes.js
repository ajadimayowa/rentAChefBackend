"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminAuth_controller_1 = require("../controllers/adminAuthController/adminAuth.controller");
const adminAuth_1 = require("../middleware/adminAuth");
const superAdminOnly_1 = require("../middleware/superAdminOnly");
// import { createChef, getAllChefs } from "../controllers/adminChef.controller";
// import {
//   getAllUsers,
//   banUser,
//   unbanUser
// } from "../controllers/adminUser.controller";
const router = express_1.default.Router();
// Auth
router.post("/admin/login", adminAuth_controller_1.adminLogin);
router.post("/admin/create", adminAuth_1.adminAuth, superAdminOnly_1.superAdminOnly, adminAuth_controller_1.createAdmin);
// Chefs
// router.post("/chefs", adminAuth, createChef);
// router.get("/chefs", adminAuth, getAllChefs);
// Users
// router.get("/users", adminAuth, getAllUsers);
// router.patch("/users/:id/ban", adminAuth, banUser);
// router.patch("/users/:id/unban", adminAuth, unbanUser);
exports.default = router;
