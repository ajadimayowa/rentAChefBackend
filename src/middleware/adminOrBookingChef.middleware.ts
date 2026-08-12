import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import UserModel from '../models/User.model';
import Procurement from '../models/Procurement';
import { BookingModel } from '../models/Booking';

export const adminOrBookingChef = async (req: Request, res: Response, next: NextFunction):Promise<any>  => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'No token provided' });

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

    const user = await UserModel.findById(decoded.id);
    if (!user) return res.status(403).json({ message: 'Invalid token' });

    // If admin user
    if (user.userType === 'Admin') {
      (req as any).user = user;
      return next();
    }

    // If chef, ensure they own the booking linked to procurement
    if (user.userType === 'Chef') {
      const procurementId = req.params.id;
      if (!procurementId) return res.status(400).json({ message: 'Procurement id required' });

      const procurement = await Procurement.findById(procurementId);
      if (!procurement) return res.status(404).json({ message: 'Procurement not found' });

      const booking = await BookingModel.findById(procurement.bookingId);
      if (!booking) return res.status(404).json({ message: 'Booking not found for procurement' });

      if (String(booking.chefId) !== String(user._id)) {
        return res.status(403).json({ message: 'Not authorized for this procurement' });
      }

      (req as any).user = user;
      return next();
    }

    return res.status(403).json({ message: 'Admin or owning chef only' });
  } catch (err) {
    return res.status(401).json({ message: 'Token failed' });
  }
};
