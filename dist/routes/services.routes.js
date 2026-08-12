"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const services_controller_1 = require("../controllers/services/services.controller");
const adminAuth_middleware_1 = require("../middleware/auth/adminAuth.middleware");
const router = (0, express_1.Router)();
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
router.post("/service/create", adminAuth_middleware_1.requireAdminAuth, services_controller_1.createService);
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
router.get("/service/services", services_controller_1.getServices);
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
router.get("/service/:id", services_controller_1.getServiceById);
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
router.put("/service/:id", adminAuth_middleware_1.requireAdminAuth, services_controller_1.updateService);
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
router.delete("/service/:id", adminAuth_middleware_1.requireAdminAuth, services_controller_1.deleteService);
exports.default = router;
