import { Router } from "express";
import { adminAuth } from "../middleware/adminAuth";
import { 
  createService,
  getServices,
  getServiceById,
  updateService,
  deleteService,
} from "../controllers/services/services.controller";

const router = Router();

router.post("/service/create", createService);
router.get("/service/services", getServices);
router.get("/service/:id", getServiceById);
router.put("/service/:id", updateService);
router.delete("/service/:id", deleteService);


export default router;