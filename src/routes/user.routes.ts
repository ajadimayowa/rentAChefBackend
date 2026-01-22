import { Router } from 'express';
// import { register, login } from '../controllers/auth.controller';

import { verifyToken, verifyUserToken } from '../middleware/auth.middleware';
import { login, register, verifyEmail, verifyLoginOtp } from '../controllers/chefAuthControllers/auth.controller';
import { getAllUsers } from '../controllers/user/user.controller';
import { adminAuth } from '../middleware/adminAuth';

const router = Router();

router.get('/user/dashboard',verifyUserToken, getAllUsers);
router.get('/user/users',adminAuth, getAllUsers);
router.get('/user/:id',adminAuth, getAllUsers);

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

export default router;