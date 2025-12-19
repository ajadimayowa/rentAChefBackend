import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AdminRequest extends Request {
  admin?: any;
}

export const adminAuth = async (
  req: AdminRequest,
  res: Response,
  next: NextFunction
) :Promise<any> => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token)
    return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    req.admin = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};