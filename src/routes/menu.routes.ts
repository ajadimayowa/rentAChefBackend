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

router.post("/", createMenu);
router.get("/", getAllMenus);
router.get("/:id", getSingleMenu);
router.put("/:id", updateMenu);
router.delete("/:id", deleteMenu);

export default router;