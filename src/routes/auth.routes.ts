import { Router } from 'express';
// import { register, login } from '../controllers/auth.controller';

import { verifyToken } from '../middleware/auth.middleware';
import { changePasswordWithOtp, chefLogin, login, register, requestPasswordChangeOtp, verifyEmail, verifyLoginOtp } from '../controllers/chefAuthControllers/auth.controller';

const router = Router();

router.post('/auth/register', register);
router.post('/auth/verify-email', verifyEmail);
router.post('/auth/login', login);
router.post('/auth/verify-loginOtp', verifyLoginOtp);

//password reset
router.post('/auth/request-password-reset-otp', requestPasswordChangeOtp);
router.post('/auth/reset-password-with-otp', changePasswordWithOtp);

//chef auth
router.post('/auth/chef/login', chefLogin);



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