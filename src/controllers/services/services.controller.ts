import { Request, Response } from "express";
import { Service } from "../../models/Service.model";
import { Types } from "mongoose";

/* ===================== SERVICE CRUD ===================== */

// CREATE SERVICE
export const createService = async (req: Request, res: Response): Promise<any> => {
  const service = await Service.create(req.body);
  res.status(201).json({ success: true, data: service });
};

// GET ALL SERVICES
export const getServices = async (_req: Request, res: Response): Promise<any> => {
  const services = await Service.find().populate("category", "name");
  res.json({ success: true, payload: services });
};

// GET SINGLE SERVICE
export const getServiceById = async (req: Request, res: Response): Promise<any> => {
  const service = await Service.findById(req.params.id);
  if (!service) return res.status(404).json({ message: "Not found" });
  res.json({ success: true, data: service });
};

// UPDATE SERVICE
export const updateService = async (req: Request, res: Response): Promise<any> => {
  const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  res.json({ success: true, data: service });
};

// DELETE SERVICE
export const deleteService = async (req: Request, res: Response): Promise<any> => {
  await Service.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "Deleted" });
};

/* ===================== SERVICE PLAN CRUD ===================== */

// ADD SERVICE PLAN
export const addServicePlan = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { services } = req.body;

    if (!services || !Array.isArray(services) || services.length === 0) {
      return res.status(400).json({
        success: false,
        message: "services must be a non-empty array",
      });
    }

    const service = await Service.findByIdAndUpdate(
      req.params.serviceId,
      {
        $push: {
          services: { $each: services },
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: service,
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to add service plan",
    });
  }
};

// UPDATE SERVICE PLAN
export const updateServicePlan = async (req: Request, res: Response): Promise<any> => {
  const { serviceId, planId } = req.params;

  const service = await Service.findOneAndUpdate(
    { _id: serviceId, "services._id": planId },
    { $set: { "services.$": req.body } },
    { new: true, runValidators: true }
  );

  res.json({ success: true, data: service });
};

// DELETE SERVICE PLAN
export const deleteServicePlan = async (req: Request, res: Response): Promise<any> => {
  const service = await Service.findByIdAndUpdate(
    req.params.serviceId,
    { $pull: { services: { _id: req.params.planId } } },
    { new: true }
  );
  res.json({ success: true, data: service });
};

/* ===================== OPTIONS CRUD ===================== */

// ADD OPTION
export const addOption = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { serviceId, planId } = req.params;
    const { options } = req.body;

    if (!options || !Array.isArray(options) || options.length === 0) {
      return res.status(400).json({
        success: false,
        message: "options must be a non-empty array",
      });
    }

    const service = await Service.findOneAndUpdate(
      { _id: serviceId, "services._id": planId },
      {
        $push: {
          "services.$.options": { $each: options },
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service or service plan not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: service,
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to add options",
    });
  }
};

// UPDATE OPTION
export const updateOption = async (req: Request, res: Response): Promise<any> => {
  const { serviceId, planId, optionId } = req.params;

  const service = await Service.findOneAndUpdate(
    {
      _id: serviceId,
      "services._id": planId,
      "services.options._id": optionId,
    },
    {
      $set: {
        "services.$[s].options.$[o]": req.body,
      },
    },
    {
      arrayFilters: [
        { "s._id": planId },
        { "o._id": optionId },
      ],
      new: true,
      runValidators: true,
    }
  );

  res.json({ success: true, data: service });
};

export const updateOptions = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { serviceId, planId } = req.params;
    const { options } = req.body;

    if (!Array.isArray(options)) {
      return res.status(400).json({
        success: false,
        message: "options must be an array",
      });
    }

    const service = await Service.findOneAndUpdate(
      { _id: serviceId, "services._id": planId },
      {
        $set: {
          "services.$.options": options, // 🔥 overwrite instead of push
        },
      },
      { new: true, runValidators: true }
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service plan not found",
      });
    }

    res.json({ success: true, data: service });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE OPTION
export const deleteOption = async (req: Request, res: Response) => {
  const { serviceId, planId, optionId } = req.params;

  const service = await Service.findOneAndUpdate(
    { _id: serviceId, "services._id": planId },
    { $pull: { "services.$.options": { _id: optionId } } },
    { new: true }
  );

  res.json({ success: true, data: service });
};