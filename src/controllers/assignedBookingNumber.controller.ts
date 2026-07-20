import { Request, Response } from "express";
import mongoose from "mongoose";
import { AssignedBookingNumberModel } from "../models/AssignedBookingNumber";

const isValidObjectId = (id: string): boolean => mongoose.Types.ObjectId.isValid(id);

const buildValidationError = (message: string, res: Response): Response => {
  return res.status(400).json({
    success: false,
    message,
  });
};

export const createAssignedBookingNumber = async (req: Request, res: Response): Promise<any> => {
  try {
    const { serviceId, customerId, bookingId } = req.body;

    if (!serviceId || !customerId) {
      return buildValidationError("serviceId and customerId are required", res);
    }

    if (!isValidObjectId(String(serviceId)) || !isValidObjectId(String(customerId))) {
      return buildValidationError("Invalid serviceId or customerId", res);
    }

    if (bookingId && !isValidObjectId(String(bookingId))) {
      return buildValidationError("Invalid bookingId", res);
    }

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const lastAssigned = await AssignedBookingNumberModel
        .findOne({ serviceId })
        .sort({ assignedNumber: -1 })
        .select("assignedNumber")
        .lean();

      const nextNumber = (lastAssigned?.assignedNumber || 0) + 1;

      try {
        const assigned = await AssignedBookingNumberModel.create({
          assignedNumber: nextNumber,
          serviceId,
          customerId,
          bookingId: bookingId || undefined,
        });

        return res.status(201).json({
          success: true,
          data: assigned,
        });
      } catch (createError: any) {
        if (createError?.code === 11000 && attempt < 2) {
          continue;
        }
        throw createError;
      }
    }

    return res.status(500).json({
      success: false,
      message: "Unable to assign booking number. Please retry.",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error creating assigned booking number",
      error: error?.message,
    });
  }
};

export const getAssignedBookingNumbers = async (req: Request, res: Response): Promise<any> => {
  try {
    const { serviceId, customerId, bookingId, page = "1", limit = "10" } = req.query;
    const query: any = {};

    if (serviceId) {
      if (!isValidObjectId(String(serviceId))) {
        return buildValidationError("Invalid serviceId", res);
      }
      query.serviceId = serviceId;
    }

    if (customerId) {
      if (!isValidObjectId(String(customerId))) {
        return buildValidationError("Invalid customerId", res);
      }
      query.customerId = customerId;
    }

    if (bookingId) {
      if (!isValidObjectId(String(bookingId))) {
        return buildValidationError("Invalid bookingId", res);
      }
      query.bookingId = bookingId;
    }

    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.max(Number(limit) || 10, 1);
    const skip = (pageNumber - 1) * limitNumber;

    const [data, total] = await Promise.all([
      AssignedBookingNumberModel.find(query)
        .sort({ serviceId: 1, assignedNumber: -1 })
        .skip(skip)
        .limit(limitNumber),
      AssignedBookingNumberModel.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      count: data.length,
      total,
      page: pageNumber,
      totalPages: Math.ceil(total / limitNumber),
      limit: limitNumber,
      data,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error fetching assigned booking numbers",
      error: error?.message,
    });
  }
};

export const getAssignedBookingNumber = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return buildValidationError("Invalid assigned booking number id", res);
    }

    const data = await AssignedBookingNumberModel.findById(id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Assigned booking number not found",
      });
    }

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error fetching assigned booking number",
      error: error?.message,
    });
  }
};

export const updateAssignedBookingNumber = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { serviceId, customerId, bookingId } = req.body;

    if (!isValidObjectId(id)) {
      return buildValidationError("Invalid assigned booking number id", res);
    }

    const record = await AssignedBookingNumberModel.findById(id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Assigned booking number not found",
      });
    }

    if (serviceId != null) {
      if (!isValidObjectId(String(serviceId))) {
        return buildValidationError("Invalid serviceId", res);
      }
      record.serviceId = serviceId;
    }

    if (customerId != null) {
      if (!isValidObjectId(String(customerId))) {
        return buildValidationError("Invalid customerId", res);
      }
      record.customerId = customerId;
    }

    if (bookingId !== undefined) {
      if (bookingId !== null && String(bookingId).trim() !== "" && !isValidObjectId(String(bookingId))) {
        return buildValidationError("Invalid bookingId", res);
      }
      record.bookingId = bookingId ? new mongoose.Types.ObjectId(String(bookingId)) : undefined;
    }

    await record.save();

    return res.status(200).json({
      success: true,
      message: "Assigned booking number updated successfully",
      data: record,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error updating assigned booking number",
      error: error?.message,
    });
  }
};

export const deleteAssignedBookingNumber = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return buildValidationError("Invalid assigned booking number id", res);
    }

    const deleted = await AssignedBookingNumberModel.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Assigned booking number not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Assigned booking number deleted successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error deleting assigned booking number",
      error: error?.message,
    });
  }
};
