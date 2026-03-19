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
router.post("/admin/login", adminLogin);
router.post(
  "/admin/create",
  adminAuth,
  superAdminOnly,
  createAdmin
);

router.get("/admin/dashboard",adminAuth, getAdminDashboard);              // GET /admins?page=1&limit=10
router.get("/admin/admins", getAdmins);              // GET /admins?page=1&limit=10
router.get('/admin/users',adminAuth, getAllUsers);
// Chefs
router.post("/admin/chef", adminAuth, createChef);
router.get("/admin/chefs", adminAuth, getAllChefs);
// Get notifications for user (protected)
router.get('/admin/notifications', adminAuth, getNotifications);


router.get("/admin/:id", getAdminById);         // GET /admins/:id
router.put("/admin/:id", updateAdmin);          // PUT /admins/:id
router.delete("/admin/:id", deleteAdmin);       // DELETE /admins/:id

// Users
router.get("/admin/user/:id", adminAuth, getUserById);
router.patch("/admin/user/:id", adminAuth, getUserById);



export default router;
