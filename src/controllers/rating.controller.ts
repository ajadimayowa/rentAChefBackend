import { Request, Response } from 'express';
import { Rating } from '../models/Rating';
import { SpecialMenu } from '../models/SpecialMenu';

export const addOrUpdateRating = async (req: Request, res: Response):Promise<any> => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { menuId } = req.params;
    const { rating, review } = req.body;

    const menu = await SpecialMenu.findById(menuId);
    if (!menu) return res.status(404).json({ success: false, message: 'Special menu not found' });

    if (!rating || Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const r = await Rating.findOneAndUpdate(
      { userId: user.id, specialMenuId: menuId },
      { rating: Number(rating), review },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ success: true, payload: r, message: 'Rating saved' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getMenuRatings = async (req: Request, res: Response) => {
  try {
    const { menuId } = req.params;
    const ratings = await Rating.find({ specialMenuId: menuId }).populate('userId', 'firstName profilePic fullName');
    const avg = ratings.length ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length : 0;
    res.status(200).json({ success: true, payload: { average: avg, total: ratings.length, items: ratings } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
