import { Request, Response } from "express";
import { Booking } from "../models/Booking";

/* ---------------- CREATE BOOKING ---------------- */
export const createBooking = async (req: Request, res: Response) => {
  try {
    const booking = await Booking.create(req.body);

    res.status(201).json({
      success: true,
      data: booking,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* ---------------- GET ALL BOOKINGS ---------------- */
export const getAllBookings = async (req: Request, res: Response) => {
  try {
    const bookings = await Booking.find()
      .populate("clientId", "name email")
      .populate("chefId", "name")
      .populate("categoryId", "title")
      .populate("subCategoryId", "title")
      .populate("specialMenuId", "title")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ---------------- GET SINGLE BOOKING ---------------- */
export const getBookingById = async (req: Request, res: Response):Promise<any> => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("clientId", "name email")
      .populate("chefId", "name")
      .populate("categoryId", "title")
      .populate("subCategoryId", "title")
      .populate("specialMenuId", "title");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* ---------------- UPDATE BOOKING ---------------- */
export const updateBooking = async (req: Request, res: Response):Promise<any> => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* ---------------- DELETE BOOKING ---------------- */
export const deleteBooking = async (req: Request, res: Response):Promise<any> => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Booking deleted successfully",
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
