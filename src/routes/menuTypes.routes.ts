import { Router } from "express";
import {
    addMenuToMenuType,
    createMenuType,
    deleteMenuType,
    getMenuType,
    getMenuTypes,
    removeMenuFromMenuType,
    updateMenuOnMenuType,
    updateMenuType,
} from "../controllers/menuTypes.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Menu Types
 *   description: Manage package-linked menu collections
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     MenuTypes:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: 686be4f7f2f589f610b1a2c3
 *         title:
 *           type: string
 *           example: Family Festive Menu Set
 *         description:
 *           type: string
 *           example: Curated menu collection for family events and small gatherings.
 *         packageId:
 *           type: string
 *           example: 6869b3a83ab9c5fcb50f92d1
 *         menus:
 *           type: array
 *           items:
 *             type: string
 *           example:
 *             - 6869b67d1bcf7f9e8d2ab102
 *             - 6869b6bb1bcf7f9e8d2ab10c
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /menu-type:
 *   post:
 *     summary: Create a MenuTypes record
 *     tags: [Menu Types]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - packageId
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               packageId:
 *                 type: string
 *               menus:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: MenuTypes created successfully.
 */
router.post("/menu-type", createMenuType);

/**
 * @swagger
 * /menu-types:
 *   get:
 *     summary: Get MenuTypes records with pagination and filters
 *     tags: [Menu Types]
 *     parameters:
 *       - in: query
 *         name: packageId
 *         schema:
 *           type: string
 *         description: Filter by package ID.
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Case-insensitive search by MenuType title.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of records per page.
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, title]
 *           default: createdAt
 *         description: Field to sort by.
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort direction.
 *     responses:
 *       200:
 *         description: MenuTypes retrieved successfully.
 */
router.get("/menu-types", getMenuTypes);

/**
 * @swagger
 * /menu-type/{id}:
 *   get:
 *     summary: Get a MenuTypes record by ID
 *     tags: [Menu Types]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: MenuTypes retrieved successfully.
 *       404:
 *         description: MenuTypes not found.
 */
router.get("/menu-type/:id", getMenuType);

/**
 * @swagger
 * /menu-type/{id}:
 *   put:
 *     summary: Update a MenuTypes record
 *     tags: [Menu Types]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               packageId:
 *                 type: string
 *               menus:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: MenuTypes updated successfully.
 */
router.put("/menu-type/:id", updateMenuType);

/**
 * @swagger
 * /menu-type/{id}:
 *   delete:
 *     summary: Delete a MenuTypes record
 *     tags: [Menu Types]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: MenuTypes deleted successfully.
 */
router.delete("/menu-type/:id", deleteMenuType);

/**
 * @swagger
 * /menu-type/{id}/menus/{menuId}:
 *   post:
 *     summary: Add a menu to a MenuTypes record
 *     tags: [Menu Types]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: menuId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Menu added successfully.
 */
router.post("/menu-type/:id/menus/:menuId", addMenuToMenuType);

/**
 * @swagger
 * /menu-type/{id}/menus/{menuId}:
 *   put:
 *     summary: Replace a menu in a MenuTypes record
 *     tags: [Menu Types]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: menuId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newMenuId
 *             properties:
 *               newMenuId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Menu replaced successfully.
 */
router.put("/menu-type/:id/menus/:menuId", updateMenuOnMenuType);

/**
 * @swagger
 * /menu-type/{id}/menus/{menuId}:
 *   delete:
 *     summary: Remove a menu from a MenuTypes record
 *     tags: [Menu Types]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: menuId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Menu removed successfully.
 */
router.delete("/menu-type/:id/menus/:menuId", removeMenuFromMenuType);

export default router;
