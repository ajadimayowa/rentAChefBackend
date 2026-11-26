import { Request, Response } from "express";
import { Types } from "mongoose";
import { ServiceRateModel } from "../../models/ServiceRate";
import { ServiceModel } from "../../models/Service";

type RateFields = {
  serviceId?: Types.ObjectId;
  minGuests?: number;
  maxGuests?: number | null;
  pricingType?: "fixed" | "quoted";
  ratePerStaff?: number | null;
  isActive?: boolean;
};

const wholeNumber = (value: unknown) => Number.isInteger(Number(value)) && Number(value) >= 1;

/**
 * `current` is the saved pricing when updating, so a rate switched to "fixed"
 * must come with an amount.
 */
const parse = (
  body: any,
  partial: boolean,
  current?: { pricingType: "fixed" | "quoted"; ratePerStaff: number | null }
): { fields: RateFields } | { error: string } => {
  const fields: RateFields = {};
  if (body.serviceId !== undefined || !partial) {
    if (!Types.ObjectId.isValid(String(body.serviceId ?? ""))) return { error: "Select a service" };
    fields.serviceId = new Types.ObjectId(String(body.serviceId));
  }
  if (body.minGuests !== undefined || !partial) {
    if (!wholeNumber(body.minGuests)) return { error: "Minimum guests must be a whole number of 1 or more" };
    fields.minGuests = Number(body.minGuests);
  }
  if (body.maxGuests !== undefined) {
    if (body.maxGuests === null || body.maxGuests === "") fields.maxGuests = null;
    else if (!wholeNumber(body.maxGuests)) return { error: "Maximum guests must be a whole number of 1 or more" };
    else fields.maxGuests = Number(body.maxGuests);
  }
  if (body.pricingType !== undefined) {
    if (body.pricingType !== "fixed" && body.pricingType !== "quoted") return { error: "pricingType must be fixed or quoted" };
    fields.pricingType = body.pricingType;
  }
  const pricingType = fields.pricingType ?? current?.pricingType ?? "fixed";

  if (pricingType === "quoted") {
    // Quoted ranges carry no price.
    fields.ratePerStaff = null;
  } else if (body.ratePerStaff !== undefined || !partial || (fields.pricingType === "fixed" && current?.ratePerStaff == null)) {
    const rate = Number(body.ratePerStaff);
    if (body.ratePerStaff === undefined || body.ratePerStaff === "" || body.ratePerStaff === null || !Number.isFinite(rate) || rate < 0) {
      return { error: "Rate per staff must be an amount of zero or more" };
    }
    fields.ratePerStaff = rate;
  }
  if (body.isActive !== undefined) {
    if (typeof body.isActive !== "boolean") return { error: "isActive must be true or false" };
    fields.isActive = body.isActive;
  }
  return { fields };
};

/** Another rate for the same service whose guest range overlaps [min, max]. */
const findOverlap = async (serviceId: Types.ObjectId, min: number, max: number | null | undefined, excludeId?: string) => {
  const upper = max ?? Number.MAX_SAFE_INTEGER;
  const others = await ServiceRateModel.find({ serviceId, ...(excludeId ? { _id: { $ne: excludeId } } : {}) });
  return others.find((r) => r.minGuests <= upper && (r.maxGuests ?? Number.MAX_SAFE_INTEGER) >= min);
};

const rangeLabel = (min: number, max?: number | null) => (max ? `${min}–${max}` : `${min}+`);

const validateRange = async (f: Required<Pick<RateFields, "serviceId" | "minGuests">> & RateFields, excludeId?: string) => {
  if (f.maxGuests != null && f.maxGuests < f.minGuests) return "Maximum guests can't be less than minimum guests";
  const clash = await findOverlap(f.serviceId, f.minGuests, f.maxGuests, excludeId);
  if (clash) return `This range overlaps the ${rangeLabel(clash.minGuests, clash.maxGuests)} guests rate for this service`;
  return null;
};

// GET /service-rates?serviceId= — public: active rates for a service, smallest range first
export const listServiceRates = async (req: Request, res: Response): Promise<any> => {
  try {
    const serviceId = String(req.query.serviceId ?? "");
    if (!Types.ObjectId.isValid(serviceId)) return res.status(400).json({ success: false, message: "Invalid serviceId" });
    const rates = await ServiceRateModel.find({ serviceId, isActive: true }).sort({ minGuests: 1 });
    return res.status(200).json({ success: true, payload: rates });
  } catch (error) {
    console.error("listServiceRates error:", error);
    return res.status(500).json({ success: false, message: "Could not load rates" });
  }
};

// GET /settings/service-rates — admin: every rate with its service name
export const listAllServiceRates = async (_req: Request, res: Response): Promise<any> => {
  try {
    const rates = await ServiceRateModel.find().populate("serviceId", "name").sort({ serviceId: 1, minGuests: 1 });
    return res.status(200).json({ success: true, payload: rates });
  } catch (error) {
    console.error("listAllServiceRates error:", error);
    return res.status(500).json({ success: false, message: "Could not load rates" });
  }
};

export const createServiceRate = async (req: Request, res: Response): Promise<any> => {
  try {
    const parsed = parse(req.body ?? {}, false);
    if ("error" in parsed) return res.status(400).json({ success: false, message: parsed.error });
    const f = parsed.fields as Required<Pick<RateFields, "serviceId" | "minGuests">> & RateFields;
    if (!(await ServiceModel.exists({ _id: f.serviceId }))) return res.status(404).json({ success: false, message: "Service not found" });
    const rangeError = await validateRange(f);
    if (rangeError) return res.status(409).json({ success: false, message: rangeError });
    const rate = await ServiceRateModel.create(f);
    await rate.populate("serviceId", "name");
    return res.status(201).json({ success: true, payload: rate });
  } catch (error) {
    console.error("createServiceRate error:", error);
    return res.status(500).json({ success: false, message: "Could not create the rate" });
  }
};

export const updateServiceRate = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid rate id" });
    const rate = await ServiceRateModel.findById(id);
    if (!rate) return res.status(404).json({ success: false, message: "Rate not found" });

    const parsed = parse(req.body ?? {}, true, {
      pricingType: rate.pricingType ?? "fixed",
      ratePerStaff: rate.ratePerStaff ?? null,
    });
    if ("error" in parsed) return res.status(400).json({ success: false, message: parsed.error });
    if (parsed.fields.serviceId && !(await ServiceModel.exists({ _id: parsed.fields.serviceId }))) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }

    const merged = {
      serviceId: parsed.fields.serviceId ?? rate.serviceId,
      minGuests: parsed.fields.minGuests ?? rate.minGuests,
      maxGuests: parsed.fields.maxGuests !== undefined ? parsed.fields.maxGuests : rate.maxGuests,
    };
    const rangeError = await validateRange(merged, id);
    if (rangeError) return res.status(409).json({ success: false, message: rangeError });

    rate.set(parsed.fields);
    await rate.save();
    await rate.populate("serviceId", "name");
    return res.status(200).json({ success: true, payload: rate });
  } catch (error) {
    console.error("updateServiceRate error:", error);
    return res.status(500).json({ success: false, message: "Could not update the rate" });
  }
};

export const deleteServiceRate = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid rate id" });
    const deleted = await ServiceRateModel.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: "Rate not found" });
    return res.status(200).json({ success: true, message: "Rate deleted" });
  } catch (error) {
    console.error("deleteServiceRate error:", error);
    return res.status(500).json({ success: false, message: "Could not delete the rate" });
  }
};
