"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const procurement_controller_1 = require("../controllers/procurement.controller");
const chefOrAdmin_middleware_1 = require("../middleware/chefOrAdmin.middleware");
const adminOrBookingChef_middleware_1 = require("../middleware/adminOrBookingChef.middleware");
const router = (0, express_1.Router)();
router.post('/procurement/create', procurement_controller_1.createProcurement);
router.get('/procurements', chefOrAdmin_middleware_1.chefOrAdmin, procurement_controller_1.getProcurements);
router.get('/procurement/:id', chefOrAdmin_middleware_1.chefOrAdmin, procurement_controller_1.getProcurement);
// Admins or the chef who owns the booking can update/delete/mark-paid procurements
router.put('/procurement/:id', adminOrBookingChef_middleware_1.adminOrBookingChef, procurement_controller_1.updateProcurement);
router.put('/procurement/:id/mark-paid', adminOrBookingChef_middleware_1.adminOrBookingChef, procurement_controller_1.markProcurementPaid);
router.delete('/procurement/:id', adminOrBookingChef_middleware_1.adminOrBookingChef, procurement_controller_1.deleteProcurement);
exports.default = router;
