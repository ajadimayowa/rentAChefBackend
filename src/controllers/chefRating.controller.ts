import { Request, Response } from 'express';
import { ChefRating } from '../models/ChefRating';
import Chef from '../models/Chef';
import { Booking } from '../models/Booking';

export const addOrUpdateChefRating = async (req: Request, res: Response): Promise<any> => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { chefId } = req.params;
    const { rating, review, bookingId } = req.body;

    const chef = await Chef.findById(chefId);
    if (!chef) return res.status(404).json({ success: false, message: 'Chef not found' });

    if (!bookingId) return res.status(400).json({ success: false, message: 'bookingId is required' });

    // validate booking
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // only the booking client can rate
    if (booking.clientId.toString() !== user.id) {
      return res.status(403).json({ success: false, message: 'You can only rate your own bookings' });
    }

    // booking must be for this chef and of type 'chef'
    if (booking.bookingType !== 'chef' || (booking.chefId && booking.chefId.toString() !== chefId)) {
      return res.status(400).json({ success: false, message: 'Booking does not belong to this chef' });
    }

    // require completed bookings for rating
    if (booking.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Booking must be completed to submit a rating' });
    }

    if (!rating || Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const r = await ChefRating.findOneAndUpdate(
      { bookingId },
      { userId: user.id, chefId, bookingId, rating: Number(rating), review },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Recompute chef's average rating and persist it on the Chef document
    try {
      const all = await ChefRating.find({ chefId });
      const avg = all.length ? all.reduce((s, x) => s + x.rating, 0) / all.length : 0;
      await Chef.findByIdAndUpdate(chefId, { rating: avg });
    } catch (e) {
      console.warn('Failed to update chef average rating:', e);
    }

    return res.status(200).json({ success: true, payload: r, message: 'Rating saved' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getChefRatings = async (req: Request, res: Response) => {
  try {
    const { chefId } = req.params;
    const ratings = await ChefRating.find({ chefId }).populate('userId', 'firstName profilePic fullName');
    const avg = ratings.length ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length : 0;
    res.status(200).json({ success: true, payload: { average: avg, total: ratings.length, items: ratings } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
