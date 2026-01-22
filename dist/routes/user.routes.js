"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
// import { register, login } from '../controllers/auth.controller';
const auth_middleware_1 = require("../middleware/auth.middleware");
const user_controller_1 = require("../controllers/user/user.controller");
const adminAuth_1 = require("../middleware/adminAuth");
const router = (0, express_1.Router)();
router.get('/user/dashboard', auth_middleware_1.verifyUserToken, user_controller_1.getAllUsers);
router.get('/user/users', adminAuth_1.adminAuth, user_controller_1.getAllUsers);
router.get('/user/:id', adminAuth_1.adminAuth, user_controller_1.getAllUsers);
// router.post('/auth/request-password-reset-otp', requestPasswordResetOtp);
// router.post('/auth/reset-password-with-otp', resetUserPasswordWithOtp);
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
