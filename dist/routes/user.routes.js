"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
// import { register, login } from '../controllers/auth.controller';
const auth_middleware_1 = require("../middleware/auth.middleware");
const user_controller_1 = require("../controllers/user/user.controller");
const upload_1 = __importDefault(require("../middleware/upload"));
const chef_controller_1 = require("../controllers/chef.controller");
const isAdmin_1 = require("../middleware/isAdmin");
const router = (0, express_1.Router)();
router.get('/user/dashboard/:id', auth_middleware_1.verifyUserToken, user_controller_1.getUserDashboard);
router.get('/user/users', isAdmin_1.isAdmin, user_controller_1.getAllUsers);
router.get('/user/:id', auth_middleware_1.verifyUserToken, user_controller_1.getUserById);
router.put('/user/uploadProfilePic/:id', auth_middleware_1.verifyUserToken, upload_1.default.single('profilePic'), user_controller_1.updateProfilePic);
router.put('/user/updateBiodata/:userId', auth_middleware_1.verifyUserToken, user_controller_1.updateBioData);
router.put('/user/updateLocation/:userId', auth_middleware_1.verifyUserToken, user_controller_1.updateLocation);
router.put('/user/updateNok/:userId', auth_middleware_1.verifyUserToken, user_controller_1.updateNok);
router.put('/user/updateHealthInformation/:userId', auth_middleware_1.verifyUserToken, user_controller_1.updateHealthInformation);
router.put('/user/completeKyc/:userId', auth_middleware_1.verifyUserToken, upload_1.default.single('idPic'), user_controller_1.completeKyc);
router.put('/user/uploadPicture/:id', auth_middleware_1.verifyUserToken, upload_1.default.single('profilePic'), user_controller_1.updateProfilePic);
router.post('/user/checkChefavailability', auth_middleware_1.verifyUserToken, chef_controller_1.checkChefAvailability);
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
