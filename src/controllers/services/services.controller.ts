import { Request, Response } from "express";
import { ServiceModel } from "../../models/Service";
import { Types } from "mongoose";
import { ServiceCategoryModel } from "../../models/ServiceCategoryModel";

/* ===================== SERVICE CRUD ===================== */

const ALLOWED_CHEF_LEVELS = ["sous","executive","junior","senior","pro","head"] as const;
const ALLOWED_BOOKING_TYPES = ["instant", "quotation"] as const;

const isDuplicateKeyError = (error: unknown): boolean => {
  const typedError = error as { code?: number };
  return typedError?.code === 11000;
};

const normalizeChefLevels = (
  allowedChefLevels: unknown
): Array<(typeof ALLOWED_CHEF_LEVELS)[number]> | null => {
  if (allowedChefLevels === undefined) return [];

  if (!Array.isArray(allowedChefLevels)) {
    return null;
  }

  const normalized = allowedChefLevels
    .filter((level): level is string => typeof level === "string")
    .map((level) => level.trim().toLowerCase())
    .filter((level) => ALLOWED_CHEF_LEVELS.includes(level as (typeof ALLOWED_CHEF_LEVELS)[number]));

  return [...new Set(normalized)] as Array<(typeof ALLOWED_CHEF_LEVELS)[number]>;
};

