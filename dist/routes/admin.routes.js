"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminAuth_controller_1 = require("../controllers/adminAuthController/adminAuth.controller");
const adminAuth_1 = require("../middleware/adminAuth");
const superAdminOnly_1 = require("../middleware/superAdminOnly");
const user_controller_1 = require("../controllers/user/user.controller");
const chef_controller_1 = require("../controllers/chef.controller");
const notification_controller_1 = require("../controllers/notification.controller");
// import { createChef, getAllChefs } from "../controllers/adminChef.controller";
// import {
//   getAllUsers,
//   banUser,
//   unbanUser
// } from "../controllers/adminUser.controller";
const router = express_1.default.Router();
// Auth
/**
 * @openapi
 * /admin/login:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Admin login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminLoginRequest'
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 */
router.post("/admin/login", adminAuth_controller_1.adminLogin);
/**
 * @openapi
 * /admin/create:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Create an admin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminCreateRequest'
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminProfile'
 */
router.post("/admin/create", adminAuth_1.adminAuth, superAdminOnly_1.superAdminOnly, adminAuth_controller_1.createAdmin);
/**
 * @openapi
 * /admin/dashboard:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get admin dashboard metrics
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminDashboard'
 */
router.get("/admin/dashboard", adminAuth_1.adminAuth, adminAuth_controller_1.getAdminDashboard); // GET /admins?page=1&limit=10
/**
 * @openapi
 * /admin/admins:
 *   get:
 *     tags:
 *       - Admin
 *     summary: List admins
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AdminProfile'
 */
router.get("/admin/admins", adminAuth_controller_1.getAdmins); // GET /admins?page=1&limit=10
/**
 * @openapi
 * /admin/users:
 *   get:
 *     tags:
 *       - Admin
 *     summary: List users
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserProfile'
 */
router.get('/admin/users', adminAuth_1.adminAuth, user_controller_1.getAllUsers);
// Chefs
/**
 * @openapi
 * /admin/chef:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Create a chef (admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
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
router.post("/admin/chef", adminAuth_1.adminAuth, chef_controller_1.createChef);
/**
 * @openapi
 * /admin/chefs:
 *   get:
 *     tags:
 *       - Admin
 *     summary: List chefs
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
router.get("/admin/chefs", adminAuth_1.adminAuth, chef_controller_1.getAllChefs);
// Get notifications for user (protected)
/**
 * @openapi
 * /admin/notifications:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get notifications
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/admin/notifications', adminAuth_1.adminAuth, notification_controller_1.getNotifications);
/**
 * @openapi
 * /admin/{id}:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get admin by id
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
 *               $ref: '#/components/schemas/AdminProfile'
 */
router.get("/admin/:id", adminAuth_controller_1.getAdminById); // GET /admins/:id
/**
 * @openapi
 * /admin/{id}:
 *   put:
 *     tags:
 *       - Admin
 *     summary: Update admin by id
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
 *             $ref: '#/components/schemas/AdminCreateRequest'
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminProfile'
 */
router.put("/admin/:id", adminAuth_controller_1.updateAdmin); // PUT /admins/:id
/**
 * @openapi
 * /admin/{id}:
 *   delete:
 *     tags:
 *       - Admin
 *     summary: Delete admin by id
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
router.delete("/admin/:id", adminAuth_controller_1.deleteAdmin); // DELETE /admins/:id
// Users
/**
 * @openapi
 * /admin/user/{id}:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get user by id
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
 *               $ref: '#/components/schemas/UserProfile'
 */
router.get("/admin/user/:id", adminAuth_1.adminAuth, user_controller_1.getUserById);
/**
 * @openapi
 * /admin/user/{id}:
 *   patch:
 *     tags:
 *       - Admin
 *     summary: Update user by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 */
router.patch("/admin/user/:id", adminAuth_1.adminAuth, user_controller_1.getUserById);
exports.default = router;
