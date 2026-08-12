import { Request, Response } from 'express';
import {
  AuthError,
  authenticateByEmail,
  buildAuthTokenPayload,
  changePasswordWithOtp as changePasswordWithOtpService,
  issueLoginOtp,
  requestPasswordChangeOtp as requestPasswordChangeOtpService,
  signAuthToken,
  verifyEmailOtp as verifyEmailOtpService,
  verifyLoginOtp as verifyLoginOtpService,
} from '../../services/auth/auth.service';
import { IUser } from '../../models/User.model';
import {
  sendEmailVerificationSuccessEmail,
  sendLoginOtpEmail,
  sendPasswordChangeSuccessEmail,
  sendUserPasswordResetOTPEmail,
} from '../../services/email/rentAChef/usersEmailNotifs';
import { sendSms } from '../../services/sms/sendSms';
import Category from '../../models/Category';
import { ServiceModel } from '../../models/Service';

const handleAuthError = (res: Response, error: unknown, fallbackMessage: string) => {
  if (error instanceof AuthError) {
    return res.status(error.status).json({ success: false, message: error.message });
  }
  console.error(error);
  return res.status(500).json({ success: false, message: fallbackMessage });
};

/** Delivers a password-reset OTP by email (all user types) and additionally by SMS when a phone is on file. */
const deliverPasswordResetOtp = async (user: IUser, otp: string) => {
  try {
    await sendUserPasswordResetOTPEmail({ firstName: user.firstName || '', email: user.email, loginOtp: otp });
  } catch (error) {
    console.error('Error sending password reset OTP email:', error);
  }

  if (user.phoneNumber) {
    try {
      await sendSms({ to: user.phoneNumber, message: `Your RentAChef password reset code is ${otp}` });
    } catch (err) {
      console.error(err);
    }
  }
};

/**
 * Single login entry point shared by every user type (Customer, Chef, Admin) — one
 * form, no need to know which portal you're signing into. Password is verified
 * first; a login OTP is then issued (email, plus SMS when a phone is on file) and
 * must be exchanged via verifyLoginOtp for a token.
 */
export const login = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;
    const user = await authenticateByEmail(email, password);

    const { otp, expiresAt } = await issueLoginOtp(user);

    try {
      await sendLoginOtpEmail({ firstName: user.firstName || '', email: user.email, loginOtp: otp });
    } catch (error) {
      console.error('Error sending OTP email:', error);
    }

    if (user.phoneNumber) {
      try {
        await sendSms({ to: user.phoneNumber, message: `Your RentAChef login OTP code is ${otp}` });
      } catch (err) {
        console.error(err);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'OTP sent to your email.',
      payload: { email: user.email, expiresAt },
    });
  } catch (error) {
    return handleAuthError(res, error, 'Internal server error.');
  }
};

/** Exchanges a verified login OTP for a token. The JWT always carries `userType` so middleware can branch on it. */
export const verifyLoginOtp = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, otp } = req.body;
    const user = await verifyLoginOtpService(null, email, otp);

    const token = signAuthToken(buildAuthTokenPayload(user));

    const userObj = user.toJSON() as Record<string, unknown>;
    delete userObj.password;
    delete userObj.loginOtp;
    delete userObj.loginOtpExpires;

    const payload: Record<string, unknown> = { ...userObj };

    if (user.userType === 'Admin') {
      payload.role = user.adminDetails?.role;

      const [categories, services] = await Promise.all([
        Category.find().select('_id name').lean(),
        ServiceModel.find().select('_id name').lean(),
      ]);
      // payload.formattedCategories = categories.map((cat: any) => ({ label: cat.name, value: cat._id }));
      // payload.formattedServices = services.map((service: any) => ({ name: service.name, id: service._id }));
    }

    if (user.userType === 'Chef') {
      payload.staffId = user.chefDetails?.staffId;
      payload.isPasswordUpdated = user.chefDetails?.isPasswordUpdated;
    }

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      payload,
    });
  } catch (error) {
    return handleAuthError(res, error, 'Server error. Please try again later.');
  }
};

/** Requests a password-reset OTP for any user type — email is globally unique. */
export const requestPasswordResetOtp = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email } = req.body;
    const { user, otp } = await requestPasswordChangeOtpService(email);

    await deliverPasswordResetOtp(user, otp);

    return res.status(200).json({ success: true, message: 'Password reset OTP sent' });
  } catch (error) {
    return handleAuthError(res, error, 'Server error');
  }
};

/** Resends a fresh password-reset OTP for any user type. */
export const resendPasswordResetOtp = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email } = req.body;
    const { user, otp } = await requestPasswordChangeOtpService(email);

    await deliverPasswordResetOtp(user, otp);

    return res.status(200).json({ success: true, message: 'OTP resent successfully' });
  } catch (error) {
    return handleAuthError(res, error, 'Server error');
  }
};

/** Changes the password for any user type via a previously issued OTP. */
export const resetPasswordWithOtp = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await changePasswordWithOtpService(email, otp, newPassword);

    try {
      await sendPasswordChangeSuccessEmail({ firstName: user.firstName || '', email: user.email });
    } catch (error) {
      console.log(error);
    }

    return res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    return handleAuthError(res, error, 'Server error');
  }
};

/** Verifies a user's email via OTP, for any user type. */
export const verifyEmail = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, otp } = req.body;
    const user = await verifyEmailOtpService(email, otp);

    try {
      await sendEmailVerificationSuccessEmail({ firstName: user.firstName || '', email: user.email });
    } catch (error) {
      console.log(error);
    }

    return res.status(200).json({ success: true, message: 'Email verified successfully.' });
  } catch (error) {
    return handleAuthError(res, error, 'Server error. Please try again later.');
  }
};
