import { Request, Response } from "express";
import { Types } from "mongoose";
import { FeeModel, FeeType } from "../../models/Fee";
import { ServiceModel } from "../../models/Service";

const FEE_TYPES: FeeType[] = ["fixed", "percentage"];

type FeeFields = {
  name?: string;
  description?: string;
  type?: FeeType;
  value?: number;
  isActive?: boolean;
  serviceIds?: Types.ObjectId[];
};

/**
 * Validates the editable fields. With `partial`, missing fields are skipped (for
 * updates); `currentType` lets an update check a new value against the saved type.
 */
const parseFeeBody = (
  body: any,
  partial: boolean,
  currentType?: FeeType
): { fields: FeeFields } | { error: string } => {
  const fields: FeeFields = {};

  if (body.name !== undefined || !partial) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return { error: "name is required" };
    if (name.length > 120) return { error: "name must be 120 characters or fewer" };
    fields.name = name;
  }

  if (body.description !== undefined) {
    fields.description = typeof body.description === "string" ? body.description.trim() : "";
  }

  if (body.type !== undefined || !partial) {
    if (!FEE_TYPES.includes(body.type)) return { error: "type must be fixed or percentage" };
    fields.type = body.type;
  }

  if (body.value !== undefined || !partial) {
    const value = Number(body.value);
    if (body.value === "" || body.value === null || !Number.isFinite(value) || value < 0) {
      return { error: "value must be a number of zero or more" };
    }
    fields.value = value;
  }

  const type = fields.type ?? currentType;
  const value = fields.value;
  if (type === "percentage" && value !== undefined && value > 100) {
    return { error: "A percentage fee cannot be more than 100" };
  }

  if (body.isActive !== undefined) {
    if (typeof body.isActive !== "boolean") return { error: "isActive must be true or false" };
    fields.isActive = body.isActive;
  }

  if (body.serviceIds !== undefined || !partial) {
    const ids: unknown[] = Array.isArray(body.serviceIds) ? body.serviceIds : [];
    const unique = [...new Set(ids.map(String))];
    if (unique.length === 0) return { error: "Select at least one service this fee applies to" };
    if (!unique.every((id) => Types.ObjectId.isValid(id))) return { error: "Invalid service id" };
    fields.serviceIds = unique.map((id) => new Types.ObjectId(id));
  }

  return { fields };
};

/** Every selected service must exist. */
const findMissingService = async (serviceIds?: Types.ObjectId[]): Promise<boolean> => {
  if (!serviceIds?.length) return false;
  const found = await ServiceModel.countDocuments({ _id: { $in: serviceIds } });
  return found !== serviceIds.length;
};

const SERVICE_FIELDS = "name";

// GET /fees?serviceId= → every fee (or those for one service), newest first
export const listFees = async (req: Request, res: Response): Promise<any> => {
  try {
    const filter: Record<string, unknown> = {};
    const serviceId = typeof req.query.serviceId === "string" ? req.query.serviceId : "";
    if (serviceId) {
      if (!Types.ObjectId.isValid(serviceId)) return res.status(400).json({ success: false, message: "Invalid serviceId" });
      filter.serviceIds = serviceId;
    }
    const fees = await FeeModel.find(filter).sort({ createdAt: -1 }).populate("serviceIds", SERVICE_FIELDS);
    return res.status(200).json({ success: true, payload: fees });
  } catch (error) {
    console.error("listFees error:", error);
    return res.status(500).json({ success: false, message: "Could not load fees" });
  }
};

// POST /fees { name, description?, type, value, isActive?, serviceIds }
export const createFee = async (req: Request, res: Response): Promise<any> => {
  try {
    const parsed = parseFeeBody(req.body ?? {}, false);
    if ("error" in parsed) return res.status(400).json({ success: false, message: parsed.error });

    if (await findMissingService(parsed.fields.serviceIds)) {
      return res.status(404).json({ success: false, message: "One or more selected services no longer exist" });
    }

    const fee = await FeeModel.create(parsed.fields);
    await fee.populate("serviceIds", SERVICE_FIELDS);
    return res.status(201).json({ success: true, payload: fee });
  } catch (error) {
    console.error("createFee error:", error);
    return res.status(500).json({ success: false, message: "Could not create the fee" });
  }
};

// PUT /fees/:id — any of the fields above
export const updateFee = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid fee id" });

    const fee = await FeeModel.findById(id);
    if (!fee) return res.status(404).json({ success: false, message: "Fee not found" });

    const parsed = parseFeeBody(req.body ?? {}, true, fee.type);
    if ("error" in parsed) return res.status(400).json({ success: false, message: parsed.error });

    // Switching an existing fee to percentage must not leave a value above 100.
    if (parsed.fields.type === "percentage" && parsed.fields.value === undefined && fee.value > 100) {
      return res.status(400).json({ success: false, message: "A percentage fee cannot be more than 100" });
    }

    if (await findMissingService(parsed.fields.serviceIds)) {
      return res.status(404).json({ success: false, message: "One or more selected services no longer exist" });
    }

    fee.set(parsed.fields);
    await fee.save();
    await fee.populate("serviceIds", SERVICE_FIELDS);
    return res.status(200).json({ success: true, payload: fee });
  } catch (error) {
    console.error("updateFee error:", error);
    return res.status(500).json({ success: false, message: "Could not update the fee" });
  }
};

// DELETE /fees/:id
export const deleteFee = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid fee id" });

    const deleted = await FeeModel.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: "Fee not found" });
    return res.status(200).json({ success: true, message: "Fee deleted" });
  } catch (error) {
    console.error("deleteFee error:", error);
    return res.status(500).json({ success: false, message: "Could not delete the fee" });
  }
};

// GET /fees/service/:serviceId → active fees charged on that service (public: shown at checkout)
export const listServiceFees = async (req: Request, res: Response): Promise<any> => {
  try {
    const { serviceId } = req.params;
    if (!Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({ success: false, message: "Invalid serviceId" });
    }
    const fees = await FeeModel.find({ serviceIds: serviceId, isActive: true })
      .select("name description type value")
      .sort({ createdAt: 1 });
    return res.status(200).json({ success: true, payload: fees });
  } catch (error) {
    console.error("listServiceFees error:", error);
    return res.status(500).json({ success: false, message: "Could not load fees" });
  }
};
