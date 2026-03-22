"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const procurement_controller_1 = require("../controllers/procurement.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const chefOrAdmin_middleware_1 = require("../middleware/chefOrAdmin.middleware");
const adminOrBookingChef_middleware_1 = require("../middleware/adminOrBookingChef.middleware");
const router = (0, express_1.Router)();
router.post('/procurement/create', procurement_controller_1.createProcurement);
router.get('/procurements', chefOrAdmin_middleware_1.chefOrAdmin, procurement_controller_1.getProcurements);
router.get('/procurement/:id', chefOrAdmin_middleware_1.chefOrAdmin, procurement_controller_1.getProcurement);
// Admins or the chef who owns the booking can update/delete/mark-paid procurements
router.put('/procurement/:id', adminOrBookingChef_middleware_1.adminOrBookingChef, procurement_controller_1.updateProcurement);
router.put('/procurement/:id/mark-paid', procurement_controller_1.markProcurementPaid);
// Allow booking customer to pay procurement using paystack
router.post('/procurement/:id/pay', auth_middleware_1.verifyUserToken, procurement_controller_1.userPayProcurement);
router.delete('/procurement/:id', procurement_controller_1.deleteProcurement);
exports.default = router;
