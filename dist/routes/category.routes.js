"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const category_controller_1 = require("../controllers/category/category.controller");
const category_service_controller_1 = require("../controllers/category/category.service.controller");
const upload_1 = __importDefault(require("../middleware/upload"));
const adminAuth_middleware_1 = require("../middleware/auth/adminAuth.middleware");
const router = (0, express_1.Router)();
// Category CRUD
/**
 * @openapi
 * /category/create:
 *   post:
 *     tags:
 *       - Categories
 *     summary: Create category
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/CategoryCreateRequest'
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 */
router.post("/category/create", adminAuth_middleware_1.requireAdminAuth, upload_1.default.single("catPic"), category_controller_1.createCategory);
// router.post("/chef/register",adminAuth, createChef);
/**
 * @openapi
 * /category/categories:
 *   get:
 *     tags:
 *       - Categories
 *     summary: List categories
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 */
router.get("/category/categories", category_controller_1.getAllCategories);
/**
 * @openapi
 * /category/{id}:
 *   get:
 *     tags:
 *       - Categories
 *     summary: Get category by id
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
 *               $ref: '#/components/schemas/Category'
 */
router.get("/category/:id", category_controller_1.getSingleCategory);
/**
 * @openapi
 * /category/{id}:
 *   put:
 *     tags:
 *       - Categories
 *     summary: Update category by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/CategoryUpdateRequest'
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 */
router.put("/category/:id", category_controller_1.updateCategory);
/**
 * @openapi
 * /category/{id}:
 *   delete:
 *     tags:
 *       - Categories
 *     summary: Delete category by id
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
router.delete("/category/:id", category_controller_1.deleteCategory);
// Category Tasks
/**
 * @openapi
 * /category/{id}/tasks:
 *   post:
 *     tags:
 *       - Categories
 *     summary: Add task to category
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
 *             $ref: '#/components/schemas/CategoryTaskRequest'
 *           example:
 *             task: "Plan weekly family menu"
 *     responses:
 *       200:
 *         description: Task added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 payload:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Invalid payload (task is required)
 *       404:
 *         description: Category not found
 *       409:
 *         description: Task already exists in category
 */
router.post("/category/:id/tasks", category_controller_1.addTaskToCategory);
/**
 * @openapi
 * /category/{id}/tasks/{taskIndex}:
 *   put:
 *     tags:
 *       - Categories
 *     summary: Update category task by index
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: taskIndex
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 0
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryTaskRequest'
 *           example:
 *             task: "Plan monthly meal prep"
 *     responses:
 *       200:
 *         description: Task updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 payload:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Invalid payload or invalid taskIndex
 *       404:
 *         description: Category not found or task not found
 */
router.put("/category/:id/tasks/:taskIndex", category_controller_1.updateCategoryTask);
/**
 * @openapi
 * /category/{id}/tasks/{taskIndex}:
 *   delete:
 *     tags:
 *       - Categories
 *     summary: Delete category task by index
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: taskIndex
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 0
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 payload:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Invalid taskIndex
 *       404:
 *         description: Category not found or task not found
 */
router.delete("/category/:id/tasks/:taskIndex", category_controller_1.deleteCategoryTask);
// Services
/**
 * @openapi
 * /{categoryId}/services:
 *   post:
 *     tags:
 *       - Categories
 *     summary: Add service to category
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryAddServiceRequest'
 *     responses:
 *       200:
 *         description: OK
 */
router.post("/:categoryId/services", category_service_controller_1.addServiceToCategory);
exports.default = router;
