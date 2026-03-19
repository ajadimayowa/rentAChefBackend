import { Router } from 'express';
// import { register, login } from '../controllers/auth.controller';

import { verifyToken, verifyUserToken } from '../middleware/auth.middleware';
import { login, register, verifyEmail, verifyLoginOtp } from '../controllers/chefAuthControllers/auth.controller';
import { completeKyc, getAllUsers, getUserById, getUserDashboard, updateBioData, updateHealthInformation, updateLocation, updateNok, updateProfilePic } from '../controllers/user/user.controller';
import { adminAuth } from '../middleware/adminAuth';
import uploadAdImages from '../middleware/upload';
import { checkChefAvailability } from '../controllers/chef.controller';
import { isAdmin } from '../middleware/isAdmin';

const router = Router();

router.get('/user/dashboard/:id',verifyUserToken, getUserDashboard);
router.get('/user/users',isAdmin, getAllUsers);

router.get('/user/:id',verifyUserToken, getUserById);

router.put('/user/uploadProfilePic/:id',verifyUserToken,uploadAdImages.single('profilePic'), updateProfilePic);
router.put('/user/updateBiodata/:userId',verifyUserToken,updateBioData);
router.put('/user/updateLocation/:userId',verifyUserToken,updateLocation);
router.put('/user/updateNok/:userId',verifyUserToken,updateNok);
router.put('/user/updateHealthInformation/:userId',verifyUserToken,updateHealthInformation);
router.put('/user/completeKyc/:userId',verifyUserToken,uploadAdImages.single('idPic'),completeKyc);
router.put('/user/uploadPicture/:id',verifyUserToken,uploadAdImages.single('profilePic'),updateProfilePic);
router.post('/user/checkChefavailability',verifyUserToken, checkChefAvailability);

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