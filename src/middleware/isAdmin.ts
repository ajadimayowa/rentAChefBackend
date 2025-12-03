import { Request, Response, NextFunction } from "express";

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const isAdmin = async (req: Request, res: Response, next: NextFunction):Promise<any> => {
  const adminSecret = process.env.ADMIN_SECRET;

  const adminPass = req.body?.adminPass;
  console.log({see:adminPass})

  if (!adminPass) {
    return res.status(400).json({ message: "adminPass missing from request body" });
  }

  if (adminPass !== adminSecret) {
    return res.status(403).json({ message: "Access denied. Admin only" });
  }

  next();
};