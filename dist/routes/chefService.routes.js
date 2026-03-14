"use strict";
// routes/chefService.routes.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const chefService_controller_1 = require("../controllers/services/chefService.controller");
const router = express_1.default.Router();
router.post("/chefServices/create", chefService_controller_1.createChefService);
router.get("/chefServices", chefService_controller_1.getChefServices);
router.get("/chefService/:id", chefService_controller_1.getChefService);
router.put("/chefService/:id", chefService_controller_1.updateChefService);
router.delete("/chefService/:id", chefService_controller_1.deleteChefService);
router.patch("/chefService/:id/toggle", chefService_controller_1.toggleChefServiceAvailability);
router.get("/chefServices/byAChef/:chefId", chefService_controller_1.getServicesByChef);
exports.default = router;
