"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const menu_controller_1 = require("../controllers/menu.controller");
const adminAuth_1 = require("../middleware/adminAuth");
const upload_1 = __importDefault(require("../middleware/upload"));
// optional: protect with admin/chef middleware
// import { isAdmin } from "../middlewares/isAdmin";
// import { protect } from "../middlewares/auth";
const router = express_1.default.Router();
// router.post("/menu/create", createMenu);
router.post("/menu/create", adminAuth_1.adminAuth, upload_1.default.single("menuPic"), menu_controller_1.createMenu);
router.post('/menu/add-items', menu_controller_1.addItemsToMenu);
router.get("/menu/getMenus", menu_controller_1.getMenus);
router.get("/menu/:id", menu_controller_1.getSingleMenu);
router.put("/menu/:id", menu_controller_1.updateMenu);
router.delete("/menu/:id", menu_controller_1.deleteMenu);
exports.default = router;
