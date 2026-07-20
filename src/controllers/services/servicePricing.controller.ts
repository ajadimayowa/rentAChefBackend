import { Request, Response } from "express";
import { ServicePricing } from "../../models/ServicePricing";
import { ServiceModel } from "../../models/Service";
import { SpecialMenu } from "../../models/SpecialMenu";
import mongoose from "mongoose";

const buildTargetMatchFilter = (serviceId?: any, specialServiceId?: any, chefCategoryId?: any) => {
  const clauses: any[] = [];

  if (serviceId) {
    clauses.push({ serviceId });
  } else {
    clauses.push({ $or: [{ serviceId: null }, { serviceId: { $exists: false } }] });
  }

  clauses.push({ $or: [{ serviceCategoryId: null }, { serviceCategoryId: { $exists: false } }] });

  if (specialServiceId) {
    clauses.push({ specialServiceId });
  } else {
    clauses.push({ $or: [{ specialServiceId: null }, { specialServiceId: { $exists: false } }] });
  }

  clauses.push({ chefCategoryId });

  return { $and: clauses };
};

// CREATE a new ServicePricing
export const createServicePricing = async (req: Request, res: Response):Promise<any> => {
  try {
    const {
      serviceId,
      specialServiceId,
      chefCategoryId,
      pricingType,
      numberOfDays,
      monthlySubFee,
      description,
      basePriceMinor,
      currency,
      servicePricingOptions,
      effectiveFrom,
      effectiveTo,
      isActive,
    } = req.body;


    if (!serviceId && !specialServiceId) {
      return res.status(400).json({ success: false, message: "Either serviceId or specialServiceId is required" });
    }

    if (serviceId && specialServiceId) {
      return res.status(400).json({ success: false, message: "Provide only one target: serviceId or specialServiceId" });
    }

    if (basePriceMinor === undefined) {
      return res.status(400).json({ success: false, message: "basePriceMinor is required" });
    }

    const resolvedPricingType = pricingType || "levelbased";
    if (!["daybased", "levelbased"].includes(resolvedPricingType)) {
      return res.status(400).json({ success: false, message: "pricingType must be either daybased or levelbased" });
    }

    let resolvedNumberOfDays: number | undefined;
    if (numberOfDays !== undefined && numberOfDays !== null && numberOfDays !== "") {
      const parsedNumberOfDays = Number(numberOfDays);
      if (!Number.isInteger(parsedNumberOfDays) || parsedNumberOfDays < 1) {
        return res.status(400).json({ success: false, message: "numberOfDays must be an integer greater than or equal to 1" });
      }
      resolvedNumberOfDays = parsedNumberOfDays;
    }

    if (resolvedPricingType === "daybased" && !resolvedNumberOfDays) {
      return res.status(400).json({ success: false, message: "numberOfDays is required when pricingType is daybased" });
    }

    let resolvedMonthlySubFee: number | undefined;
    if (monthlySubFee !== undefined && monthlySubFee !== null && monthlySubFee !== "") {
      const parsedMonthlySubFee = Number(monthlySubFee);
      if (!Number.isFinite(parsedMonthlySubFee) || parsedMonthlySubFee < 0) {
        return res.status(400).json({ success: false, message: "monthlySubFee must be a number greater than or equal to 0" });
      }
      resolvedMonthlySubFee = parsedMonthlySubFee;
    }

    if (resolvedPricingType === "daybased" && resolvedMonthlySubFee === undefined) {
      return res.status(400).json({ success: false, message: "monthlySubFee is required when pricingType is daybased" });
    }

    if (serviceId && !mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({ success: false, message: "Invalid serviceId" });
    }

    if (specialServiceId && !mongoose.Types.ObjectId.isValid(specialServiceId)) {
      return res.status(400).json({ success: false, message: "Invalid specialServiceId" });
    }

    if (!mongoose.Types.ObjectId.isValid(chefCategoryId)) {
      return res.status(400).json({ success: false, message: "Invalid chefCategoryId" });
    }

    if (serviceId) {
      const service = await ServiceModel.findById(serviceId).select("_id");
      if (!service) {
        return res.status(404).json({ success: false, message: "Service not found" });
      }
    }

    if (specialServiceId) {
      const specialService = await SpecialMenu.findById(specialServiceId).select("_id");
      if (!specialService) {
        return res.status(404).json({ success: false, message: "Special service not found" });
      }
    }

    const exists = await ServicePricing.findOne({
      ...buildTargetMatchFilter(serviceId, specialServiceId, chefCategoryId),
      pricingType: resolvedPricingType,
      isActive: true,
      $or: [{ effectiveTo: null }, { effectiveTo: { $exists: false } }],
    });

    if (exists) {
      return res.status(409).json({ success: false, message: "Active pricing already exists for this target" });
    }

    const servicePricing = await ServicePricing.create({
      serviceId,
      chefCategoryId,
      specialServiceId,
      pricingType: resolvedPricingType,
      numberOfDays: resolvedPricingType === "daybased" ? resolvedNumberOfDays : undefined,
      monthlySubFee: resolvedPricingType === "daybased" ? resolvedMonthlySubFee : undefined,
      description: description?.trim?.() || undefined,
      basePriceMinor: Number(basePriceMinor),
      currency: currency || "NGN",
      servicePricingOptions: Array.isArray(servicePricingOptions) ? servicePricingOptions : [],
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
      effectiveTo: effectiveTo ? new Date(effectiveTo) : undefined,
      isActive: isActive === undefined ? true : Boolean(isActive),
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
    const { serviceId, specialServiceId, chefCategoryId, pricingType, isActive } = req.query;

    const filters: any = {};
    if (serviceId) filters.serviceId = serviceId;
    if (specialServiceId) filters.specialServiceId = specialServiceId;
    if (chefCategoryId) filters.chefCategoryId = chefCategoryId;
    if (pricingType) filters.pricingType = pricingType;
    if (isActive !== undefined) filters.isActive = String(isActive) === "true";

    const servicePricings = await ServicePricing.find(filters)
      .populate("serviceId", "name code")
      .populate("specialServiceId", "name slug description")
      .populate("chefCategoryId", "name slug description tasks")
      .sort({ createdAt: -1 });

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
      .populate("serviceId", "name code")
      .populate("specialServiceId", "name slug")
      .populate("chefCategoryId", "name slug");

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
    const {
      serviceId,
      specialServiceId,
      chefCategoryId,
      pricingType,
      numberOfDays,
      monthlySubFee,
      description,
      basePriceMinor,
      currency,
      servicePricingOptions,
      effectiveFrom,
      effectiveTo,
      isActive,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const servicePricing = await ServicePricing.findById(id);
    if (!servicePricing) {
      return res.status(404).json({ success: false, message: "ServicePricing not found" });
    }

    if (serviceId && !mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({ success: false, message: "Invalid serviceId" });
    }

    if (specialServiceId && !mongoose.Types.ObjectId.isValid(specialServiceId)) {
      return res.status(400).json({ success: false, message: "Invalid specialServiceId" });
    }

    if (chefCategoryId && !mongoose.Types.ObjectId.isValid(chefCategoryId)) {
      return res.status(400).json({ success: false, message: "Invalid chefCategoryId" });
    }

    const hasServiceIdField = Object.prototype.hasOwnProperty.call(req.body, "serviceId");
    const hasChefCategoryIdField = Object.prototype.hasOwnProperty.call(req.body, "chefCategoryId");
    const hasSpecialServiceIdField = Object.prototype.hasOwnProperty.call(req.body, "specialServiceId");
    const hasPricingTypeField = Object.prototype.hasOwnProperty.call(req.body, "pricingType");
    const hasNumberOfDaysField = Object.prototype.hasOwnProperty.call(req.body, "numberOfDays");
    const hasMonthlySubFeeField = Object.prototype.hasOwnProperty.call(req.body, "monthlySubFee");

    let resolvedServiceId = servicePricing.serviceId;
    let resolvedChefCategoryId = servicePricing.chefCategoryId;
    let resolvedSpecialServiceId = servicePricing.specialServiceId;
    let resolvedPricingType = servicePricing.pricingType || "levelbased";
    let resolvedNumberOfDays = servicePricing.numberOfDays;
    let resolvedMonthlySubFee = servicePricing.monthlySubFee;
    
    if (hasServiceIdField) {
      if (serviceId === null || serviceId === "") {
        resolvedServiceId = undefined as any;
      } else {
        resolvedServiceId = serviceId;
      }
    }

    if (hasSpecialServiceIdField) {
      if (specialServiceId === null || specialServiceId === "") {
        resolvedSpecialServiceId = undefined as any;
      } else {
        resolvedSpecialServiceId = specialServiceId;
      }
    }

    if (hasChefCategoryIdField) {
      if (chefCategoryId === null || chefCategoryId === "") {
        resolvedChefCategoryId = undefined as any;
      } else {
        resolvedChefCategoryId = chefCategoryId;
      }
    }

    if (hasPricingTypeField) {
      if (!["daybased", "levelbased"].includes(pricingType)) {
        return res.status(400).json({ success: false, message: "pricingType must be either daybased or levelbased" });
      }
      resolvedPricingType = pricingType;
    }

    if (hasNumberOfDaysField) {
      if (numberOfDays === null || numberOfDays === "") {
        resolvedNumberOfDays = undefined;
      } else {
        const parsedNumberOfDays = Number(numberOfDays);
        if (!Number.isInteger(parsedNumberOfDays) || parsedNumberOfDays < 1) {
          return res.status(400).json({ success: false, message: "numberOfDays must be an integer greater than or equal to 1" });
        }
        resolvedNumberOfDays = parsedNumberOfDays;
      }
    }

    if (hasMonthlySubFeeField) {
      if (monthlySubFee === null || monthlySubFee === "") {
        resolvedMonthlySubFee = undefined;
      } else {
        const parsedMonthlySubFee = Number(monthlySubFee);
        if (!Number.isFinite(parsedMonthlySubFee) || parsedMonthlySubFee < 0) {
          return res.status(400).json({ success: false, message: "monthlySubFee must be a number greater than or equal to 0" });
        }
        resolvedMonthlySubFee = parsedMonthlySubFee;
      }
    }

    if (!resolvedServiceId && !resolvedSpecialServiceId) {
      return res.status(400).json({ success: false, message: "Either serviceId or specialServiceId is required" });
    }

    if (resolvedServiceId && resolvedSpecialServiceId) {
      return res.status(400).json({ success: false, message: "Provide only one target: serviceId or specialServiceId" });
    }

    if (!resolvedChefCategoryId) {
      return res.status(400).json({ success: false, message: "chefCategoryId is required" });
    }

    if (resolvedPricingType === "daybased" && !resolvedNumberOfDays) {
      return res.status(400).json({ success: false, message: "numberOfDays is required when pricingType is daybased" });
    }

    if (resolvedPricingType === "daybased" && resolvedMonthlySubFee === undefined) {
      return res.status(400).json({ success: false, message: "monthlySubFee is required when pricingType is daybased" });
    }

    if (hasServiceIdField || hasChefCategoryIdField || hasSpecialServiceIdField || hasPricingTypeField) {
      if (resolvedServiceId) {
        const service = await ServiceModel.findById(resolvedServiceId).select("_id");
        if (!service) {
          return res.status(404).json({ success: false, message: "Service not found" });
        }
      }

      if (resolvedSpecialServiceId) {
        const specialService = await SpecialMenu.findById(resolvedSpecialServiceId).select("_id");
        if (!specialService) {
          return res.status(404).json({ success: false, message: "Special service not found" });
        }
      }

      const exists = await ServicePricing.findOne({
        ...buildTargetMatchFilter(resolvedServiceId, resolvedSpecialServiceId, resolvedChefCategoryId),
        pricingType: resolvedPricingType,
        _id: { $ne: id },
        isActive: true,
        $or: [{ effectiveTo: null }, { effectiveTo: { $exists: false } }],
      });

      if (exists) {
        return res.status(409).json({ success: false, message: "Active pricing already exists for this target" });
      }
    }

    servicePricing.serviceId = resolvedServiceId as any;
    servicePricing.serviceCategoryId = undefined as any;
    servicePricing.chefCategoryId = resolvedChefCategoryId;
    servicePricing.specialServiceId = resolvedSpecialServiceId as any;
    servicePricing.pricingType = resolvedPricingType;
    servicePricing.numberOfDays = resolvedPricingType === "daybased" ? resolvedNumberOfDays : undefined;
    servicePricing.monthlySubFee = resolvedPricingType === "daybased" ? resolvedMonthlySubFee : undefined;
    
    if (description !== undefined) servicePricing.description = String(description).trim();
    if (basePriceMinor !== undefined) servicePricing.basePriceMinor = Number(basePriceMinor);
    if (currency) servicePricing.currency = currency;
    if (Array.isArray(servicePricingOptions)) servicePricing.servicePricingOptions = servicePricingOptions;
    if (effectiveFrom !== undefined) servicePricing.effectiveFrom = new Date(effectiveFrom);
    if (effectiveTo !== undefined) servicePricing.effectiveTo = effectiveTo ? new Date(effectiveTo) : undefined;
    if (isActive !== undefined) servicePricing.isActive = Boolean(isActive);

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