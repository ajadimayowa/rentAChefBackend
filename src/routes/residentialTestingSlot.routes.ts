import { Router } from "express";
import { getResidentialTestingSlots } from "../controllers/booking/residentialTestingSlot.controller";

const router = Router();

/**
 * @openapi
 * /residential/testing-slots:
 *   get:
 *     tags:
 *       - Residential Booking
 *     summary: List upcoming residential chef-testing slots with remaining capacity
 *     responses:
 *       200:
 *         description: OK
 */
router.get("/residential/testing-slots", getResidentialTestingSlots);

export default router;
