import { Request, Response, NextFunction } from 'express';


export const adminOnly = (req: Request, res: Response, next: NextFunction): void => {
const user = (req as any).user;
if (!user || user.userType !== 'Admin') {
	res.status(403).json({ message: 'Admin only' });
	return;
}
next();
};