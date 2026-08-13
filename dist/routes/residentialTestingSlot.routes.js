"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const residentialTestingSlot_controller_1 = require("../controllers/booking/residentialTestingSlot.controller");
const router = (0, express_1.Router)();
/**
 * @openapi
 * /residential/testing-slots:
 *   get:
 *     tags:
 *       - Residential Booking
 *     summary: List upcoming residential chef-testing slots with remaining capacity
 *     responses:
 *       200:
 *         description: OK
 */
router.get("/residential/testing-slots", residentialTestingSlot_controller_1.getResidentialTestingSlots);
exports.default = router;
