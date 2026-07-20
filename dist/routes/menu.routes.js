"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const menu_controller_1 = require("../controllers/menu.controller");
const upload_1 = __importDefault(require("../middleware/upload"));
const router = (0, express_1.Router)();
/**
 * @swagger
 * tags:
 *   name: Menus
 *   description: Menu Management
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     Grocery:
 *       type: object
 *       properties:
 *         groceryName:
 *           type: string
 *           example: Chicken Breast
 *         description:
 *           type: string
 *           example: Fresh chicken breast
 *         unitPrice:
 *           type: number
 *           example: 3000
 */
/**
 * @swagger
 * /menu:
 *   post:
 *     summary: Create a new menu
 *     tags: [Menus]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - menuCreatorType
 *               - title
 *               - description
 *               - menuType
 *               - pricePerHead
 *               - relatedServiceId
 *             properties:
 *               relatedServiceId:
 *                 type: string
 *                 description: The ID of the related service.
 *                 example: 68679b98b42d1f3d89bcb312
 *               menuCreatorType:
 *                 type: string
 *                 enum:
 *                   - chef
 *                   - organization
 *               title:
 *                 type: string
 *                 example: Sunday Special
 *               description:
 *                 type: string
 *                 example: Smoky party jollof rice with grilled chicken.
 *               samplePicture:
 *                 type: string
 *                 format: binary
 *               isSignatureMenu:
 *                 type: boolean
 *                 example: true
 *                 description: Only applicable when menuCreatorType is chef.
 *               menuType:
 *                 type: string
 *                 enum:
 *                   - breakfast
 *                   - lunch
 *                   - dinner
 *               menuClass:
 *                 type: string
 *                 enum:
 *                   - nigerian
 *                   - continental
 *               pricingModel:
 *                 type: string
 *                 enum:
 *                   - perhead
 *                   - plater
 *               menuCategory:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of MenuTypes IDs this menu belongs to.
 *               pricePerHead:
 *                 type: number
 *                 example: 6500
 *               chefId:
 *                 type: string
 *                 description: Required only for chef menus.
 *                 example: 68679b98b42d1f3d89bcb312
 *     responses:
 *       201:
 *         description: Menu created successfully.
 */
router.post("/menu", upload_1.default.single("samplePicture"), menu_controller_1.createMenu);
/**
 * @swagger
 * /menus:
 *   get:
 *     summary: Get all menus
 *     tags: [Menus]
 *     parameters:
 *       - in: query
 *         name: chefId
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by chef ID.
 *       - in: query
 *         name: packageId
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by package ID.
 *       - in: query
 *         name: menuCreatorType
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - chef
 *             - organization
 *         description: Filter by menu creator type.
 *       - in: query
 *         name: isSignatureMenu
 *         required: false
 *         schema:
 *           type: boolean
 *         description: Filter signature menus (true or false).
 *       - in: query
 *         name: menuType
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - breakfast
 *             - lunch
 *             - dinner
 *         description: Filter by menu type.
 *       - in: query
 *         name: menuClass
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - nigerian
 *             - continental
 *       - in: query
 *         name: pricingModel
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - perhead
 *             - plater
 *         description: Filter by pricing model.
 *       - in: query
 *         name: menuCategory
 *         required: false
 *         schema:
 *           type: string
 *         description: Comma-separated menu category IDs.
 *       - in: query
 *         name: hasGroceries
 *         required: false
 *         schema:
 *           type: boolean
 *         description: Filter menus with groceries (true) or without groceries (false).
 *       - in: query
 *         name: search
 *         required: false
 *         schema:
 *           type: string
 *         description: Case-insensitive search on title and description.
 *       - in: query
 *         name: sortBy
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - createdAt
 *             - updatedAt
 *             - title
 *             - pricePerHead
 *             - totalGroceryCost
 *           default: createdAt
 *         description: Field to sort results by.
 *       - in: query
 *         name: sortOrder
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - asc
 *             - desc
 *           default: desc
 *         description: Sort direction.
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination.
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 10
 *         description: Number of results per page.
 *     responses:
 *       200:
 *         description: Menus retrieved successfully
 */
router.get("/menus", menu_controller_1.getMenus);
/**
 * @swagger
 * /menus/{id}:
 *   get:
 *     summary: Get Menu by ID
 *     tags: [Menus]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Menu retrieved successfully
 *       404:
 *         description: Menu not found
 */
router.get("/menu/:id", menu_controller_1.getMenu);
/**
 * @swagger
 * /menu/{id}:
 *   put:
 *     summary: Update a menu
 *     tags: [Menus]
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
 *               menuCreatorType:
 *                 type: string
 *                 enum:
 *                   - chef
 *                   - organization
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               samplePicture:
 *                 type: string
 *                 format: binary
 *               isSignatureMenu:
 *                 type: boolean
 *               menuType:
 *                 type: string
 *                 enum:
 *                   - breakfast
 *                   - lunch
 *                   - dinner
 *               menuClass:
 *                 type: string
 *                 enum:
 *                   - nigerian
 *                   - continental
 *               pricingModel:
 *                 type: string
 *                 enum:
 *                   - perhead
 *                   - plater
 *               menuCategory:
 *                 type: array
 *                 items:
 *                   type: string
 *               pricePerHead:
 *                 type: number
 *               chefId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Menu updated successfully.
 *       404:
 *         description: Menu not found.
 */
router.put("/menu/:id", upload_1.default.single("samplePicture"), menu_controller_1.updateMenu);
/**
 * @swagger
 * /menu/{id}:
 *   delete:
 *     summary: Delete Menu
 *     tags: [Menus]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Menu deleted successfully
 *       404:
 *         description: Menu not found
 */
router.delete("/menu/:id", menu_controller_1.deleteMenu);
/**
 * @swagger
 * /menu/{menuId}/groceries:
 *   post:
 *     summary: Add a grocery to a menu
 *     tags: [Menus]
 *     parameters:
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
 *               - groceryName
 *               - unitPrice
 *             properties:
 *               groceryName:
 *                 type: string
 *               description:
 *                 type: string
 *               unitPrice:
 *                 type: number
 *     responses:
 *       201:
 *         description: Grocery added successfully.
 */
router.post("/menu/:menuId/groceries", menu_controller_1.addGrocery);
/**
 * @swagger
 * /menu/{menuId}/groceries/{groceryId}:
 *   put:
 *     summary: Update a grocery
 *     tags: [Menus]
 *     parameters:
 *       - in: path
 *         name: menuId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: groceryId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               groceryName:
 *                 type: string
 *               description:
 *                 type: string
 *               unitPrice:
 *                 type: number
 *     responses:
 *       200:
 *         description: Grocery updated successfully.
 */
router.put("/menu/:menuId/groceries/:groceryId", menu_controller_1.updateGrocery);
/**
 * @swagger
 * /menu/{menuId}/groceries/{groceryId}:
 *   delete:
 *     summary: Remove a grocery from a menu
 *     tags: [Menus]
 *     parameters:
 *       - in: path
 *         name: menuId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: groceryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Grocery removed successfully.
 */
router.delete("/menu/:menuId/groceries/:groceryId", menu_controller_1.deleteGrocery);
router.post("/menu/:menuId/packages/:packageId", menu_controller_1.addMenuToPackage);
router.delete("/menu/:menuId/packages/:packageId", menu_controller_1.removeMenuFromPackage);
exports.default = router;
