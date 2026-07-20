"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const serviceCategory_controller_1 = require("../controllers/services/serviceCategory.controller");
const router = (0, express_1.Router)();
/**
 * @openapi
 * /service-category/create:
 *   post:
 *     tags:
 *       - Service Categories
 *     summary: Create service category
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ServiceCategoryCreateRequest'
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServiceCategoryResponse'
 */
router.post("/service-category/create", serviceCategory_controller_1.createServiceCategory);
/**
 * @openapi
 * /service-category/categories:
 *   get:
 *     tags:
 *       - Service Categories
 *     summary: List service categories
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServiceCategoriesResponse'
 */
router.get("/service-category/categories", serviceCategory_controller_1.getServiceCategories);
/**
 * @openapi
 * /service-category/{id}:
 *   get:
 *     tags:
 *       - Service Categories
 *     summary: Get service category by id
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
 *               $ref: '#/components/schemas/ServiceCategoryResponse'
 */
router.get("/service-category/:id", serviceCategory_controller_1.getServiceCategoryById);
/**
 * @openapi
 * /service-category/{id}:
 *   put:
 *     tags:
 *       - Service Categories
 *     summary: Update service category by id
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
 *             $ref: '#/components/schemas/ServiceCategoryUpdateRequest'
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServiceCategoryResponse'
 */
router.put("/service-category/:id", serviceCategory_controller_1.updateServiceCategory);
/**
 * @openapi
 * /service-category/{id}:
 *   delete:
 *     tags:
 *       - Service Categories
 *     summary: Delete service category by id
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
 *               $ref: '#/components/schemas/ServiceCategoryDeleteResponse'
 */
router.delete("/service-category/:id", serviceCategory_controller_1.deleteServiceCategory);
exports.default = router;
