import express from "express";
import {
  createMenu,
  getMenuById,
  updateMenu,
  deleteMenu,
  getMenus,
  addProcurement,
  removeProcurementItem
} from "../controllers/menu.controller";
import { adminAuth } from "../middleware/adminAuth";
import uploadAdImages from "../middleware/upload";

// optional: protect with admin/chef middleware
// import { isAdmin } from "../middlewares/isAdmin";
// import { protect } from "../middlewares/auth";

const router = express.Router();

// router.post("/menu/create", createMenu);
router.post("/menu/create", adminAuth, uploadAdImages.single("menuPic"), createMenu);
// router.post('/menu/add-items', addItemsToMenu);
router.get("/menu/getMenus", getMenus);
router.get("/menu/:id", getMenuById);
router.put("/menu/:id", updateMenu);
router.delete("/menu/:id", deleteMenu);

router.post("/:menuId/procurement", addProcurement);
router.delete("/:menuId/procurement/:title", removeProcurementItem);

export default router;