import { Request, Response } from "express";
import Category from "../../models/Category";

const parseTaskIndex = (taskIndexParam: string): number | null => {
  const parsedIndex = Number(taskIndexParam);

  if (!Number.isInteger(parsedIndex) || parsedIndex < 0) {
    return null;
  }

  return parsedIndex;
};

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

/**
 * Add Task to Category
 */
export const addTaskToCategory = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const task = String(req.body.task || "").trim();

    if (!task) {
      return res.status(400).json({ success: false, message: "task is required" });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    if (category.tasks.includes(task)) {
      return res.status(409).json({ success: false, message: "Task already exists in category" });
    }

    category.tasks.push(task);
    await category.save();

    return res.status(200).json({ success: true, payload: category });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Update Category Task
 */
export const updateCategoryTask = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id, taskIndex } = req.params;
    const updatedTask = String(req.body.task || "").trim();

    if (!updatedTask) {
      return res.status(400).json({ success: false, message: "task is required" });
    }

    const parsedTaskIndex = parseTaskIndex(taskIndex);

    if (parsedTaskIndex === null) {
      return res.status(400).json({ success: false, message: "taskIndex must be a valid non-negative integer" });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    if (parsedTaskIndex >= category.tasks.length) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    category.tasks[parsedTaskIndex] = updatedTask;
    await category.save();

    return res.status(200).json({ success: true, payload: category });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Delete Category Task
 */
export const deleteCategoryTask = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id, taskIndex } = req.params;
    const parsedTaskIndex = parseTaskIndex(taskIndex);

    if (parsedTaskIndex === null) {
      return res.status(400).json({ success: false, message: "taskIndex must be a valid non-negative integer" });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    if (parsedTaskIndex >= category.tasks.length) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    category.tasks.splice(parsedTaskIndex, 1);
    await category.save();

    return res.status(200).json({ success: true, payload: category });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};