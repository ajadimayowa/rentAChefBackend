"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const servicePricing_controller_1 = require("../controllers/services/servicePricing.controller");
const router = (0, express_1.Router)();
/**
 * @openapi
 * /servicePricing/create:
 *   post:
 *     tags:
 *       - Service Pricing
 *     summary: Create service pricing
 *     description: Requires `chefCategoryId` and exactly one target (`serviceId` or `specialServiceId`). `numberOfDays` and `monthlySubFee` are required when `pricingType` is `daybased`. Sent target IDs are validated for existence.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ServicePricingCreateRequest'
 *           examples:
 *             serviceLevelPricing:
 *               summary: Service-level pricing
 *               value:
 *                 serviceId: "686d53adf9f59b20d4b9da01"
 *                 chefCategoryId: "686d53adf9f59b20d4b9cf99"
 *                 pricingType: "levelbased"
 *                 basePriceMinor: 150000
 *                 currency: "NGN"
 *                 servicePricingOptions:
 *                   - name: "Extra Sauce"
 *                     price: 10000
 *                     description: "Optional add-on"
 *             specialServiceLevelPricing:
 *               summary: Special-service-level pricing
 *               value:
 *                 specialServiceId: "686d53adf9f59b20d4b9da02"
 *                 chefCategoryId: "686d53adf9f59b20d4b9cf99"
 *                 pricingType: "daybased"
 *                 numberOfDays: 2
 *                 monthlySubFee: 25000
 *                 basePriceMinor: 120000
 *                 currency: "NGN"
 *                 servicePricingOptions:
 *                   - name: "Weekend surcharge"
 *                     price: 20000
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServicePricing'
 */
router.post("/servicePricing/create", servicePricing_controller_1.createServicePricing);
/**
 * @openapi
 * /servicePricings:
 *   get:
 *     tags:
 *       - Service Pricing
 *     summary: List service pricing entries
 *     parameters:
 *       - in: query
 *         name: serviceId
 *         schema:
 *           type: string
 *       - in: query
 *         name: specialServiceId
 *         schema:
 *           type: string
 *       - in: query
 *         name: chefCategoryId
 *         schema:
 *           type: string
 *       - in: query
 *         name: pricingType
 *         schema:
 *           type: string
 *           enum: [daybased, levelbased]
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ServicePricing'
 */
router.get("/servicePricings", servicePricing_controller_1.getServicePricings);
/**
 * @openapi
 * /servicePricing/{id}:
 *   get:
 *     tags:
 *       - Service Pricing
 *     summary: Get service pricing by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ServicePricing'
 */
router.get("/servicePricing/:id", servicePricing_controller_1.getServicePricingById);
/**
 * @openapi
 * /servicePricing/{id}:
 *   put:
 *     tags:
 *       - Service Pricing
 *     summary: Update service pricing by id
 *     description: A valid pricing must always include `chefCategoryId` and exactly one target (`serviceId` or `specialServiceId`). `numberOfDays` and `monthlySubFee` are required when `pricingType` resolves to `daybased`. Sent target IDs are validated for existence.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ServicePricingUpdateRequest'
 *           examples:
 *             switchToSpecialService:
 *               summary: Move pricing target to special service
 *               value:
 *                 serviceId: null
 *                 specialServiceId: "686d53adf9f59b20d4b9da02"
 *                 chefCategoryId: "686d53adf9f59b20d4b9cf99"
 *                 pricingType: "daybased"
 *                 numberOfDays: 3
 *                 monthlySubFee: 30000
 *                 basePriceMinor: 130000
 *             serviceLevelPriceAdjustment:
 *               summary: Adjust service-level base price
 *               value:
 *                 serviceId: "686d53adf9f59b20d4b9da01"
 *                 chefCategoryId: "686d53adf9f59b20d4b9cf99"
 *                 pricingType: "levelbased"
 *                 basePriceMinor: 175000
 *                 isActive: true
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ServicePricing'
 */
router.put("/servicePricing/:id", servicePricing_controller_1.updateServicePricing);
/**
 * @openapi
 * /servicePricing/{id}:
 *   delete:
 *     tags:
 *       - Service Pricing
 *     summary: Delete service pricing by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.delete("/servicePricing/:id", servicePricing_controller_1.deleteServicePricing);
exports.default = router;
