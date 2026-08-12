import { Request, Response } from 'express';
import { AuthError, authenticateWithPassword, signAuthToken } from '../../services/auth/auth.service';

const handleAuthError = (res: Response, error: unknown, fallbackMessage: string) => {
  if (error instanceof AuthError) {
    return res.status(error.status).json({ success: false, message: error.message });
  }
  console.error(error);
  return res.status(500).json({ success: false, message: fallbackMessage });
};

/** Chef login is single-step: password → token. */
export const login = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;
    const chef = await authenticateWithPassword('Chef', email, password);

    const token = signAuthToken({ id: chef._id, role: 'chef', email: chef.email });

    return res.status(200).json({
      message: 'Login successful',
      token,
      chef: {
        id: chef._id,
        staffId: chef.chefDetails?.staffId,
        name: chef.fullName,
        email: chef.email,
        isPasswordUpdated: chef.chefDetails?.isPasswordUpdated,
      },
    });
  } catch (error) {
    return handleAuthError(res, error, 'Unable to login at the moment');
  }
};
