import { NextFunction, Request, Response, Router } from "express";
import multer from "multer";
import { MAX_UPLOAD_LABEL, createUpload } from "../middleware/upload";
import { requireAdminAuth } from "../middleware/auth/adminAuth.middleware";
import { catalogueHandlers } from "../controllers/settings/catalogue.controller";
import { EventTypeModel, ProteinOptionModel } from "../models/SettingsCatalogue";
import {
  createServiceRate,
  deleteServiceRate,
  listAllServiceRates,
  listServiceRates,
  updateServiceRate,
} from "../controllers/settings/serviceRate.controller";

/*
 * Settings lists. Public GETs return active entries for the app; everything
 * under /settings is admin only.
 */
const router = Router();

const eventTypes = catalogueHandlers(EventTypeModel, "event type");
router.get("/event-types", eventTypes.listActive);
router.get("/settings/event-types", requireAdminAuth, eventTypes.listAll);
router.post("/settings/event-types", requireAdminAuth, eventTypes.create);
router.put("/settings/event-types/:id", requireAdminAuth, eventTypes.update);
router.delete("/settings/event-types/:id", requireAdminAuth, eventTypes.remove);

/** Optional picture upload for a protein option (field "proteinImage", 2 MB max). */
const proteinImageUpload = createUpload("images/protein-options");
const withProteinImage = (req: Request, res: Response, next: NextFunction) =>
  proteinImageUpload.single("proteinImage")(req, res, (err: any) => {
    if (!err) return next();
    const message =
      err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE"
        ? `The picture must be ${MAX_UPLOAD_LABEL} or smaller`
        : err.message || "Could not upload the picture";
    return res.status(400).json({ success: false, message });
  });

const proteins = catalogueHandlers(ProteinOptionModel, "protein option", { imageField: "proteinImage" });
router.get("/protein-options", proteins.listActive);
router.get("/settings/protein-options", requireAdminAuth, proteins.listAll);
router.post("/settings/protein-options", requireAdminAuth, withProteinImage, proteins.create);
router.put("/settings/protein-options/:id", requireAdminAuth, withProteinImage, proteins.update);
router.delete("/settings/protein-options/:id", requireAdminAuth, proteins.remove);

router.get("/service-rates", listServiceRates);
router.get("/settings/service-rates", requireAdminAuth, listAllServiceRates);
router.post("/settings/service-rates", requireAdminAuth, createServiceRate);
router.put("/settings/service-rates/:id", requireAdminAuth, updateServiceRate);
router.delete("/settings/service-rates/:id", requireAdminAuth, deleteServiceRate);

export default router;