// CREATE SERVICE
export const createService = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, icon, categoryId, description, workflow, allowedChefLevels, bookingType, isActive } = req.body;
    const normalizedName = typeof name === "string" ? name.trim() : "";
    const normalizedDescription = typeof description === "string" ? description.trim() : "";
    const normalizedIcon = typeof icon === "string" ? icon.trim() : "";
    const normalizedWorkflow = typeof workflow === "string" ? workflow.trim() : "";
    const normalizedBookingType =
      typeof bookingType === "string" ? bookingType.trim().toLowerCase() : "";
    const normalizedChefLevels = normalizeChefLevels(allowedChefLevels);

    if (!normalizedName) {
      res.status(400).json({ success: false, message: "Service name is required" });
      return;
    }

    if (!categoryId || !Types.ObjectId.isValid(categoryId)) {
      res.status(400).json({ success: false, message: "Valid categoryId is required" });
      return;
    }

    if (!normalizedWorkflow) {
      res.status(400).json({ success: false, message: "workflow is required" });
      return;
    }

    if (!ALLOWED_BOOKING_TYPES.includes(normalizedBookingType as (typeof ALLOWED_BOOKING_TYPES)[number])) {
      res
        .status(400)
        .json({ success: false, message: "bookingType must be either instant or quotation" });
      return;
    }

    if (normalizedChefLevels === null) {
      res
        .status(400)
        .json({ success: false, message: "allowedChefLevels must be an array of valid chef levels" });
      return;
    }

    const categoryExists = await ServiceCategoryModel.findById(categoryId).lean();
    if (!categoryExists) {
      res.status(404).json({ success: false, message: "Service category not found" });
      return;
    }

    const existingService = await ServiceModel.findOne({
      categoryId,
      name: { $regex: `^${normalizedName}$`, $options: "i" },
    }).lean();

    if (existingService) {
      res.status(409).json({ success: false, message: "Service already exists in this category" });
      return;
    }

    const service = await ServiceModel.create({
      categoryId,
      icon: typeof normalizedIcon === "string" ? normalizedIcon : "",
      name: normalizedName,
      description: normalizedDescription,
      workflow: normalizedWorkflow,
      allowedChefLevels: normalizedChefLevels,
      bookingType: normalizedBookingType,
      isActive: typeof isActive === "boolean" ? isActive : true,
    });

    res.status(201).json({ success: true, payload: service });
  } catch (error: unknown) {
    if (isDuplicateKeyError(error)) {
      res.status(409).json({ success: false, message: "Service already exists" });
      return;
    }

    console.error("Error creating service:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET ALL SERVICES
export const getServices = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, search, page = 1, limit = 20, categoryId, bookingType, workflow } = req.query;

    const query: Record<string, unknown> = {};

    if (status === "active") query.isActive = true;
    if (status === "inactive") query.isActive = false;

    if (search && typeof search === "string") {
      query.name = { $regex: search.trim(), $options: "i" };
    }

    if (categoryId && Types.ObjectId.isValid(String(categoryId))) {
      query.categoryId = categoryId;
    }

    if (
      bookingType &&
      typeof bookingType === "string" &&
      ALLOWED_BOOKING_TYPES.includes(bookingType.trim().toLowerCase() as (typeof ALLOWED_BOOKING_TYPES)[number])
    ) {
      query.bookingType = bookingType.trim().toLowerCase();
    }

    if (workflow && typeof workflow === "string" && workflow.trim()) {
      query.workflow = workflow.trim();
    }

    const skip = (Number(page) - 1) * Number(limit);

    const services = await ServiceModel.find(query)
      .populate("categoryId", "name slug")
      .skip(skip)
      .limit(Number(limit))
      .sort({ name: 1 });

    const total = await ServiceModel.countDocuments(query);

    res.status(200).json({
      success: true,
      payload: services,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: unknown) {
    console.error("Error fetching services:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET SINGLE SERVICE
export const getServiceById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid service id" });
      return;
    }

    const service = await ServiceModel.findById(id).populate("categoryId", "name slug").lean();
    if (!service) {
      res.status(404).json({ success: false, message: "Service not found" });
      return;
    }

    res.status(200).json({ success: true, payload: service });
  } catch (error: unknown) {
    console.error("Error fetching service:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// UPDATE SERVICE
export const updateService = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, categoryId, icon, description, workflow, allowedChefLevels, bookingType, isActive } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid service id" });
      return;
    }

    const service = await ServiceModel.findById(id);
    if (!service) {
      res.status(404).json({ success: false, message: "Service not found" });
      return;
    }

    if (name !== undefined) {
      const normalizedName = typeof name === "string" ? name.trim() : "";
      if (!normalizedName) {
        res.status(400).json({ success: false, message: "Service name cannot be empty" });
        return;
      }

      service.name = normalizedName;
    }

    if (icon !== undefined) {
      const normalizedIcon = typeof icon === "string" ? icon.trim() : "";
      service.icon = normalizedIcon;
    }

    if (description !== undefined) {
      const normalizedDescription = typeof description === "string" ? description.trim() : "";
      service.description = normalizedDescription;
    }

    if (categoryId !== undefined) {
      if (!Types.ObjectId.isValid(categoryId)) {
        res.status(400).json({ success: false, message: "Invalid categoryId" });
        return;
      }

      const categoryExists = await ServiceCategoryModel.findById(categoryId).lean();
      if (!categoryExists) {
        res.status(404).json({ success: false, message: "Service category not found" });
        return;
      }

      service.categoryId = categoryId;
    }

    if (workflow !== undefined) {
      const normalizedWorkflow = typeof workflow === "string" ? workflow.trim() : "";
      if (!normalizedWorkflow) {
        res.status(400).json({ success: false, message: "workflow cannot be empty" });
        return;
      }

      service.workflow = normalizedWorkflow;
    }

    if (allowedChefLevels !== undefined) {
      const normalizedChefLevels = normalizeChefLevels(allowedChefLevels);
      if (normalizedChefLevels === null) {
        res
          .status(400)
          .json({ success: false, message: "allowedChefLevels must be an array of valid chef levels" });
        return;
      }

      service.allowedChefLevels = normalizedChefLevels;
    }

    if (bookingType !== undefined) {
      const normalizedBookingType =
        typeof bookingType === "string" ? bookingType.trim().toLowerCase() : "";

      if (!ALLOWED_BOOKING_TYPES.includes(normalizedBookingType as (typeof ALLOWED_BOOKING_TYPES)[number])) {
        res
          .status(400)
          .json({ success: false, message: "bookingType must be either instant or quotation" });
        return;
      }

      service.bookingType = normalizedBookingType as "instant" | "quotation";
    }

    if (isActive !== undefined) {
      if (typeof isActive !== "boolean") {
        res.status(400).json({ success: false, message: "isActive must be a boolean" });
        return;
      }

      service.isActive = isActive;
    }

    await service.save();

    res.status(200).json({ success: true, payload: service });
  } catch (error: unknown) {
    if (isDuplicateKeyError(error)) {
      res.status(409).json({ success: false, message: "Service already exists" });
      return;
    }

    console.error("Error updating service:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteService = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid service id" });
      return;
    }

    const service = await ServiceModel.findByIdAndDelete(id);

    if (!service) {
      res.status(404).json({ success: false, message: "Service not found" });
      return;
    }

    res.status(200).json({ success: true, message: "Service deleted successfully" });
  } catch (error: unknown) {
    console.error("Error deleting service:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
