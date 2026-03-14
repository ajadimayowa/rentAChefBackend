import { Request, Response } from "express";
import { Service } from "../../models/Service";
import { Types } from "mongoose";

/* ===================== SERVICE CRUD ===================== */

// CREATE SERVICE
export const createService = async (req: Request, res: Response): Promise<any> => {
  try {
    const { name, description, isActive } = req.body;

    // 1️⃣ Validate input
    if (!name || typeof name !== "string") {
      return res.status(400).json({ success: false, message: "Service name is required" });
    }

    // 2️⃣ Check for duplicate
    const existingService = await Service.findOne({ name: name.trim() });
    if (existingService) {
      return res.status(409).json({ success: false, message: "Service already exists" });
    }

    // 3️⃣ Create the service
    const service = await Service.create({
      name: name.trim(),
      description: description || "",
      isActive: isActive !== undefined ? isActive : true,
    });

    // 4️⃣ Respond with the created service
    return res.status(201).json({ success: true, data: service });

  } catch (error: any) {
    console.error("Error creating service:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET ALL SERVICES
export const getServices = async (req: Request, res: Response): Promise<any> => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    // Build query object
    const query: any = {};

    // 1️⃣ Filter by status
    if (status === "active") query.isActive = true;
    if (status === "inactive") query.isActive = false;

    // 2️⃣ Search by name (case-insensitive)
    if (search && typeof search === "string") {
      query.name = { $regex: search, $options: "i" }; // partial match
    }

    // 3️⃣ Pagination
    const skip = (Number(page) - 1) * Number(limit);

    const services = await Service.find(query)
      .skip(skip)
      .limit(Number(limit))
      .sort({ name: 1 }); // sort alphabetically by name

    const total = await Service.countDocuments(query);

    return res.status(200).json({
      success: true,
      payload: services,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error("Error fetching services:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET SINGLE SERVICE
// GET SINGLE SERVICE
export const getServiceById = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    const service = await Service.findById(id).lean();
    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }

    return res.status(200).json({ success: true, data: service });
  } catch (error: any) {
    console.error("Error fetching service:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// UPDATE SERVICE
export const updateService = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }

    // Update fields if provided
    if (name) service.name = name.trim();
    if (description !== undefined) service.description = description;
    if (isActive !== undefined) service.isActive = isActive;

    await service.save();

    return res.status(200).json({ success: true, data: service });
  } catch (error: any) {
    console.error("Error updating service:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteService = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    // Option 1: find and delete
    const service = await Service.findByIdAndDelete(id);

    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }

    return res.status(200).json({ success: true, message: "Service deleted successfully" });

    // -----------------------------
    // Option 2: soft delete (recommended)
    // const service = await Service.findById(id);
    // if (!service) return res.status(404).json({ success: false, message: "Service not found" });
    // service.isActive = false;
    // await service.save();
    // return res.status(200).json({ success: true, message: "Service deactivated successfully" });
  } catch (error: any) {
    console.error("Error deleting service:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};