import { Router } from "express";
import {
  createCategory,
  getAllCategories,
  getSingleCategory,
  updateCategory,
  deleteCategory,
  addTaskToCategory,
  updateCategoryTask,
  deleteCategoryTask,
} from "../controllers/category/category.controller";
import { addServiceToCategory } from "../controllers/category/category.service.controller";
import uploadAdImages from "../middleware/upload";
import { adminAuth } from "../middleware/adminAuth";

const router = Router();

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
router.post("/category/create",adminAuth,uploadAdImages.single("catPic"), createCategory);
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
router.get("/category/categories", getAllCategories);
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
router.get("/category/:id", getSingleCategory);
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
router.put("/category/:id", updateCategory);
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
router.delete("/category/:id", deleteCategory);

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
router.post("/category/:id/tasks", addTaskToCategory);
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
router.put("/category/:id/tasks/:taskIndex", updateCategoryTask);
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
router.delete("/category/:id/tasks/:taskIndex", deleteCategoryTask);

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
router.post("/:categoryId/services", addServiceToCategory);

export default router;