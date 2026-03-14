import express from "express";
import {
    createChef,
    getAllChefs,
    getChefById,
    updateChef,
    disableChef,
    deleteChef,
    loginChef,
    checkChefAvailability,
    requestChefPasswordChangeOtp,
    changeChefPasswordWithOtp,
} from "../controllers/chef.controller";
import { isAdmin } from "../middleware/isAdmin";
import uploadAdImages from "../middleware/upload";
import { adminAuth } from "../middleware/adminAuth";

// import { isAdmin } from "../middlewares/isAdmin";
// import { protect } from "../middlewares/auth";

const router = express.Router();

router.post("/chef/auth/login", loginChef);
router.post('/chef/auth/request-password-reset-otp', requestChefPasswordChangeOtp);
router.post('/chef/auth/reset-password-with-otp', changeChefPasswordWithOtp);

router.post('/chef/dashboard', changeChefPasswordWithOtp);

// Public / Authenticated
router.get("/chefs", getAllChefs);
router.get("/chef/:id", getChefById);
router.put("/chef/:id",adminAuth,uploadAdImages.single("chefPic"), updateChef);

// Admin only
router.post("/chef/create",adminAuth,uploadAdImages.single("chefPic"),createChef);
router.patch("/chef/disable/:id", isAdmin, disableChef);
router.delete("/chef/:id", isAdmin, deleteChef);


export default router;