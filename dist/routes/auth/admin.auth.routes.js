"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminAuth_controller_1 = require("../../controllers/auth/adminAuth.controller");
const router = (0, express_1.Router)();
/**
 * @openapi
 * /admin/login:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Admin login (single-step, password in / token out). Also bootstraps category/service pickers for the dashboard.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminLoginRequest'
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminAuthResponse'
 */
router.post('/admin/login', adminAuth_controller_1.login);
exports.default = router;
