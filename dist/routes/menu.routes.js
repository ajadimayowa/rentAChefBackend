"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const menu_controller_1 = require("../controllers/menu.controller");
// optional: protect with admin/chef middleware
// import { isAdmin } from "../middlewares/isAdmin";
// import { protect } from "../middlewares/auth";
const router = express_1.default.Router();
router.post("/menu/create", menu_controller_1.createMenu);
router.get("/menu/all", menu_controller_1.getAllMenus);
router.get("menu/:id", menu_controller_1.getSingleMenu);
router.put("menu/:id", menu_controller_1.updateMenu);
router.delete("menu/:id", menu_controller_1.deleteMenu);
exports.default = router;
