import { Router } from "express";
import { adminAuth } from "../middleware/adminAuth";
import { 
  createService,
  getServices,
  getServiceById,
  updateService,
  deleteService,
  addServicePlan,
  updateServicePlan,
  deleteServicePlan,
  addOption,
  updateOption,
  deleteOption,
  updateOptions
} from "../controllers/services/services.controller";

const router = Router();

router.post("/service/create", createService);
router.get("/service/services", getServices);
router.get("/service/:id", getServiceById);
router.put("/service/:id", updateService);
router.delete("/service/:id", deleteService);

/* SERVICE PLANS */
router.post("/service/:serviceId/plans", addServicePlan);
router.put("/service/:serviceId/plans/:planId", updateServicePlan);
router.delete("/service/:serviceId/plans/:planId", deleteServicePlan);

/* OPTIONS */
router.post("/service/:serviceId/plans/:planId/options", updateOptions);
router.put("/service/:serviceId/plans/:planId/options/:optionId", updateOption);
router.delete("/service/:serviceId/plans/:planId/options/:optionId", deleteOption);


export default router;