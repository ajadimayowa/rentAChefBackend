import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import UserModel from '../../models/User.model';

export const requireAdminAuth = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ success: false, message: 'No token provided' });

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

    const user = await UserModel.findById(decoded.id);
    if (!user || user.userType !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Admin only' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Admin account disabled' });
    }

    (req as any).user = user;
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction): any => {
  const user = (req as any).user;
  if (user?.adminDetails?.role !== 'super_admin') {
    return res.status(403).json({ success: false, message: 'Super admin access only' });
  }
  next();
};
