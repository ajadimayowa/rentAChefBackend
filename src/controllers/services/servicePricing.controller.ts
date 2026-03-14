import { Request, Response } from "express";
import { ServicePricing, IServicePricing } from "../../models/ServicePricing";
import mongoose from "mongoose";

// CREATE a new ServicePricing
export const createServicePricing = async (req: Request, res: Response):Promise<any> => {
  try {
    const { serviceId, chefCategoryId, price, currency } = req.body;

    if (!serviceId || !chefCategoryId || price === undefined) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Check if combination exists
    const exists = await ServicePricing.findOne({ serviceId, chefCategoryId });
    if (exists) {
      return res.status(409).json({ success: false, message: "Service pricing already exists for this category" });
    }

    const servicePricing = await ServicePricing.create({
      serviceId,
      chefCategoryId,
      price,
      currency: currency || "NGN",
    });

    res.status(201).json({ success: true, data: servicePricing });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET ALL ServicePricings (with optional filters)
export const getServicePricings = async (req: Request, res: Response):Promise<any> => {
  try {
    const { serviceId, chefCategoryId } = req.query;

    const filters: any = {};
    if (serviceId) filters.serviceId = serviceId;
    if (chefCategoryId) filters.chefCategoryId = chefCategoryId;

    const servicePricings = await ServicePricing.find(filters)
      .populate("serviceId", "name")
      .populate("chefCategoryId", "name")
       // optional: populate service title

    res.status(200).json({ success: true, data: servicePricings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET ONE ServicePricing by ID
export const getServicePricingById = async (req: Request, res: Response):Promise<any> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const servicePricing = await ServicePricing.findById(id)
      .populate("serviceId", "title")
      .populate("chefCategoryId", "name");

    if (!servicePricing) {
      return res.status(404).json({ success: false, message: "ServicePricing not found" });
    }

    res.status(200).json({ success: true, data: servicePricing });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// UPDATE ServicePricing
export const updateServicePricing = async (req: Request, res: Response):Promise<any> => {
  try {
    const { id } = req.params;
    const { serviceId, chefCategoryId, price, currency } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const servicePricing = await ServicePricing.findById(id);
    if (!servicePricing) {
      return res.status(404).json({ success: false, message: "ServicePricing not found" });
    }

    // Check for duplicate if serviceId or chefCategoryId changes
    if ((serviceId && serviceId != servicePricing.serviceId.toString()) ||
        (chefCategoryId && chefCategoryId != servicePricing.chefCategoryId.toString())) {
      const exists = await ServicePricing.findOne({
        serviceId: serviceId || servicePricing.serviceId,
        chefCategoryId: chefCategoryId || servicePricing.chefCategoryId,
      });
      if (exists) {
        return res.status(409).json({ success: false, message: "Service pricing already exists for this category" });
      }
    }

    servicePricing.serviceId = serviceId || servicePricing.serviceId;
    servicePricing.chefCategoryId = chefCategoryId || servicePricing.chefCategoryId;
    if (price !== undefined) servicePricing.price = price;
    if (currency) servicePricing.currency = currency;

    await servicePricing.save();

    res.status(200).json({ success: true, data: servicePricing });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE ServicePricing
export const deleteServicePricing = async (req: Request, res: Response):Promise<any> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const deleted = await ServicePricing.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "ServicePricing not found" });
    }

    res.status(200).json({ success: true, message: "ServicePricing deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};