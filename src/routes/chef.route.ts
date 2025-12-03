import express from "express";
import {
    createChef,
    getAllChefs,
    getChefById,
    updateChef,
    disableChef,
    deleteChef,
} from "../controllers/chef.controller";
import { isAdmin } from "../middleware/isAdmin";

// import { isAdmin } from "../middlewares/isAdmin";
// import { protect } from "../middlewares/auth";

const router = express.Router();

// Public / Authenticated
router.get("/chef/all", getAllChefs);
router.get("/chef/:id", getChefById);
router.put("/chef/:id", updateChef);

// Admin only
router.post("/chef/register",isAdmin,createChef);
router.patch("/chef/disable/:id", isAdmin, disableChef);
router.delete("/chef/:id", isAdmin, deleteChef);

export default router;