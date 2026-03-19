import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import UserModel from '../models/User.model';
import Chef from '../models/Chef';

export const chefOrAdmin = async (req: Request, res: Response, next: NextFunction):Promise<any> => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'No token provided' });

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

    if (decoded.role === 'chef') {
      const chef = await Chef.findById(decoded.id);
      if (!chef) return res.status(403).json({ message: 'Invalid chef token' });
      (req as any).user = chef;
      return next();
    }

    // Otherwise try loading as regular user and ensure admin
    const user = await UserModel.findById(decoded.id);
    if (!user || !user.isAdmin) return res.status(403).json({ message: 'Admin or Chef only' });
    (req as any).user = user;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Token failed' });
  }
};
