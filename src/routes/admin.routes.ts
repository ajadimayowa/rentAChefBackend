import express from "express";
import { adminLogin, createAdmin, deleteAdmin, getAdminById, getAdminDashboard, getAdmins, updateAdmin } from "../controllers/adminAuthController/adminAuth.controller";
import { adminAuth } from "../middleware/adminAuth";
import { superAdminOnly } from "../middleware/superAdminOnly";
import { getAllUsers, getUserById } from "../controllers/user/user.controller";
import { createChef, getAllChefs } from "../controllers/chef.controller";
import { getNotifications } from "../controllers/notification.controller";

// import { createChef, getAllChefs } from "../controllers/adminChef.controller";
// import {
//   getAllUsers,
//   banUser,
//   unbanUser
// } from "../controllers/adminUser.controller";

const router = express.Router();

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
router.post("/admin/login", adminLogin);

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
router.post(
  "/admin/create",
  adminAuth,
  superAdminOnly,
  createAdmin
);

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
router.get("/admin/dashboard",adminAuth, getAdminDashboard);              // GET /admins?page=1&limit=10

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
router.get("/admin/admins", getAdmins);              // GET /admins?page=1&limit=10

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
router.get('/admin/users',adminAuth, getAllUsers);
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
router.post("/admin/chef", adminAuth, createChef);

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
router.get("/admin/chefs", adminAuth, getAllChefs);
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
router.get('/admin/notifications', adminAuth, getNotifications);


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
router.get("/admin/:id", getAdminById);         // GET /admins/:id
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
router.put("/admin/:id", updateAdmin);          // PUT /admins/:id
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
router.delete("/admin/:id", deleteAdmin);       // DELETE /admins/:id

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
router.get("/admin/user/:id", adminAuth, getUserById);
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
router.patch("/admin/user/:id", adminAuth, getUserById);



export default router;
