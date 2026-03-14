import { Router } from "express";
import {
  createServicePricing,
  getServicePricings,
  getServicePricingById,
  updateServicePricing,
  deleteServicePricing
} from "../controllers/services/servicePricing.controller"

const router = Router();

router.post("/servicePricing/create", createServicePricing);
router.get("/servicePricings", getServicePricings);
router.get("/servicePricing/:id", getServicePricingById);
router.put("/servicePricing/:id", updateServicePricing);
router.delete("/servicePricing/:id", deleteServicePricing);

export default router;