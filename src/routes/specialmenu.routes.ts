import express from "express";
import { adminAuth } from "../middleware/adminAuth";
import uploadAdImages from "../middleware/upload";

import { addProcurements, createSpecialMenu,deleteSpecialMenu,getAllSpecialMenus, getSpecialMenuById, updateSpecialMenu } from "../controllers/specialMenu.controller";

// optional: protect with admin/chef middleware
// import { isAdmin } from "../middlewares/isAdmin";
// import { protect } from "../middlewares/auth";

const router = express.Router();

// router.post("/menu/create", createMenu);
router.post("/specialmenu/create", adminAuth, uploadAdImages.single("menuPic"), createSpecialMenu);
// router.post('/menu/add-items', addItemsToMenu);
router.get("/specialmenu/menus", getAllSpecialMenus);
router.get("/specialmenu/:id", getSpecialMenuById);
router.put("/specialmenu/:id", updateSpecialMenu);
router.delete("/specialmenu/:id", deleteSpecialMenu);

router.post("/specialmenu/:menuId/procurement", addProcurements);
// router.delete("/specialmenu/:menuId/procurement/:title", removeProcurementItem);

export default router;