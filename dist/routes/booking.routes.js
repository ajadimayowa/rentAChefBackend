"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const booking_controller_1 = require("../controllers/booking.controller");
const router = (0, express_1.Router)();
/**
 * @openapi
 * /workflows:
 *   get:
 *     tags:
 *       - Chef Platform
 *     summary: List configured booking workflows
 */
router.get('/workflows', booking_controller_1.getWorkflowDefinitions);
/**
 * @openapi
 * /bookings:
 *   post:
 *     tags:
 *       - Chef Platform
 *     summary: Create unified booking with workflow-specific bookingData
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CPBookingCreateRequest'
 */
router.post('/bookings', booking_controller_1.createBooking);
/**
 * @openapi
 * /bookings:
 *   get:
 *     tags:
 *       - Chef Platform
 *     summary: List unified bookings
 *     parameters:
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *       - in: query
 *         name: workflow
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *       - in: query
 *         name: bookingNumber
 *         schema:
 *           type: string
 *         description: Exact booking number filter.
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Case-insensitive text search on booking number and transaction reference.
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
 *         description: Paginated bookings fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CPBookingsResponse'
 */
router.get('/bookings', booking_controller_1.listBookings);
/**
 * @openapi
 * /quotations:
 *   post:
 *     tags:
 *       - Chef Platform
 *     summary: Generate quotation for a booking
 */
router.post('/quotations', booking_controller_1.generateQuotation);
/**
 * @openapi
 * /payments/instant/init:
 *   post:
 *     tags:
 *       - Chef Platform
 *     summary: Initialize payment for instant booking
 */
router.post('/payments/instant/init', booking_controller_1.initializeInstantPayment);
/**
 * @openapi
 * /payments/quotation/init:
 *   post:
 *     tags:
 *       - Chef Platform
 *     summary: Initialize payment for quotation booking
 */
router.post('/payments/quotation/init', booking_controller_1.initializeQuotationPayment);
/**
 * @openapi
 * /payments/webhook/{reference}:
 *   post:
 *     tags:
 *       - Chef Platform
 *     summary: Confirm payment by reference
 */
router.post('/payments/webhook/:reference', booking_controller_1.confirmPaymentWebhook);
/**
 * @openapi
 * /bookings/{bookingId}/assign-chef:
 *   post:
 *     tags:
 *       - Chef Platform
 *     summary: Auto-assign a chef to booking
 */
router.post('/bookings/:bookingId/assign-chef', booking_controller_1.assignChef);
/**
 * @openapi
 * /menus/chef:
 *   post:
 *     tags:
 *       - Chef Platform
 *     summary: Create chef menu
 */
router.post('/menus/chef', booking_controller_1.createChefMenu);
/**
 * @openapi
 * /menus/uploaded:
 *   post:
 *     tags:
 *       - Chef Platform
 *     summary: Register uploaded customer menu metadata
 */
router.post('/menus/uploaded', booking_controller_1.registerUploadedMenu);
exports.default = router;
