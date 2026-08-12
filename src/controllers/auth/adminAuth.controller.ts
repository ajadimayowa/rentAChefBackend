import { Request, Response } from 'express';
import { AuthError, authenticateWithPassword, signAuthToken } from '../../services/auth/auth.service';
import Category from '../../models/Category';
import { ServiceModel } from '../../models/Service';

const handleAuthError = (res: Response, error: unknown, fallbackMessage: string) => {
  if (error instanceof AuthError) {
    return res.status(error.status).json({ success: false, message: error.message });
  }
  console.error(error);
  return res.status(500).json({ success: false, message: fallbackMessage });
};

/** Admin login is single-step: password → token, enriched with category/service lookups the admin dashboard needs on boot. */
export const login = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;
    const admin = await authenticateWithPassword('Admin', email, password);

    const token = signAuthToken({ id: admin._id, role: admin.adminDetails?.role });

    const [categories, services] = await Promise.all([
      Category.find().select('_id name').lean(),
      ServiceModel.find().select('_id name').lean(),
    ]);

    const formattedCategories = categories.map((cat: any) => ({ label: cat.name, value: cat._id }));
    const formattedServices = services.map((service: any) => ({ name: service.name, id: service._id }));

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      payload: {
        id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.adminDetails?.role,
        formattedCategories,
        formattedServices,
      },
    });
  } catch (error) {
    return handleAuthError(res, error, 'Server error');
  }
};
