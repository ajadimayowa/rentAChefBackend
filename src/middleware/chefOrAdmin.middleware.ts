import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import UserModel from '../models/User.model';

export const chefOrAdmin = async (req: Request, res: Response, next: NextFunction):Promise<any> => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'No token provided' });

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

    const user = await UserModel.findById(decoded.id);
    if (!user || (user.userType !== 'Chef' && user.userType !== 'Admin')) {
      return res.status(403).json({ message: 'Admin or Chef only' });
    }

    (req as any).user = user;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Token failed' });
  }
};
