// routes/chefService.routes.ts

import express from "express";
import {
  createChefService,
  getChefServices,
  getChefService,
  updateChefService,
  deleteChefService,
  toggleChefServiceAvailability,
  getServicesByChef
} from "../controllers/services/chefService.controller";

const router = express.Router();

router.post("/chefServices/create", createChefService);

router.get("/chefServices", getChefServices);

router.get("/chefService/:id", getChefService);

router.put("/chefService/:id", updateChefService);

router.delete("/chefService/:id", deleteChefService);

router.patch("/chefService/:id/toggle", toggleChefServiceAvailability);

router.get("/chefServices/byAChef/:chefId", getServicesByChef);

export default router;