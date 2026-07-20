import { Router } from "express";
import {
    createPackage,
    getPackages,
    getPackage,
    deletePackage,
    addMenuToPackage,
    removeMenuFromPackage,
    updatePackage,
} from "../controllers/package.controller";
import uploadAdImages from "../middleware/upload";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Packages
 *   description: Package Management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Package:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: 6869b3a83ab9c5fcb50f92d1
 *         title:
 *           type: string
 *           example: Family Feast
 *         description:
 *           type: string
 *           example: Perfect package for family dinners and gatherings.
 *         packageImage:
 *           type: string
 *           example: https://cdn.alase.com/packages/family-feast.jpg
 *         menus:
 *           type: array
 *           items:
 *             type: string
 *           example:
 *             - 6869b67d1bcf7f9e8d2ab102
 *             - 6869b6bb1bcf7f9e8d2ab10c
 */

/**
 * @swagger
 * /package:
 *   post:
 *     summary: Create a package
 *     tags: [Packages]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *                 example: Family Feast
 *               description:
 *                 type: string
 *                 example: Complete package suitable for families.
 *               packageImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Package created successfully.
 *       400:
 *         description: Invalid request.
 */
router.post(
    "/package",
    uploadAdImages.single("packageImage"),
    createPackage
);

/**
 * @swagger
 * /packages:
 *   get:
 *     summary: Get all packages
 *     tags: [Packages]
 *     responses:
 *       200:
 *         description: List of packages.
 */
router.get("/packages", getPackages);

/**
 * @swagger
 * /package/{id}:
 *   get:
 *     summary: Get package by ID
 *     tags: [Packages]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Package retrieved successfully.
 *       404:
 *         description: Package not found.
 */
router.get("/package/:id", getPackage);

/**
 * @swagger
 * /package/{id}:
 *   put:
 *     summary: Update package
 *     tags: [Packages]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Premium Family Feast
 *               description:
 *                 type: string
 *                 example: Updated package description.
 *               packageImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Package updated successfully.
 *       404:
 *         description: Package not found.
 */
router.put(
    "/package/:id",
    uploadAdImages.single("packageImage"),
    updatePackage
);

/**
 * @swagger
 * /package/{id}:
 *   delete:
 *     summary: Delete package
 *     tags: [Packages]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Package deleted successfully.
 *       404:
 *         description: Package not found.
 */
router.delete("/package/:id", deletePackage);

/**
 * @swagger
 * /package/{packageId}/menus/{menuId}:
 *   post:
 *     summary: Add a menu to a package
 *     tags: [Packages]
 *     parameters:
 *       - in: path
 *         name: packageId
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
 *         description: Menu added to package successfully.
 *       404:
 *         description: Package or Menu not found.
 */
router.post(
    "/package/:packageId/menus/:menuId",
    addMenuToPackage
);

/**
 * @swagger
 * /package/{packageId}/menus/{menuId}:
 *   delete:
 *     summary: Remove a menu from a package
 *     tags: [Packages]
 *     parameters:
 *       - in: path
 *         name: packageId
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
 *         description: Menu removed from package successfully.
 *       404:
 *         description: Package or Menu not found.
 */
router.delete(
    "/package/:packageId/menus/:menuId",
    removeMenuFromPackage
);

export default router;