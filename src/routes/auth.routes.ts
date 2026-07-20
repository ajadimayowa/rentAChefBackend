import { Router } from 'express';
// import { register, login } from '../controllers/auth.controller';

import { verifyToken } from '../middleware/auth.middleware';
import { changePasswordWithOtp, chefLogin, login, register, requestPasswordChangeOtp, resendPasswordChangeOtp, verifyEmail, verifyLoginOtp } from '../controllers/chefAuthControllers/auth.controller';
import { whoami } from '../controllers/auth.controller';

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Register a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthRegisterRequest'
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 */
router.post('/auth/register', register);

/**
 * @openapi
 * /auth/verify-email:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Verify email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthVerifyEmailRequest'
 *     responses:
 *       200:
 *         description: OK
 */
router.post('/auth/verify-email', verifyEmail);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Login a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthLoginRequest'
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 */
router.post('/auth/login', login);

/**
 * @openapi
 * /auth/verify-loginOtp:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Verify login OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthVerifyLoginOtpRequest'
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 */
router.post('/auth/verify-loginOtp', verifyLoginOtp);

//password reset
/**
 * @openapi
 * /auth/request-password-reset-otp:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Request password reset OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthPasswordResetRequest'
 *     responses:
 *       200:
 *         description: OK
 */
router.post('/auth/request-password-reset-otp', requestPasswordChangeOtp);

/**
 * @openapi
 * /auth/reset-password-with-otp:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Reset password with OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthResetWithOtpRequest'
 *     responses:
 *       200:
 *         description: OK
 */
router.post('/auth/reset-password-with-otp', changePasswordWithOtp);

/**
 * @openapi
 * /auth/resend-password-reset-otp:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Resend password reset OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthResendOtpRequest'
 *     responses:
 *       200:
 *         description: OK
 */
router.post('/auth/resend-password-reset-otp', resendPasswordChangeOtp);

//chef auth
/**
 * @openapi
 * /auth/chef/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Login a chef
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthLoginRequest'
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 */
router.post('/auth/chef/login', chefLogin);

// get current authenticated identity (user or chef)
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
 *               $ref: '#/components/schemas/UserProfile'
 */
router.get('/auth/me', whoami);



// router.post('/register-staff', (req, res, next) => {
//   Promise.resolve(adminRegisterStaff(req, res)).catch(next);
// });

// router.put('/update-staff', (req, res, next) => {
//   Promise.resolve(adminRegisterStaff(req, res)).catch(next);
// });

// router.post('/verify-email', (req, res, next) => {
//   Promise.resolve(adminRegisterStaff(req, res)).catch(next);
// });




// router.post('/login', (req, res, next) => {
//   Promise.resolve(staffLogin(req, res)).catch(next);
// });

// router.post('/verify-login-otp', (req, res, next) => {
//   Promise.resolve(verifyOtp(req, res)).catch(next);
// });

export default router;