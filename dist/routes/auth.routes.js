"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/chefAuthControllers/auth.controller");
const auth_controller_2 = require("../controllers/auth.controller");
const router = (0, express_1.Router)();
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
router.post('/auth/register', auth_controller_1.register);
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
router.post('/auth/verify-email', auth_controller_1.verifyEmail);
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
router.post('/auth/login', auth_controller_1.login);
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
router.post('/auth/verify-loginOtp', auth_controller_1.verifyLoginOtp);
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
router.post('/auth/request-password-reset-otp', auth_controller_1.requestPasswordChangeOtp);
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
router.post('/auth/reset-password-with-otp', auth_controller_1.changePasswordWithOtp);
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
router.post('/auth/resend-password-reset-otp', auth_controller_1.resendPasswordChangeOtp);
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
router.post('/auth/chef/login', auth_controller_1.chefLogin);
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
router.get('/auth/me', auth_controller_2.whoami);
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
exports.default = router;
