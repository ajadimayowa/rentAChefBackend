import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import UserModel from '../models/User.model';
import Chef from '../models/Chef';

export const whoami = async (req: Request, res: Response): Promise<any> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ success: false, message: 'No token provided' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

    if (decoded.role === 'chef') {
      const chef = await Chef.findById(decoded.id).select('-password');
      if (!chef) return res.status(404).json({ success: false, message: 'Chef not found' });
      return res.json({ success: true, payload: { role: 'chef', user: chef } });
    }

    const user = await UserModel.findById(decoded.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    return res.json({ success: true, payload: { role: 'user', user } });
  } catch (err: any) {
    return res.status(401).json({ success: false, message: 'Invalid token', error: err.message });
  }
};

export default { whoami };
