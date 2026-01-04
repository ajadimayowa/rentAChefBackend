"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/chefAuthControllers/auth.controller");
const router = (0, express_1.Router)();
router.post('/auth/register', auth_controller_1.register);
router.post('/auth/verify-email', auth_controller_1.verifyEmail);
router.post('/auth/login', auth_controller_1.login);
router.post('/auth/verify-loginOtp', auth_controller_1.verifyLoginOtp);
//password reset
router.post('/auth/request-password-reset-otp', auth_controller_1.requestPasswordChangeOtp);
router.post('/auth/reset-password-with-otp', auth_controller_1.changePasswordWithOtp);
//chef auth
router.post('/auth/chef/login', auth_controller_1.chefLogin);
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
