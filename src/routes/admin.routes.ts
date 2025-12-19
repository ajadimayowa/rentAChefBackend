import express from "express";
import { adminLogin, createAdmin } from "../controllers/adminAuthController/adminAuth.controller";
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

// Chefs
// router.post("/chefs", adminAuth, createChef);
// router.get("/chefs", adminAuth, getAllChefs);

// Users
// router.get("/users", adminAuth, getAllUsers);
// router.patch("/users/:id/ban", adminAuth, banUser);
// router.patch("/users/:id/unban", adminAuth, unbanUser);

export default router;
