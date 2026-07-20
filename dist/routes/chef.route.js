"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const chef_controller_1 = require("../controllers/chef.controller");
const isAdmin_1 = require("../middleware/isAdmin");
const upload_1 = __importDefault(require("../middleware/upload"));
const adminAuth_1 = require("../middleware/adminAuth");
// import { isAdmin } from "../middlewares/isAdmin";
// import { protect } from "../middlewares/auth";
const router = express_1.default.Router();
/**
 * @openapi
 * /chef/auth/login:
 *   post:
 *     tags:
 *       - Chef
 *     summary: Chef login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChefLoginRequest'
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 */
router.post("/chef/auth/login", chef_controller_1.loginChef);
/**
 * @openapi
 * /chef/auth/request-password-reset-otp:
 *   post:
 *     tags:
 *       - Chef
 *     summary: Request chef password reset OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthPasswordResetRequest'
 *     responses:
 *       200:
 *         description: OK
 */
router.post('/chef/auth/request-password-reset-otp', chef_controller_1.requestChefPasswordChangeOtp);
/**
 * @openapi
 * /chef/auth/reset-password-with-otp:
 *   post:
 *     tags:
 *       - Chef
 *     summary: Reset chef password with OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthResetWithOtpRequest'
 *     responses:
 *       200:
 *         description: OK
 */
router.post('/chef/auth/reset-password-with-otp', chef_controller_1.changeChefPasswordWithOtp);
/**
 * @openapi
 * /chef/dashboard:
 *   post:
 *     tags:
 *       - Chef
 *     summary: Chef dashboard action
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: OK
 */
router.post('/chef/dashboard', chef_controller_1.changeChefPasswordWithOtp);
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
router.get("/chefs", chef_controller_1.getAllChefs);
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
router.get("/chef/:id", chef_controller_1.getChefById);
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
router.put("/chef/:id", adminAuth_1.adminAuth, upload_1.default.single("chefPic"), chef_controller_1.updateChef);
// Admin only
/**
 * @openapi
 * /chef/create:
 *   post:
 *     tags:
 *       - Chef
 *     summary: Create chef (admin)
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
router.post("/chef/create", adminAuth_1.adminAuth, upload_1.default.single("chefPic"), chef_controller_1.createChef);
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
router.patch("/chef/disable/:id", isAdmin_1.isAdmin, chef_controller_1.disableChef);
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
router.delete("/chef/:id", isAdmin_1.isAdmin, chef_controller_1.deleteChef);
exports.default = router;
