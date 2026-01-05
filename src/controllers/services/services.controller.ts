import { Request, Response } from "express";
import { Service } from "../../models/Service.model";
import Category from "../../models/Category";

/**
 * CREATE SERVICE
 */
export const createService = async (req: Request, res: Response) : Promise<any> => {
  try {
    const { name, description, price, category, services = [] } = req.body;

    // Validate category existence
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const service = await Service.create({
      name,
      description,
      price,
      category,
      services, // 👈 options allowed on create
    });

    return res.status(201).json({
      success: true,
      message: "Service created successfully",
      payload: service,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error creating service",
      payload: error,
    });
  }
};


/**
 * GET ALL SERVICES
 */
export const getAllServices = async (req: Request, res: Response) : Promise<any> => {
  try {
    const {
      page = "1",
      limit = "10",
      categoryId,
      priceSort, // asc | desc
    } = req.query;

    const pageNumber = Math.max(parseInt(page as string, 10), 1);
    const pageSize = Math.max(parseInt(limit as string, 10), 1);
    const skip = (pageNumber - 1) * pageSize;

    // 🔎 Filters
    const filter: any = {};
    if (categoryId) {
      filter.category = categoryId;
    }

    // 🔃 Sorting
    const sort: any = {};
    if (priceSort === "asc") sort.price = 1;
    if (priceSort === "desc") sort.price = -1;

    // Default sort (newest first)
    if (!priceSort) sort.createdAt = -1;

    const [services, total] = await Promise.all([
      Service.find(filter)
        .populate("category", "name slug")
        .sort(sort)
        .skip(skip)
        .limit(pageSize),

      Service.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      meta: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
      payload: services,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching services",
      payload: error,
    });
  }
};


/**
 * GET SERVICES BY CATEGORY
 */
export const getServicesByCategory = async (req: Request, res: Response) : Promise<any> => {
  try {
    const { categoryId } = req.params;

    const services = await Service.find({ category: categoryId })
      .populate("category", "name slug");

    return res.status(200).json({
      success: true,
      payload: services,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching services by category",
      payload: error,
    });
  }
};


/**
 * GET SINGLE SERVICE
 */
export const getServiceById = async (req: Request, res: Response) : Promise<any>=> {
  try {
    const service = await Service.findById(req.params.id)
      .populate("category", "name slug");

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    return res.status(200).json({
      success: true,
      payload: service,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching service",
      payload: error,
    });
  }
};


/**
 * UPDATE SERVICE
 */
export const updateService = async (req: Request, res: Response): Promise<any> => {
  try {
    const updatedService = await Service.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedService) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Service updated successfully",
      payload: updatedService,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error updating service",
      payload: error,
    });
  }
};


/**
 * DELETE SERVICE
 */
export const deleteService = async (req: Request, res: Response): Promise<any> => {
  try {
    const deletedService = await Service.findByIdAndDelete(req.params.id);

    if (!deletedService) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Service deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error deleting service",
      payload: error,
    });
  }
};
