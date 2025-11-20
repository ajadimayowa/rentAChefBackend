import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import UserModel from '../models/User.model';

// export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
//   const authHeader = req.headers.authorization;
//   if (!authHeader) return res.status(401).json({ msg: 'No token' });

//   try {
//     const token = authHeader.split(' ')[1];
//     const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

//     const user = await User.findById(decoded.id);
//     if (!user) return res.status(403).json({ msg: 'Invalid token' });
//     (req as any).user = user;
//     next();
//   } catch (err) {
//     res.status(401).json({ msg: 'Token failed' });
//   }
// };

export const verifyToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ msg: 'No token provided' });
    return;
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    const user = await UserModel.findById(decoded.id);
    if (!user) {
      res.status(403).json({ msg: 'Invalid token' });
      return;
    }

    (req as any).user = user;
    next(); // ✅ move on to controller
  } catch (err) {
    res.status(401).json({ msg: 'Token failed' });
  }
};

// export const verifyRootAdminToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//   const authHeader = req.headers.authorization;
//   if (!authHeader) {
//     res.status(401).json({ msg: 'No token provided' });
//     return;
//   }

//   try {
//     const token = authHeader.split(' ')[1];
//     const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

//     const creator = await Creator.findById(decoded.id);
//     if (!creator) {
//       res.status(403).json({ msg: 'Invalid token' });
//       return;
//     }

//     (req as any).user = creator;
//     next(); // ✅ move on to controller
//   } catch (err) {
//     res.status(401).json({ msg: 'Token failed' });
//   }
// };


export const verifyUserToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ msg: 'No token provided' });
    return;
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    const user = await UserModel.findById(decoded.id);
    if (!user) {
      res.status(403).json({ msg: 'Invalid token' });
      return;
    }

    (req as any).user = user;
    next(); // ✅ move on to controller
  } catch (err) {
    res.status(401).json({ msg: 'Token failed' });
  }
};

export const isSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!user?.isSuperAdmin) {
    res.status(403).json({success:false, message: 'Un Authorised User!' }) 
    return
};
  next();
};

export const isCreator = (req: Request, res: Response, next: NextFunction) => {
  const {creatorPass} = req.body;
  if (creatorPass !== process.env.CREATOR_PASS) {
    res.status(403).json({success:false, message: 'Un Authorised User!' }) 
    return
};
  next();
};