"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminAuth_controller_1 = require("../controllers/adminAuthController/adminAuth.controller");
const adminAuth_middleware_1 = require("../middleware/auth/adminAuth.middleware");
const user_controller_1 = require("../controllers/user/user.controller");
const chef_controller_1 = require("../controllers/chef.controller");
const notification_controller_1 = require("../controllers/notification.controller");
const adminBooking_controller_1 = require("../controllers/adminBooking.controller");
const upload_1 = __importDefault(require("../middleware/upload"));
// import { createChef, getAllChefs } from "../controllers/adminChef.controller";
// import {
//   getAllUsers,
//   banUser,
//   unbanUser
// } from "../controllers/adminUser.controller";
const router = express_1.default.Router();
/**
 * @openapi
 * /admin/create:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Create an admin
 *     description: Creates an admin profile and sends a "profile created" notification email to the admin's email address.
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
router.post("/admin/create", adminAuth_middleware_1.requireAdminAuth, adminAuth_middleware_1.requireSuperAdmin, adminAuth_controller_1.createAdmin);
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
router.get("/admin/dashboard", adminAuth_middleware_1.requireAdminAuth, adminAuth_controller_1.getAdminDashboard); // GET /admins?page=1&limit=10
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
router.get("/admin/admins", adminAuth_middleware_1.requireAdminAuth, adminAuth_controller_1.getAdmins); // GET /admins?page=1&limit=10
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
router.get('/admin/users', adminAuth_middleware_1.requireAdminAuth, user_controller_1.getAllUsers);
/**
 * @openapi
 * /admin/users/{id}/status:
 *   patch:
 *     tags:
 *       - Admin
 *     summary: Activate or suspend a user account
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
 *             type: object
 *             required: [isActive]
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: OK
 */
router.patch('/admin/users/:id/status', adminAuth_middleware_1.requireAdminAuth, user_controller_1.updateUserActiveStatus);
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
router.post("/admin/chef", adminAuth_middleware_1.requireAdminAuth, upload_1.default.single("chefPic"), chef_controller_1.createChef);
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
router.get("/admin/chefs", adminAuth_middleware_1.requireAdminAuth, chef_controller_1.getAllChefs);
/**
 * @openapi
 * /admin/chefs/{id}/status:
 *   patch:
 *     tags:
 *       - Admin
 *     summary: Approve, suspend, reject or reset a chef's approval status
 *     description: Setting status to "approved" enables the chef's account (isActive=true). If the chef hasn't verified their email yet, an email verification link is sent so they can confirm their address and sign in.
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
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, approved, suspended, rejected]
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Chef'
 */
router.patch("/admin/chefs/:id/status", adminAuth_middleware_1.requireAdminAuth, chef_controller_1.updateChefStatus);
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
router.get('/admin/notifications', adminAuth_middleware_1.requireAdminAuth, notification_controller_1.getNotifications);
// Bookings
/**
 * @openapi
 * /admin/bookings:
 *   get:
 *     tags:
 *       - Admin
 *     summary: List bookings (filterable by status, paymentStatus, and a text search across booking number / customer / chef name)
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/admin/bookings', adminAuth_middleware_1.requireAdminAuth, adminBooking_controller_1.getAdminBookings);
/**
 * @openapi
 * /admin/bookings/{id}/status:
 *   patch:
 *     tags:
 *       - Admin
 *     summary: Update a booking's status
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
router.patch('/admin/bookings/:id/status', adminAuth_middleware_1.requireAdminAuth, adminBooking_controller_1.updateAdminBookingStatus);
/**
 * @openapi
 * /admin/bookings/{id}/assign-chef:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Manually assign a specific chef to a booking
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
 *             type: object
 *             required: [chefId]
 *             properties:
 *               chefId:
 *                 type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.post('/admin/bookings/:id/assign-chef', adminAuth_middleware_1.requireAdminAuth, adminBooking_controller_1.assignAdminBookingChef);
/**
 * @openapi
 * /admin/bookings/{id}/comments:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Add an internal admin comment to a booking
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
 *             type: object
 *             required: [text]
 *             properties:
 *               text:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/admin/bookings/:id/comments', adminAuth_middleware_1.requireAdminAuth, adminBooking_controller_1.addAdminBookingComment);
/**
 * @openapi
 * /admin/bookings/{id}/payment:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Record a manual payment (cash or bank transfer) for a booking and mark it paid
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
 *             type: object
 *             required: [transactionRef, mode, amount, date]
 *             properties:
 *               transactionRef:
 *                 type: string
 *               mode:
 *                 type: string
 *                 enum: [Cash, Transfer]
 *               bankName:
 *                 type: string
 *               accountNumber:
 *                 type: string
 *               amount:
 *                 type: number
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: OK
 */
router.post('/admin/bookings/:id/payment', adminAuth_middleware_1.requireAdminAuth, adminBooking_controller_1.addAdminBookingPayment);
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
router.get("/admin/:id", adminAuth_middleware_1.requireAdminAuth, adminAuth_controller_1.getAdminById); // GET /admins/:id
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
router.put("/admin/:id", adminAuth_middleware_1.requireAdminAuth, adminAuth_middleware_1.requireSuperAdmin, adminAuth_controller_1.updateAdmin); // PUT /admins/:id
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
router.delete("/admin/:id", adminAuth_middleware_1.requireAdminAuth, adminAuth_middleware_1.requireSuperAdmin, adminAuth_controller_1.deleteAdmin); // DELETE /admins/:id
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
router.get("/admin/user/:id", adminAuth_middleware_1.requireAdminAuth, user_controller_1.getUserById);
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
router.patch("/admin/user/:id", adminAuth_middleware_1.requireAdminAuth, user_controller_1.getUserById);
exports.default = router;
