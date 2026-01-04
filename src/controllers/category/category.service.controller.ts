import { Request, Response } from "express";
import Category from "../../models/Category";

/**
 * Add service to category
 */
export const addServiceToCategory = async (req: Request, res: Response) : Promise<any> => {
  try {
    const { label, price } = req.body;

    if (!label || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "Service label and price are required",
      });
    }

    const category = await Category.findById(req.params.categoryId);

    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    category.services.push({ label, price });
    await category.save();

    return res.status(200).json({
      success: true,
      message: "Service added successfully",
      payload: category,
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
