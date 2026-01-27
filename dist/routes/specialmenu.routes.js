"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminAuth_1 = require("../middleware/adminAuth");
const upload_1 = __importDefault(require("../middleware/upload"));
const specialMenu_controller_1 = require("../controllers/specialMenu.controller");
// optional: protect with admin/chef middleware
// import { isAdmin } from "../middlewares/isAdmin";
// import { protect } from "../middlewares/auth";
const router = express_1.default.Router();
// router.post("/menu/create", createMenu);
router.post("/specialmenu/create", adminAuth_1.adminAuth, upload_1.default.single("menuPic"), specialMenu_controller_1.createSpecialMenu);
// router.post('/menu/add-items', addItemsToMenu);
router.get("/specialmenu/menus", specialMenu_controller_1.getAllSpecialMenus);
router.get("/specialmenu/:id", specialMenu_controller_1.getSpecialMenuById);
router.put("/specialmenu/:id", specialMenu_controller_1.updateSpecialMenu);
router.delete("/specialmenu/:id", specialMenu_controller_1.deleteSpecialMenu);
router.post("/specialmenu/:menuId/procurement", specialMenu_controller_1.addProcurements);
// router.delete("/specialmenu/:menuId/procurement/:title", removeProcurementItem);
exports.default = router;
