import { Router } from 'express';
import { login } from '../../controllers/auth/adminAuth.controller';

const router = Router();

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
router.post('/admin/login', login);

export default router;
