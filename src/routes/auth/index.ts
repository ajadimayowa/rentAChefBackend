import { Router } from 'express';
import { whoami } from '../../controllers/auth.controller';
import loginRoutes from './login.routes';
import customerAuthRoutes from './customer.auth.routes';
import chefAuthRoutes from './chef.auth.routes';
import adminAuthRoutes from './admin.auth.routes';

const router = Router();

router.use(loginRoutes);
router.use(customerAuthRoutes);
router.use(chefAuthRoutes);
router.use(adminAuthRoutes);

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
router.get('/auth/me', whoami);

export default router;
