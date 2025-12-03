"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const chef_controller_1 = require("../controllers/chef.controller");
const isAdmin_1 = require("../middleware/isAdmin");
// import { isAdmin } from "../middlewares/isAdmin";
// import { protect } from "../middlewares/auth";
const router = express_1.default.Router();
// Public / Authenticated
router.get("/chef/all", chef_controller_1.getAllChefs);
router.get("/chef/:id", chef_controller_1.getChefById);
router.put("/chef/:id", chef_controller_1.updateChef);
// Admin only
router.post("/chef/register", isAdmin_1.isAdmin, chef_controller_1.createChef);
router.patch("/chef/disable/:id", isAdmin_1.isAdmin, chef_controller_1.disableChef);
router.delete("/chef/:id", isAdmin_1.isAdmin, chef_controller_1.deleteChef);
exports.default = router;
