import express from "express";
import {
    createChef,
    getAllChefs,
    getChefById,
    getChefDashboard,
    getChefBookings,
    updateChef,
    disableChef,
    deleteChef,
    checkChefAvailability,
} from "../controllers/chef.controller";
import { getAllChefLevels } from "../controllers/chefLevel.controller";
import { isAdmin } from "../middleware/isAdmin";
import uploadAdImages from "../middleware/upload";
import { requireAdminAuth } from "../middleware/auth/adminAuth.middleware";
import { requireChefAuth } from "../middleware/auth/chefAuth.middleware";

// import { isAdmin } from "../middlewares/isAdmin";
// import { protect } from "../middlewares/auth";

const router = express.Router();

// Public / Authenticated
/**
 * @openapi
 * /chefs:
 *   get:
 *     tags:
 *       - Chef
 *     summary: List chefs
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number (default 1)
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Items per page (default 10)
 *       - in: query
 *         name: location
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter chefs by location (also accepts `lga`)
 *       - in: query
 *         name: state
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter chefs by state (also accepts `stateName`)
 *       - in: query
 *         name: isActive
 *         required: false
 *         schema:
 *           type: boolean
 *         description: Filter chefs by active status (also accepts `active`; supports true/false/1/0/yes/no)
 *       - in: query
 *         name: name
 *         required: false
 *         schema:
 *           type: string
 *         description: Case-insensitive partial match on chef name (also accepts `search` or `q`)
 *       - in: query
 *         name: category
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by category id or exact category name (also accepts `categoryId`, `categoryName`, `chefCategoryId`)
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Chef'
 */
router.get("/chefs", getAllChefs);
/**
 * @openapi
 * /chef/levels:
 *   get:
 *     tags:
 *       - Chef
 *     summary: List chef levels
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ChefLevel'
 */
router.get("/chef/levels", getAllChefLevels);
/**
 * @openapi
 * /chef/dashboard:
 *   get:
 *     tags:
 *       - Chef
 *     summary: Get the logged-in chef's dashboard summary
 *     responses:
 *       200:
 *         description: OK
 */
router.get("/chef/dashboard", requireChefAuth, getChefDashboard);
/**
 * @openapi
 * /chef/bookings:
 *   get:
 *     tags:
 *       - Chef
 *     summary: List the logged-in chef's bookings
 *     responses:
 *       200:
 *         description: OK
 */
router.get("/chef/bookings", requireChefAuth, getChefBookings);
/**
 * @openapi
 * /chef/{id}:
 *   get:
 *     tags:
 *       - Chef
 *     summary: Get chef by id
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
 *               $ref: '#/components/schemas/Chef'
 */
router.get("/chef/:id", getChefById);
/**
 * @openapi
 * /chef/{id}:
 *   put:
 *     tags:
 *       - Chef
 *     summary: Update chef by id
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
 *             $ref: '#/components/schemas/ChefUpdateRequest'
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Chef'
 */
router.put("/chef/:id",requireAdminAuth,uploadAdImages.single("chefPic"), updateChef);

// Admin only
/**
 * @openapi
 * /chef/create:
 *   post:
 *     tags:
 *       - Chef
 *     summary: Create chef (admin)
 *     description: Creates a chef profile and sends a "profile created" notification email to the chef, including their default/temporary password and a reminder to update it.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/ChefCreateRequest'
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Chef'
 */
router.post("/chef/create",requireAdminAuth,uploadAdImages.single("chefPic"),createChef);
/**
 * @openapi
 * /chef/disable/{id}:
 *   patch:
 *     tags:
 *       - Chef
 *     summary: Disable chef by id
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
router.patch("/chef/disable/:id", isAdmin, disableChef);
/**
 * @openapi
 * /chef/{id}:
 *   delete:
 *     tags:
 *       - Chef
 *     summary: Delete chef by id
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
router.delete("/chef/:id", isAdmin, deleteChef);


export default router;