import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import UserModel, { UserType } from '../../models/User.model';

/**
 * Verifies the JWT and attaches the live user document to req.user. Use alone to
 * require "any authenticated user", or pass allowed userTypes to also gate by role
 * — the token always carries `userType` (see buildAuthTokenPayload), so a single
 * decode is enough to tell Customer/Chef/Admin requests apart.
 */
export const requireAuth = (allowedUserTypes?: UserType[]) =>
  async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ success: false, message: 'No token provided' });

    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

      const user = await UserModel.findById(decoded.id);
      if (!user) return res.status(401).json({ success: false, message: 'Invalid token' });

      if (!user.isActive) {
        return res.status(403).json({ success: false, message: 'Account disabled. Contact admin.' });
      }

      if (allowedUserTypes && !allowedUserTypes.includes(user.userType)) {
        return res.status(403).json({ success: false, message: 'You do not have access to this resource.' });
      }

      (req as any).user = user;
      return next();
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
  };
