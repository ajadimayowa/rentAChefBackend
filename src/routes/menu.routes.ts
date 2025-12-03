import express from "express";
import {
  createMenu,
  getAllMenus,
  getSingleMenu,
  updateMenu,
  deleteMenu,
} from "../controllers/menu.controller";

// optional: protect with admin/chef middleware
// import { isAdmin } from "../middlewares/isAdmin";
// import { protect } from "../middlewares/auth";

const router = express.Router();

router.post("/menu/create", createMenu);
router.get("/menu/all", getAllMenus);
router.get("menu/:id", getSingleMenu);
router.put("menu/:id", updateMenu);
router.delete("menu/:id", deleteMenu);

export default router;