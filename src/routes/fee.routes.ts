import { Router } from "express";
import { requireAdminAuth } from "../middleware/auth/adminAuth.middleware";
import { createFee, deleteFee, listFees, listServiceFees, updateFee } from "../controllers/fees/fee.controller";

/* Settings → Fees. Managing fees is admin only. */
const router = Router();

// Customers see the active fees for the service they're booking.
router.get("/fees/service/:serviceId", listServiceFees);

router.get("/fees", requireAdminAuth, listFees);
router.post("/fees", requireAdminAuth, createFee);
router.put("/fees/:id", requireAdminAuth, updateFee);
router.delete("/fees/:id", requireAdminAuth, deleteFee);

export default router;
