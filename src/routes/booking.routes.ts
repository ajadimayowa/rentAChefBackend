import { Router } from 'express';
import {
  assignChef,
  confirmPaymentWebhook,
  createBooking,
  createChefMenu,
  generateQuotation,
  getWorkflowDefinitions,
  initializeInstantPayment,
  initializeQuotationPayment,
  listBookings,
  registerUploadedMenu,
} from '../controllers/booking.controller';
import { getBookingDetail } from '../controllers/bookingDetail.controller';
import { verifyUserToken } from '../middleware/auth.middleware';

const router = Router();

/**
 * @openapi
 * /workflows:
 *   get:
 *     tags:
 *       - Chef Platform
 *     summary: List configured booking workflows
 */
router.get('/workflows', getWorkflowDefinitions);

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
router.post('/bookings', createBooking);

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
router.get('/bookings', listBookings);

/**
 * @openapi
 * /bookings/{id}:
 *   get:
 *     tags:
 *       - Chef Platform
 *     summary: Get a single booking — shared by the admin/chef/customer "view booking" pages. Admins can view any booking; chefs and customers only their own.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 *       403:
 *         description: Not the booking's chef/customer, and not an admin
 *       404:
 *         description: Booking not found
 */
router.get('/bookings/:id', verifyUserToken, getBookingDetail);

/**
 * @openapi
 * /quotations:
 *   post:
 *     tags:
 *       - Chef Platform
 *     summary: Generate quotation for a booking
 */
router.post('/quotations', generateQuotation);

/**
 * @openapi
 * /payments/instant/init:
 *   post:
 *     tags:
 *       - Chef Platform
 *     summary: Initialize payment for instant booking
 */
router.post('/payments/instant/init', initializeInstantPayment);

/**
 * @openapi
 * /payments/quotation/init:
 *   post:
 *     tags:
 *       - Chef Platform
 *     summary: Initialize payment for quotation booking
 */
router.post('/payments/quotation/init', initializeQuotationPayment);

/**
 * @openapi
 * /payments/webhook/{reference}:
 *   post:
 *     tags:
 *       - Chef Platform
 *     summary: Confirm payment by reference
 */
router.post('/payments/webhook/:reference', confirmPaymentWebhook);

/**
 * @openapi
 * /bookings/{bookingId}/assign-chef:
 *   post:
 *     tags:
 *       - Chef Platform
 *     summary: Auto-assign a chef to booking
 */
router.post('/bookings/:bookingId/assign-chef', assignChef);

/**
 * @openapi
 * /menus/chef:
 *   post:
 *     tags:
 *       - Chef Platform
 *     summary: Create chef menu
 */
router.post('/menus/chef', createChefMenu);

/**
 * @openapi
 * /menus/uploaded:
 *   post:
 *     tags:
 *       - Chef Platform
 *     summary: Register uploaded customer menu metadata
 */
router.post('/menus/uploaded', registerUploadedMenu);

export default router;
