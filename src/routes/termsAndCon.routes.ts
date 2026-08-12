import { Router } from "express";
import {
  createTermsAndCon,
  getTermsAndCons,
  getTermsAndConById,
  updateTermsAndCon,
  deleteTermsAndCon,
} from "../controllers/termsAndCon/termsAndCon.controller";
import { requireAdminAuth } from "../middleware/auth/adminAuth.middleware";

const router = Router();

/**
 * @openapi
 * /terms-and-con/create:
 *   post:
 *     tags:
 *       - Terms And Conditions
 *     summary: Create terms and conditions record
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TermsAndConCreateRequest'
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TermsAndConResponse'
 */
router.post("/terms-and-con/create", requireAdminAuth, createTermsAndCon);

/**
 * @openapi
 * /terms-and-con/records:
 *   get:
 *     tags:
 *       - Terms And Conditions
 *     summary: List terms and conditions records
 *     parameters:
 *       - in: query
 *         name: serviceId
 *         schema:
 *           type: string
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *       - in: query
 *         name: specialMenuId
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TermsAndConsResponse'
 */
router.get("/terms-and-con/records", getTermsAndCons);

/**
 * @openapi
 * /terms-and-con/{id}:
 *   get:
 *     tags:
 *       - Terms And Conditions
 *     summary: Get terms and conditions record by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TermsAndConResponse'
 */
router.get("/terms-and-con/:id", getTermsAndConById);

/**
 * @openapi
 * /terms-and-con/{id}:
 *   put:
 *     tags:
 *       - Terms And Conditions
 *     summary: Update terms and conditions record by id
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
 *             $ref: '#/components/schemas/TermsAndConUpdateRequest'
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TermsAndConResponse'
 */
router.put("/terms-and-con/:id", requireAdminAuth, updateTermsAndCon);

/**
 * @openapi
 * /terms-and-con/{id}:
 *   delete:
 *     tags:
 *       - Terms And Conditions
 *     summary: Delete terms and conditions record by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TermsAndConDeleteResponse'
 */
router.delete("/terms-and-con/:id", requireAdminAuth, deleteTermsAndCon);

export default router;
