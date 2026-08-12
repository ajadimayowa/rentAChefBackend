import { Request, Response } from "express";
import Category from "../models/Category";

/**
 * Get All Chef Levels
 */
export const getAllChefLevels = async (_req: Request, res: Response): Promise<any> => {
  try {
    const levels = await Category.find({ isActive: true }).sort({ name: 1 });

    return res.status(200).json({
      success: true,
      message: "Chef levels fetched successfully",
      payload: levels.map((level) => ({ id: level._id, name: level.name })),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch chef levels", error });
  }
};
