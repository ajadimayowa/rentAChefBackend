import express from "express";
import { createAdmin, deleteAdmin, getAdminById, getAdminDashboard, getAdmins, updateAdmin } from "../controllers/adminAuthController/adminAuth.controller";
import { requireAdminAuth, requireSuperAdmin } from "../middleware/auth/adminAuth.middleware";
import { getAllUsers, getUserById, updateUserActiveStatus } from "../controllers/user/user.controller";
import { createChef, getAllChefs, updateChefStatus } from "../controllers/chef.controller";
import { getNotifications } from "../controllers/notification.controller";
import {
  getAdminBookings,
  updateAdminBookingStatus,
  assignAdminBookingChef,
  addAdminBookingComment,
  addAdminBookingPayment,
} from "../controllers/adminBooking.controller";
import uploadAdImages from "../middleware/upload";

// import { createChef, getAllChefs } from "../controllers/adminChef.controller";
// import {
//   getAllUsers,
//   banUser,
//   unbanUser
// } from "../controllers/adminUser.controller";

const router = express.Router();

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
router.post(
  "/admin/create",
  requireAdminAuth,
  requireSuperAdmin,
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
router.get("/admin/dashboard",requireAdminAuth, getAdminDashboard);              // GET /admins?page=1&limit=10

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
router.get("/admin/admins", requireAdminAuth, getAdmins);              // GET /admins?page=1&limit=10

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
router.get('/admin/users',requireAdminAuth, getAllUsers);

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
router.patch('/admin/users/:id/status', requireAdminAuth, updateUserActiveStatus);
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
router.post("/admin/chef", requireAdminAuth, uploadAdImages.single("chefPic"), createChef);

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
router.get("/admin/chefs", requireAdminAuth, getAllChefs);

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
router.patch("/admin/chefs/:id/status", requireAdminAuth, updateChefStatus);
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
router.get('/admin/notifications', requireAdminAuth, getNotifications);

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
router.get('/admin/bookings', requireAdminAuth, getAdminBookings);
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
router.patch('/admin/bookings/:id/status', requireAdminAuth, updateAdminBookingStatus);

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
router.post('/admin/bookings/:id/assign-chef', requireAdminAuth, assignAdminBookingChef);

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
router.post('/admin/bookings/:id/comments', requireAdminAuth, addAdminBookingComment);

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
router.post('/admin/bookings/:id/payment', requireAdminAuth, addAdminBookingPayment);


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
router.get("/admin/:id", requireAdminAuth, getAdminById);         // GET /admins/:id
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
router.put("/admin/:id", requireAdminAuth, requireSuperAdmin, updateAdmin);          // PUT /admins/:id
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
router.delete("/admin/:id", requireAdminAuth, requireSuperAdmin, deleteAdmin);       // DELETE /admins/:id

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
router.get("/admin/user/:id", requireAdminAuth, getUserById);
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
router.patch("/admin/user/:id", requireAdminAuth, getUserById);



export default router;
