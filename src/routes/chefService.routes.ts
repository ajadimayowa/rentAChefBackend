// routes/chefService.routes.ts

import express from "express";
import {
  createChefService,
  getChefServices,
  getChefService,
  updateChefService,
  deleteChefService,
  toggleChefServiceAvailability,
  getServicesByChef
} from "../controllers/services/chefService.controller";

const router = express.Router();

/**
 * @openapi
 * /chefServices/create:
 *   post:
 *     tags:
 *       - Chef Services
 *     summary: Create chef service
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChefServiceCreateRequest'
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChefService'
 */
router.post("/chefServices/create", createChefService);

/**
 * @openapi
 * /chefServices:
 *   get:
 *     tags:
 *       - Chef Services
 *     summary: List chef services
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of records per page
 *       - in: query
 *         name: chefId
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter services by chef id
 *       - in: query
 *         name: isAvailable
 *         required: false
 *         schema:
 *           type: boolean
 *         description: Filter by availability status
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 payload:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ChefService'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     pages:
 *                       type: integer
 */
router.get("/chefServices", getChefServices);

/**
 * @openapi
 * /chefService/{id}:
 *   get:
 *     tags:
 *       - Chef Services
 *     summary: Get chef service by id
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
 *               $ref: '#/components/schemas/ChefService'
 */
router.get("/chefService/:id", getChefService);

/**
 * @openapi
 * /chefService/{id}:
 *   put:
 *     tags:
 *       - Chef Services
 *     summary: Update chef service by id
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
 *             $ref: '#/components/schemas/ChefServiceUpdateRequest'
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChefService'
 */
router.put("/chefService/:id", updateChefService);

/**
 * @openapi
 * /chefService/{id}:
 *   delete:
 *     tags:
 *       - Chef Services
 *     summary: Delete chef service by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.delete("/chefService/:id", deleteChefService);

/**
 * @openapi
 * /chefService/{id}/toggle:
 *   patch:
 *     tags:
 *       - Chef Services
 *     summary: Toggle chef service availability
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.patch("/chefService/:id/toggle", toggleChefServiceAvailability);

/**
 * @openapi
 * /chefServices/byAChef/{chefId}:
 *   get:
 *     tags:
 *       - Chef Services
 *     summary: List services by chef
 *     parameters:
 *       - in: path
 *         name: chefId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ChefService'
 */
router.get("/chefServices/byAChef/:chefId", getServicesByChef);

export default router;