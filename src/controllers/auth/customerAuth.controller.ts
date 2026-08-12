import { Request, Response } from 'express';
import { AuthError, registerCustomer } from '../../services/auth/auth.service';
import { sendWelcomeEmail } from '../../services/email/rentAChef/usersEmailNotifs';
import { sendSms } from '../../services/sms/sendSms';

const handleAuthError = (res: Response, error: unknown, fallbackMessage: string) => {
  if (error instanceof AuthError) {
    return res.status(error.status).json({ success: false, message: error.message });
  }
  console.error(error);
  return res.status(500).json({ success: false, message: fallbackMessage });
};

export const register = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password, fullName, phoneNumber } = req.body;
    const { user, emailVerificationOtp } = await registerCustomer({ email, password, fullName, phoneNumber });

    try {
      await sendSms({
        to: user.phoneNumber || '',
        message: `Your RentAChef verification code is ${emailVerificationOtp}`,
      });
    } catch (err) {
      console.error(err);
    }

    try {
      // Customers can register from the mobile app or the web, so the emailed
      // link opens the web verification page (works from any device/client);
      // that page also offers an "open in app" deep link for mobile users.
      const verifyUrl = `${process.env.CLIENT_URL}/verify-email?email=${encodeURIComponent(user.email)}&otp=${encodeURIComponent(emailVerificationOtp)}`;
      await sendWelcomeEmail({
        firstName: user.firstName || '',
        email: user.email,
        emailVerificationOtp,
        verifyUrl,
      });
    } catch (error) {
      console.error(error);
    }

    return res.status(201).json({
      success: true,
      payload: { id: user._id, email: user.email, fullName: user.fullName, userType: user.userType },
    });
  } catch (error) {
    return handleAuthError(res, error, 'Internal server error.');
  }
};
