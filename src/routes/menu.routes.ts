import express from "express";
import {
  createMenu,
  getSingleMenu,
  updateMenu,
  deleteMenu,
  getMenus,
} from "../controllers/menu.controller";
import { adminAuth } from "../middleware/adminAuth";
import uploadAdImages from "../middleware/upload";

// optional: protect with admin/chef middleware
// import { isAdmin } from "../middlewares/isAdmin";
// import { protect } from "../middlewares/auth";

const router = express.Router();

// router.post("/menu/create", createMenu);
router.post("/menu/create",adminAuth,uploadAdImages.single("menuPic"),createMenu);
router.get("/menu/getMenus", getMenus);
router.get("menu/:id", getSingleMenu);
router.put("menu/:id", updateMenu);
router.delete("menu/:id", deleteMenu);

export default router;