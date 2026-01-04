import express from "express";
import {
    createChef,
    getAllChefs,
    getChefById,
    updateChef,
    disableChef,
    deleteChef,
    loginChef,
} from "../controllers/chef.controller";
import { isAdmin } from "../middleware/isAdmin";
import uploadAdImages from "../middleware/upload";
import { adminAuth } from "../middleware/adminAuth";

// import { isAdmin } from "../middlewares/isAdmin";
// import { protect } from "../middlewares/auth";

const router = express.Router();

// Public / Authenticated
router.get("/chefs", getAllChefs);
router.get("/chef/:id", getChefById);
router.put("/chef/:id", updateChef);

// Admin only
router.post("/chef/register",uploadAdImages.single("chefPic"),adminAuth, createChef);
router.post("/chef/login", loginChef);
router.patch("/chef/disable/:id", isAdmin, disableChef);
router.delete("/chef/:id", isAdmin, deleteChef);

export default router;