import { Request, Response } from "express";
import { Types } from "mongoose";
import { ServiceCategoryModel } from "../../models/ServiceCategoryModel";

const isDuplicateKeyError = (error: unknown): boolean => {
  const typedError = error as { code?: number };
  return typedError?.code === 11000;
};

const buildCategoryQuery = (idOrSlug: string) => {
  if (Types.ObjectId.isValid(idOrSlug)) {
    return { _id: idOrSlug };
  }

  return { slug: String(idOrSlug).toLowerCase().trim() };
};

/**
 * Create/update accept JSON or multipart (when a picture is attached), and multipart
 * sends every field as a string — so "true"/"false" must be accepted for isActive.
 * Returns undefined when absent, null when present but invalid.
 */
const parseIsActive = (value: unknown): boolean | undefined | null => {
  if (value === undefined) return undefined;
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
};

const uploadedImageUrl = (req: Request): string | undefined => {
  const file = req.file as any;
  return file ? file.location || file.path : undefined;
};

/* ===================== SERVICE CATEGORY CRUD ===================== */

export const createServiceCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, isActive } = req.body;
    const normalizedName = typeof name === "string" ? name.trim() : "";
    const normalizedDescription = typeof description === "string" ? description.trim() : "";

    if (!normalizedName) {
      res.status(400).json({ success: false, message: "Category name is required" });
      return;
    }

    const existing = await ServiceCategoryModel.findOne({
      name: { $regex: `^${normalizedName}$`, $options: "i" },
    });

    if (existing) {
      res.status(409).json({ success: false, message: "Service category already exists" });
      return;
    }

    const category = await ServiceCategoryModel.create({
      name: normalizedName,
      description: normalizedDescription,
      image: uploadedImageUrl(req) ?? "",
      isActive: parseIsActive(isActive) ?? true,
    });

    res.status(201).json({ success: true, payload: category });
  } catch (error: unknown) {
    if (isDuplicateKeyError(error)) {
      res.status(409).json({ success: false, message: "Service category already exists" });
      return;
    }

    console.error("Error creating service category:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getServiceCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    const query: Record<string, unknown> = {};

    if (status === "active") query.isActive = true;
    if (status === "inactive") query.isActive = false;

    if (search && typeof search === "string") {
      query.name = { $regex: search, $options: "i" };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const categories = await ServiceCategoryModel.find(query)
      .skip(skip)
      .limit(Number(limit))
      .sort({ name: 1 });

    const total = await ServiceCategoryModel.countDocuments(query);

    res.status(200).json({
      success: true,
      payload: categories,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: unknown) {
    console.error("Error fetching service categories:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getServiceCategoryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const query = buildCategoryQuery(id);

    const category = await ServiceCategoryModel.findOne(query);

    if (!category) {
      res.status(404).json({ success: false, message: "Service category not found" });
      return;
    }

    res.status(200).json({ success: true, payload: category });
  } catch (error: unknown) {
    console.error("Error fetching service category:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateServiceCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;
    const query = buildCategoryQuery(id);
    const normalizedName = typeof name === "string" ? name.trim() : "";

    const category = await ServiceCategoryModel.findOne(query);

    if (!category) {
      res.status(404).json({ success: false, message: "Service category not found" });
      return;
    }

    if (name !== undefined) {
      if (!normalizedName) {
        res.status(400).json({ success: false, message: "Category name cannot be empty" });
        return;
      }

      category.name = normalizedName;
    }

    if (description !== undefined) {
      category.description = typeof description === "string" ? description.trim() : "";
    }

    const parsedIsActive = parseIsActive(isActive);
    if (parsedIsActive === null) {
      res.status(400).json({ success: false, message: "isActive must be a boolean" });
      return;
    }
    if (parsedIsActive !== undefined) {
      category.isActive = parsedIsActive;
    }

    const imageUrl = uploadedImageUrl(req);
    if (imageUrl) {
      category.image = imageUrl;
    }

    await category.save();

    res.status(200).json({ success: true, payload: category });
  } catch (error: unknown) {
    if (isDuplicateKeyError(error)) {
      res.status(409).json({ success: false, message: "Service category already exists" });
      return;
    }

    console.error("Error updating service category:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteServiceCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const query = buildCategoryQuery(id);

    const category = await ServiceCategoryModel.findOneAndDelete(query);

    if (!category) {
      res.status(404).json({ success: false, message: "Service category not found" });
      return;
    }

    res.status(200).json({ success: true, message: "Service category deleted successfully" });
  } catch (error: unknown) {
    console.error("Error deleting service category:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

