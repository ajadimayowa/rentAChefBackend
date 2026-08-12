"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../../controllers/auth.controller");
const login_routes_1 = __importDefault(require("./login.routes"));
const customer_auth_routes_1 = __importDefault(require("./customer.auth.routes"));
const chef_auth_routes_1 = __importDefault(require("./chef.auth.routes"));
const admin_auth_routes_1 = __importDefault(require("./admin.auth.routes"));
const router = (0, express_1.Router)();
router.use(login_routes_1.default);
router.use(customer_auth_routes_1.default);
router.use(chef_auth_routes_1.default);
router.use(admin_auth_routes_1.default);
/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Get current authenticated identity
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WhoamiResponse'
 */
router.get('/auth/me', auth_controller_1.whoami);
exports.default = router;
