import { Request, Response } from "express";
import { Types } from "mongoose";
import { TermsAndConModel } from "../../models/TermsAndCon";
import { ServiceModel } from "../../models/Service";
import { ServiceCategoryModel } from "../../models/ServiceCategoryModel";
import { SpecialMenu } from "../../models/SpecialMenu";

const hasAnyTarget = (serviceId?: unknown, categoryId?: unknown, specialMenuId?: unknown): boolean => {
  return Boolean(serviceId) || Boolean(categoryId) || Boolean(specialMenuId);
};

const isValidObjectId = (value: unknown): value is string => {
  return typeof value === "string" && Types.ObjectId.isValid(value);
};

export const createTermsAndCon = async (req: Request, res: Response): Promise<void> => {
  try {
    const { description, termsUrl, serviceId, categoryId, specialMenuId } = req.body;
    const normalizedDescription = typeof description === "string" ? description.trim() : "";
    const normalizedTermsUrl = typeof termsUrl === "string" ? termsUrl.trim() : "";

    if (!normalizedDescription) {
      res.status(400).json({ success: false, message: "description is required" });
      return;
    }

    if (!hasAnyTarget(serviceId, categoryId, specialMenuId)) {
      res
        .status(400)
        .json({ success: false, message: "One of serviceId, categoryId, or specialMenuId must be provided" });
      return;
    }

    if (serviceId !== undefined && serviceId !== null) {
      if (!isValidObjectId(serviceId)) {
        res.status(400).json({ success: false, message: "Invalid serviceId" });
        return;
      }

      const serviceExists = await ServiceModel.findById(serviceId).lean();
      if (!serviceExists) {
        res.status(404).json({ success: false, message: "Service not found" });
        return;
      }
    }

    if (categoryId !== undefined && categoryId !== null) {
      if (!isValidObjectId(categoryId)) {
        res.status(400).json({ success: false, message: "Invalid categoryId" });
        return;
      }

      const categoryExists = await ServiceCategoryModel.findById(categoryId).lean();
      if (!categoryExists) {
        res.status(404).json({ success: false, message: "Service category not found" });
        return;
      }
    }

    if (specialMenuId !== undefined && specialMenuId !== null) {
      if (!isValidObjectId(specialMenuId)) {
        res.status(400).json({ success: false, message: "Invalid specialMenuId" });
        return;
      }

      const specialMenuExists = await SpecialMenu.findById(specialMenuId).lean();
      if (!specialMenuExists) {
        res.status(404).json({ success: false, message: "Special menu not found" });
        return;
      }
    }

    const record = await TermsAndConModel.create({
      description: normalizedDescription,
      termsUrl: normalizedTermsUrl || undefined,
      serviceId: serviceId || undefined,
      categoryId: categoryId || undefined,
      specialMenuId: specialMenuId || undefined,
    });

    res.status(201).json({ success: true, payload: record });
  } catch (error) {
    console.error("Error creating TermsAndCon:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getTermsAndCons = async (req: Request, res: Response): Promise<void> => {
  try {
    const { serviceId, categoryId, specialMenuId, page = 1, limit = 20 } = req.query;
    const query: Record<string, unknown> = {};

    if (serviceId && isValidObjectId(String(serviceId))) {
      query.serviceId = serviceId;
    }

    if (categoryId && isValidObjectId(String(categoryId))) {
      query.categoryId = categoryId;
    }

    if (specialMenuId && isValidObjectId(String(specialMenuId))) {
      query.specialMenuId = specialMenuId;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const records = await TermsAndConModel.find(query)
      .populate("serviceId", "name")
      .populate("categoryId", "name slug")
      .populate("specialMenuId", "title")
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await TermsAndConModel.countDocuments(query);

    res.status(200).json({
      success: true,
      payload: records,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching TermsAndCon records:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getTermsAndConById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid TermsAndCon id" });
      return;
    }

    const record = await TermsAndConModel.findById(id)
      .populate("serviceId", "name")
      .populate("categoryId", "name slug")
      .populate("specialMenuId", "title");

    if (!record) {
      res.status(404).json({ success: false, message: "TermsAndCon not found" });
      return;
    }

    res.status(200).json({ success: true, payload: record });
  } catch (error) {
    console.error("Error fetching TermsAndCon by id:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateTermsAndCon = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { description, termsUrl, serviceId, categoryId, specialMenuId } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid TermsAndCon id" });
      return;
    }

    const record = await TermsAndConModel.findById(id);
    if (!record) {
      res.status(404).json({ success: false, message: "TermsAndCon not found" });
      return;
    }

    if (description !== undefined) {
      const normalizedDescription = typeof description === "string" ? description.trim() : "";
      if (!normalizedDescription) {
        res.status(400).json({ success: false, message: "description is required" });
        return;
      }
      record.description = normalizedDescription;
    }

    if (termsUrl !== undefined) {
      const normalizedTermsUrl = typeof termsUrl === "string" ? termsUrl.trim() : "";
      record.termsUrl = normalizedTermsUrl || undefined;
    }

    if (serviceId !== undefined) {
      if (serviceId === null || serviceId === "") {
        record.serviceId = undefined;
      } else {
        if (!isValidObjectId(serviceId)) {
          res.status(400).json({ success: false, message: "Invalid serviceId" });
          return;
        }

        const serviceExists = await ServiceModel.findById(serviceId).lean();
        if (!serviceExists) {
          res.status(404).json({ success: false, message: "Service not found" });
          return;
        }

        record.serviceId = new Types.ObjectId(serviceId);
      }
    }

    if (categoryId !== undefined) {
      if (categoryId === null || categoryId === "") {
        record.categoryId = undefined;
      } else {
        if (!isValidObjectId(categoryId)) {
          res.status(400).json({ success: false, message: "Invalid categoryId" });
          return;
        }

        const categoryExists = await ServiceCategoryModel.findById(categoryId).lean();
        if (!categoryExists) {
          res.status(404).json({ success: false, message: "Service category not found" });
          return;
        }

        record.categoryId = new Types.ObjectId(categoryId);
      }
    }

    if (specialMenuId !== undefined) {
      if (specialMenuId === null || specialMenuId === "") {
        record.specialMenuId = undefined;
      } else {
        if (!isValidObjectId(specialMenuId)) {
          res.status(400).json({ success: false, message: "Invalid specialMenuId" });
          return;
        }

        const specialMenuExists = await SpecialMenu.findById(specialMenuId).lean();
        if (!specialMenuExists) {
          res.status(404).json({ success: false, message: "Special menu not found" });
          return;
        }

        record.specialMenuId = new Types.ObjectId(specialMenuId);
      }
    }

    if (!hasAnyTarget(record.serviceId, record.categoryId, record.specialMenuId)) {
      res
        .status(400)
        .json({ success: false, message: "One of serviceId, categoryId, or specialMenuId must be provided" });
      return;
    }

    await record.save();

    res.status(200).json({ success: true, payload: record });
  } catch (error) {
    console.error("Error updating TermsAndCon:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteTermsAndCon = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid TermsAndCon id" });
      return;
    }

    const deleted = await TermsAndConModel.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ success: false, message: "TermsAndCon not found" });
      return;
    }

    res.status(200).json({ success: true, message: "TermsAndCon deleted successfully" });
  } catch (error) {
    console.error("Error deleting TermsAndCon:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
