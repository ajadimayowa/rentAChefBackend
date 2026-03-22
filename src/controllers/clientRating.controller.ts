import { Request, Response } from 'express';
import { ClientRating } from '../models/ClientRating';
import { Booking } from '../models/Booking';
import UserModel from '../models/User.model';

export const addOrUpdateClientRating = async (req: Request, res: Response): Promise<any> => {
  try {
    const actor = (req as any).user; // expected to be Chef or admin
    if (!actor) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { bookingId } = req.params;
    const { rating, review } = req.body;

    if (!bookingId) return res.status(400).json({ success: false, message: 'bookingId is required' });

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Ensure actor is the chef for this booking (if actor is Chef)
    const actorId = (actor as any)._id?.toString?.() || (actor as any).id;
    if (booking.chefId && booking.chefId.toString() !== actorId && !(actor as any).isAdmin) {
      return res.status(403).json({ success: false, message: 'You can only rate clients for your bookings' });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Booking must be completed to submit a rating' });
    }

    if (!rating || Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const clientId = booking.clientId;

    const r = await ClientRating.findOneAndUpdate(
      { bookingId },
      { chefId: actorId, clientId, bookingId, rating: Number(rating), review },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Recompute client average rating and persist on User
    try {
      const all = await ClientRating.find({ clientId });
      const avg = all.length ? all.reduce((s, x) => s + x.rating, 0) / all.length : 0;
      await UserModel.findByIdAndUpdate(clientId, { rating: avg });
    } catch (e) {
      console.warn('Failed to update client average rating:', e);
    }

    return res.status(200).json({ success: true, payload: r, message: 'Client rating saved' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getClientRatings = async (req: Request, res: Response) => {
  try {
    const { clientId } = req.params;
    const items = await ClientRating.find({ clientId }).populate('chefId', 'name profilePic');
    const avg = items.length ? items.reduce((s, r) => s + r.rating, 0) / items.length : 0;
    res.status(200).json({ success: true, payload: { average: avg, total: items.length, items } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
