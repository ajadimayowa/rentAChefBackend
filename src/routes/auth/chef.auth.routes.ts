import { Router } from 'express';
import { login } from '../../controllers/auth/chefAuth.controller';

const router = Router();

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
router.post('/auth/chef/login', login);

export default router;
