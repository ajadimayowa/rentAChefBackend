"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const assignedBookingNumber_controller_1 = require("../controllers/assignedBookingNumber.controller");
const router = (0, express_1.Router)();
/**
 * @openapi
 * /assigned-booking-number:
 *   post:
 *     tags:
 *       - Assigned Booking Numbers
 *     summary: Create the next assigned booking number for a service
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssignedBookingNumberCreateRequest'
 *     responses:
 *       201:
 *         description: Assigned booking number created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AssignedBookingNumberResponse'
 */
router.post("/assigned-booking-number", assignedBookingNumber_controller_1.createAssignedBookingNumber);
/**
 * @openapi
 * /assigned-booking-numbers:
 *   get:
 *     tags:
 *       - Assigned Booking Numbers
 *     summary: Get assigned booking numbers with optional filters
 *     parameters:
 *       - in: query
 *         name: serviceId
 *         schema:
 *           type: string
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *       - in: query
 *         name: bookingId
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Assigned booking numbers fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AssignedBookingNumbersResponse'
 */
router.get("/assigned-booking-numbers", assignedBookingNumber_controller_1.getAssignedBookingNumbers);
/**
 * @openapi
 * /assigned-booking-number/{id}:
 *   get:
 *     tags:
 *       - Assigned Booking Numbers
 *     summary: Get one assigned booking number by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Assigned booking number fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AssignedBookingNumberResponse'
 */
router.get("/assigned-booking-number/:id", assignedBookingNumber_controller_1.getAssignedBookingNumber);
/**
 * @openapi
 * /assigned-booking-number/{id}:
 *   put:
 *     tags:
 *       - Assigned Booking Numbers
 *     summary: Update assigned booking number fields including attaching bookingId
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssignedBookingNumberUpdateRequest'
 *     responses:
 *       200:
 *         description: Assigned booking number updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AssignedBookingNumberResponse'
 */
router.put("/assigned-booking-number/:id", assignedBookingNumber_controller_1.updateAssignedBookingNumber);
/**
 * @openapi
 * /assigned-booking-number/{id}:
 *   delete:
 *     tags:
 *       - Assigned Booking Numbers
 *     summary: Delete an assigned booking number
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Assigned booking number deleted successfully.
 */
router.delete("/assigned-booking-number/:id", assignedBookingNumber_controller_1.deleteAssignedBookingNumber);
exports.default = router;
