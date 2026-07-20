import { Router } from "express";
import {
  createServiceCategory,
  getServiceCategories,
  getServiceCategoryById,
  updateServiceCategory,
  deleteServiceCategory,
} from "../controllers/services/serviceCategory.controller";

const router = Router();

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
router.post("/service-category/create", createServiceCategory);
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
router.get("/service-category/categories", getServiceCategories);
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
router.get("/service-category/:id", getServiceCategoryById);
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
router.put("/service-category/:id", updateServiceCategory);
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
router.delete("/service-category/:id", deleteServiceCategory);

export default router;
