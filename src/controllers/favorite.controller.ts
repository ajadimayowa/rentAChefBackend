import { Request, Response } from 'express';
import { Favorite } from '../models/Favorite';
import { SpecialMenu } from '../models/SpecialMenu';

// Toggle favorite: if exists remove, otherwise create
export const toggleFavorite = async (req: Request, res: Response):Promise<any> => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { menuId } = req.params;
    const menu = await SpecialMenu.findById(menuId);
    if (!menu) return res.status(404).json({ success: false, message: 'Special menu not found' });

    const existing = await Favorite.findOne({ userId: user.id, specialMenuId: menuId });
    if (existing) {
      await existing.deleteOne();
      return res.status(200).json({ success: true, message: 'Removed from favorites' });
    }

    const fav = await Favorite.create({ userId: user.id, specialMenuId: menuId });
    return res.status(201).json({ success: true, payload: fav, message: 'Added to favorites' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserFavorites = async (req: Request, res: Response):Promise<any> => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const favs = await Favorite.find({ userId: user.id }).populate('specialMenuId');
    res.status(200).json({ success: true, payload: favs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
