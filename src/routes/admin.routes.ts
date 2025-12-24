import express from "express";
import { adminLogin, createAdmin, deleteAdmin, getAdminById, getAdmins, updateAdmin } from "../controllers/adminAuthController/adminAuth.controller";
import { adminAuth } from "../middleware/adminAuth";
import { superAdminOnly } from "../middleware/superAdminOnly";

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
router.get("/admin/admins", getAdmins);              // GET /admins?page=1&limit=10
router.get("/admin/:id", getAdminById);         // GET /admins/:id
router.put("/admin/:id", updateAdmin);          // PUT /admins/:id
router.delete("/admin/:id", deleteAdmin);       // DELETE /admins/:id

// Chefs
// router.post("/chefs", adminAuth, createChef);
// router.get("/chefs", adminAuth, getAllChefs);

// Users
// router.get("/users", adminAuth, getAllUsers);
// router.patch("/users/:id/ban", adminAuth, banUser);
// router.patch("/users/:id/unban", adminAuth, unbanUser);

export default router;
