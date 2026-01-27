"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const services_controller_1 = require("../controllers/services/services.controller");
const router = (0, express_1.Router)();
router.post("/service/create", services_controller_1.createService);
router.get("/service/services", services_controller_1.getServices);
router.get("/service/:id", services_controller_1.getServiceById);
router.put("/service/:id", services_controller_1.updateService);
router.delete("/service/:id", services_controller_1.deleteService);
/* SERVICE PLANS */
router.post("/service/:serviceId/plans", services_controller_1.addServicePlan);
router.put("/service/:serviceId/plans/:planId", services_controller_1.updateServicePlan);
router.delete("/service/:serviceId/plans/:planId", services_controller_1.deleteServicePlan);
/* OPTIONS */
router.post("/service/:serviceId/plans/:planId/options", services_controller_1.updateOptions);
router.put("/service/:serviceId/plans/:planId/options/:optionId", services_controller_1.updateOption);
router.delete("/service/:serviceId/plans/:planId/options/:optionId", services_controller_1.deleteOption);
exports.default = router;
