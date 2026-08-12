import express from "express";
import { requireAdminAuth } from "../middleware/auth/adminAuth.middleware";
import uploadAdImages from "../middleware/upload";

import { addProcurements, createSpecialMenu,deleteSpecialMenu,getAllSpecialMenus, getSpecialMenuById, updateSpecialMenu } from "../controllers/specialMenu.controller";

// optional: protect with admin/chef middleware
// import { isAdmin } from "../middlewares/isAdmin";
// import { protect } from "../middlewares/auth";

const router = express.Router();

/**
 * @openapi
 * /specialmenu/create:
 *   post:
 *     tags:
 *       - Special Menus
 *     summary: Create special menu
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/SpecialMenuCreateRequest'
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SpecialMenuResponse'
 */
router.post("/specialmenu/create", uploadAdImages.single("menuPic"), createSpecialMenu);

/**
 * @openapi
 * /specialmenu/menus:
 *   get:
 *     tags:
 *       - Special Menus
 *     summary: List special menus
 *     description: Use query params for search and pagination, e.g. `/specialmenu/menus?name=dinner&page=1&limit=10`.
 *     parameters:
 *       - in: query
 *         name: name
 *         required: false
 *         schema:
 *           type: string
 *         description: Search text applied to title and description
 *       - in: query
 *         name: search
 *         required: false
 *         schema:
 *           type: string
 *         description: Alternative search key (same behavior as name)
 *       - in: query
 *         name: q
 *         required: false
 *         schema:
 *           type: string
 *         description: Alternative search key (same behavior as name)
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for paginated listing
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 10
 *         description: Number of records per page
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SpecialMenusResponse'
 */
router.get("/specialmenu/menus", getAllSpecialMenus);

/**
 * @openapi
 * /specialmenu/{id}:
 *   get:
 *     tags:
 *       - Special Menus
 *     summary: Get special menu by id
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
 *               $ref: '#/components/schemas/SpecialMenuResponse'
 */
router.get("/specialmenu/:id", getSpecialMenuById);

/**
 * @openapi
 * /specialmenu/{id}:
 *   put:
 *     tags:
 *       - Special Menus
 *     summary: Update special menu by id
 *     security:
 *       - bearerAuth: []
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
 *             $ref: '#/components/schemas/SpecialMenuUpdateRequest'
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SpecialMenuResponse'
 */
router.put("/specialmenu/:id", requireAdminAuth, uploadAdImages.single("menuPic"), updateSpecialMenu);

/**
 * @openapi
 * /specialmenu/{id}:
 *   delete:
 *     tags:
 *       - Special Menus
 *     summary: Delete special menu by id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SpecialMenuDeleteResponse'
 */
router.delete("/specialmenu/:id", requireAdminAuth, deleteSpecialMenu);

/**
 * @openapi
 * /specialmenu/{menuId}/procurement:
 *   post:
 *     tags:
 *       - Special Menus
 *     summary: Add procurement items to a special menu
 *     security:
 *       - bearerAuth: []
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
 *             $ref: '#/components/schemas/SpecialMenuAddProcurementsRequest'
 *     responses:
 *       200:
 *         description: Updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SpecialMenuResponse'
 */
router.post("/specialmenu/:menuId/procurement", requireAdminAuth, addProcurements);
// router.delete("/specialmenu/:menuId/procurement/:title", removeProcurementItem);

export default router;