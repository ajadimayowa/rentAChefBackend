import { Request, Response, NextFunction } from "express";

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const isAdmin = async (req: Request, res: Response, next: NextFunction):Promise<any> => {
  const adminSecrete=process.env.ADMIN_SECRET;
  // console.log({seeSec:adminSecrete})

  const {adminPass} = req.body

  // console.log({seePass:adminPass})
  // if (adminPass !==process.env.ADMIN_SECRET) {
  //   return res.status(401).json({ message: "Not authenticated" });
  // }

  if (adminPass!=adminSecrete) {
    return res.status(403).json({ message: "Access denied. Admin only" });
  }

  next();
};