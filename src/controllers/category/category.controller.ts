import { Request, Response } from "express";
import Category from "../../models/Category";

/**
 * Create Category
 */
export const createCategory = async (req: Request, res: Response): Promise<any> => {
  
  try {

    const catPic = req.file as any; // multer file
  const {
    name,
    description
   } = req.body
   if (!name || !description) {
            return res.status(400).json({ message: "name, description are required" });
    }

    const category = await Category.create({
      name,
      description,
      image: catPic?.location || catPic?.path || "", // depending on S3 or local
    });
    return res.status(201).json({ success: true, payload: category });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Get All Categories
 */
export const getAllCategories = async (_req: Request, res: Response): Promise<any> => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, payload: categories });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch categories" });
  }
};

/**
 * Get Category by ID or Slug
 */
export const getSingleCategory = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    const category = await Category.findOne({
      $or: [{ _id: id }, { slug: id }],
    });

    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    return res.status(200).json({ success: true, payload: category });
  } catch (error) {
    return res.status(400).json({ success: false, message: "Invalid category ID" });
  }
};

/**
 * Update Category
 */
export const updateCategory = async (req: Request, res: Response): Promise<any> => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    return res.status(200).json({ success: true, payload: category });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Delete Category
 */
export const deleteCategory = async (req: Request, res: Response): Promise<any> => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    return res.status(200).json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    return res.status(400).json({ success: false, message: "Invalid category ID" });
  }
};