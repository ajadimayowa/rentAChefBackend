"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chefAuth_controller_1 = require("../../controllers/auth/chefAuth.controller");
const router = (0, express_1.Router)();
/**
 * @openapi
 * /auth/chef/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Login a chef (single-step, password in / token out)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChefLoginRequest'
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChefAuthResponse'
 */
router.post('/auth/chef/login', chefAuth_controller_1.login);
exports.default = router;
