import express from "express";
import {
  createQuote,
  getQuotes,
  getQuote,
  updateQuote,
  deleteQuote,
  replyToQuote,
} from "../controllers/quotes/quote.controller";
import { verifyToken } from "../middleware/auth.middleware";
import { adminOnly } from "../middleware/admin.middleware";

const router = express.Router();

/**
 * @openapi
 * /quote/create:
 *   post:
 *     tags:
 *       - Quotes
 *     summary: Create a special quote request (customer)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/QuoteCreateRequest'
 *     responses:
 *       201:
 *         description: Quote request created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QuoteResponse'
 */
router.post("/quote/create", verifyToken, createQuote);

/**
 * @openapi
 * /quotes:
 *   get:
 *     tags:
 *       - Quotes
 *     summary: Get paginated quote requests
 *     description: Customers get only their own quotes. Admin can filter by customerId.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, RESPONDED, CLOSED]
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *         description: Admin filter for customer quotes.
 *     responses:
 *       200:
 *         description: Quotes fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QuotesResponse'
 */
router.get("/quotes", verifyToken, getQuotes);

/**
 * @openapi
 * /quote/{id}:
 *   get:
 *     tags:
 *       - Quotes
 *     summary: Get one quote request by id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quote fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QuoteResponse'
 */
router.get("/quote/:id", verifyToken, getQuote);

/**
 * @openapi
 * /quote/{id}:
 *   put:
 *     tags:
 *       - Quotes
 *     summary: Update a quote request or add admin response
 *     security:
 *       - bearerAuth: []
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
 *             $ref: '#/components/schemas/QuoteUpdateRequest'
 *     responses:
 *       200:
 *         description: Quote updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QuoteResponse'
 */
router.put("/quote/:id", verifyToken, updateQuote);

/**
 * @openapi
 * /quote/{id}/reply:
 *   patch:
 *     tags:
 *       - Quotes
 *     summary: Reply to a quote request (admin only)
 *     security:
 *       - bearerAuth: []
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
 *             $ref: '#/components/schemas/QuoteReplyRequest'
 *     responses:
 *       200:
 *         description: Quote reply saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QuoteResponse'
 */
router.patch("/quote/:id/reply", verifyToken, adminOnly, replyToQuote);

/**
 * @openapi
 * /quote/{id}:
 *   delete:
 *     tags:
 *       - Quotes
 *     summary: Delete a quote request
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quote deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Quote deleted successfully
 */
router.delete("/quote/:id", verifyToken, deleteQuote);

export default router;