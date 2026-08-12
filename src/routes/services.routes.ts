import { Router } from "express";
import {
  createService,
  getServices,
  getServiceById,
  updateService,
  deleteService,
} from "../controllers/services/services.controller";
import { requireAdminAuth } from "../middleware/auth/adminAuth.middleware";

const router = Router();

/**
 * @openapi
 * /service/create:
 *   post:
 *     tags:
 *       - Services
 *     summary: Create a service
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ServiceCreateRequest'
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServiceResponse'
 */
router.post("/service/create", requireAdminAuth, createService);

/**
 * @openapi
 * /service/services:
 *   get:
 *     tags:
 *       - Services
 *     summary: List services
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServicesResponse'
 */
router.get("/service/services", getServices);

/**
 * @openapi
 * /service/{id}:
 *   get:
 *     tags:
 *       - Services
 *     summary: Get service by id
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
 *               $ref: '#/components/schemas/ServiceResponse'
 */
router.get("/service/:id", getServiceById);

/**
 * @openapi
 * /service/{id}:
 *   put:
 *     tags:
 *       - Services
 *     summary: Update service by id
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
 *             $ref: '#/components/schemas/ServiceUpdateRequest'
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServiceResponse'
 */
router.put("/service/:id", requireAdminAuth, updateService);

/**
 * @openapi
 * /service/{id}:
 *   delete:
 *     tags:
 *       - Services
 *     summary: Delete service by id
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
 *               $ref: '#/components/schemas/ServiceDeleteResponse'
 */
router.delete("/service/:id", requireAdminAuth, deleteService);


export default router;