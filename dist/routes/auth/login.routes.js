"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const unifiedAuth_controller_1 = require("../../controllers/auth/unifiedAuth.controller");
const router = (0, express_1.Router)();
/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Login — single entry point for every user type (Customer, Chef, Admin); sends a login OTP, no token yet
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthLoginRequest'
 *     responses:
 *       200:
 *         description: OTP sent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomerLoginOtpResponse'
 */
router.post('/auth/login', unifiedAuth_controller_1.login);
/**
 * @openapi
 * /auth/verify-loginOtp:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Verify login OTP (any user type) and receive a token carrying the resolved userType
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
 *               $ref: '#/components/schemas/CustomerAuthResponse'
 */
router.post('/auth/verify-loginOtp', unifiedAuth_controller_1.verifyLoginOtp);
/**
 * @openapi
 * /auth/verify-email:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Verify email via OTP — single entry point for every user type (Customer, Chef, Admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthVerifyEmailRequest'
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 */
router.post('/auth/verify-email', unifiedAuth_controller_1.verifyEmail);
/**
 * @openapi
 * /auth/request-password-reset-otp:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Request a password reset OTP — single entry point for every user type (Customer, Chef, Admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthPasswordResetRequest'
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 */
router.post('/auth/request-password-reset-otp', unifiedAuth_controller_1.requestPasswordResetOtp);
/**
 * @openapi
 * /auth/resend-password-reset-otp:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Resend the password reset OTP — single entry point for every user type (Customer, Chef, Admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthResendOtpRequest'
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 */
router.post('/auth/resend-password-reset-otp', unifiedAuth_controller_1.resendPasswordResetOtp);
/**
 * @openapi
 * /auth/reset-password-with-otp:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Reset password with OTP — single entry point for every user type (Customer, Chef, Admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthResetWithOtpRequest'
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 */
router.post('/auth/reset-password-with-otp', unifiedAuth_controller_1.resetPasswordWithOtp);
exports.default = router;
