import { Request, Response, NextFunction } from "express";

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const isAdmin = async (req: AuthRequest, res: Response, next: NextFunction):Promise<any> => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admin only" });
  }

  next();
};