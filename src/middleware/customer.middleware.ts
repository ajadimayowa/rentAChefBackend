import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Customer from '../models/User.model';


interface JwtPayload {
id: string;
}

export const auth = async (req: Request, res: Response, next: NextFunction) => {
const authHeader = req.headers.authorization;
if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ message: 'Unauthorized' });
const token = authHeader.split(' ')[1];
try {
const secret = process.env.JWT_SECRET || 'secret';
const payload = jwt.verify(token, secret) as JwtPayload;
const user = await Customer.findById(payload.id).select('-password');
if (!user) return res.status(401).json({ message: 'Unauthorized' });
(req as any).user = user;
next();
} catch (err) {
return res.status(401).json({ message: 'Invalid token' });
}
};