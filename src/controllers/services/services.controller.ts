import { Request, Response } from "express";
import { ServiceModel } from "../../models/Service";
import { Types } from "mongoose";
import { ServiceCategoryModel } from "../../models/ServiceCategoryModel";
import Category from "../../models/Category";

/* ===================== SERVICE CRUD ===================== */

const ALLOWED_BOOKING_TYPES = ["instant", "quotation"] as const;

const isDuplicateKeyError = (error: unknown): boolean => {
  const typedError = error as { code?: number };
  return typedError?.code === 11000;
};

/*
 * Create/update accept JSON or multipart (when a picture is attached). Multipart sends
 * every field as a string, so booleans may arrive as "true"/"false" and
 * allowedChefLevels as a JSON-encoded array (an empty array can't be expressed as
 * repeated form fields).
 */

/** undefined when absent, null when present but not a boolean. */
const parseBoolean = (value: unknown): boolean | undefined | null => {
  if (value === undefined) return undefined;
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
};

/**
 * allowedChefLevels holds chef-level (Category) ids. Returns [] when absent,
 * null when malformed, or names the first id that isn't an existing chef level.
 */
const normalizeChefLevels = async (
  allowedChefLevels: unknown
): Promise<Types.ObjectId[] | null | { unknownId: string }> => {
  if (allowedChefLevels === undefined) return [];

  let list: unknown = allowedChefLevels;
  if (typeof list === "string") {
    try {
      list = JSON.parse(list);
    } catch {
      return null;
    }
  }
  if (!Array.isArray(list)) return null;

  const ids = [...new Set(list.map((v) => (typeof v === "string" ? v.trim() : "")))];
  if (ids.some((id) => !Types.ObjectId.isValid(id))) return null;
  if (!ids.length) return [];

  const found = await Category.find({ _id: { $in: ids } }).select("_id").lean();
  const foundIds = new Set(found.map((c: any) => String(c._id)));
  const missing = ids.find((id) => !foundIds.has(id));
  if (missing) return { unknownId: missing };

  return ids.map((id) => new Types.ObjectId(id));
};

const chefLevelError = (result: null | { unknownId: string }): string =>
  result === null
    ? "allowedChefLevels must be an array of chef level ids"
    : `Chef level ${result.unknownId} does not exist`;

const uploadedImageUrl = (req: Request): string | undefined => {
  const file = req.file as any;
  return file ? file.location || file.path : undefined;
};

const CAPABILITY_FIELDS = ["supportsChefMenu", "supportsCustomerMenuUpload", "supportsProcurement"] as const;

// CREATE SERVICE
export const createService = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      icon,
      categoryId,
      description,
      workflow,
      allowedChefLevels,
      bookingType,
      isActive,
    } = req.body;
    const normalizedName = typeof name === "string" ? name.trim() : "";
    const normalizedDescription = typeof description === "string" ? description.trim() : "";
    const normalizedIcon = typeof icon === "string" ? icon.trim() : "";
    const normalizedWorkflow = typeof workflow === "string" ? workflow.trim() : "";
    const normalizedBookingType =
      typeof bookingType === "string" ? bookingType.trim().toLowerCase() : "";
    const normalizedChefLevels = await normalizeChefLevels(allowedChefLevels);
    const parsedIsActive = parseBoolean(isActive);
    const imageUrl = uploadedImageUrl(req);

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

    if (!Array.isArray(normalizedChefLevels)) {
      res.status(400).json({ success: false, message: chefLevelError(normalizedChefLevels) });
      return;
    }

    if (!imageUrl) {
      res.status(400).json({ success: false, message: "A service image is required" });
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
      image: imageUrl,
      name: normalizedName,
      description: normalizedDescription,
      workflow: normalizedWorkflow,
      allowedChefLevels: normalizedChefLevels,
      bookingType: normalizedBookingType,
      isActive: parsedIsActive ?? true,
      // Only pass real booleans through; anything else falls back to the schema defaults.
      ...Object.fromEntries(
        CAPABILITY_FIELDS.map((field) => [field, parseBoolean(req.body[field])]).filter(
          ([, value]) => typeof value === "boolean"
        )
      ),
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
      const normalizedChefLevels = await normalizeChefLevels(allowedChefLevels);
      if (!Array.isArray(normalizedChefLevels)) {
        res.status(400).json({ success: false, message: chefLevelError(normalizedChefLevels) });
        return;
      }

      service.allowedChefLevels = normalizedChefLevels;
    } else if (!Array.isArray(service.allowedChefLevels)) {
      // Services saved before chef levels became records hold names like "senior",
      // which can't be cast to ids and would make save() fail — clear them.
      service.allowedChefLevels = [];
    }

    for (const field of CAPABILITY_FIELDS) {
      const value = parseBoolean(req.body[field]);
      if (value === null) {
        res.status(400).json({ success: false, message: `${field} must be a boolean` });
        return;
      }
      if (value !== undefined) service[field] = value;
    }

    const imageUrl = uploadedImageUrl(req);
    if (imageUrl) service.image = imageUrl;

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

    const parsedIsActive = parseBoolean(isActive);
    if (parsedIsActive === null) {
      res.status(400).json({ success: false, message: "isActive must be a boolean" });
      return;
    }
    if (parsedIsActive !== undefined) service.isActive = parsedIsActive;

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
