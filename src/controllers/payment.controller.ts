import { Request, Response } from "express";
import { Booking } from "../models/Booking"; // Path to your Booking model
import axios from "axios";

// Create a new booking
export const initializePayment = async (req: Request, res: Response): Promise<any> => {
  const { email, amount,callback_url } = req.body;

  try {
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: amount * 100, // Paystack uses kobo
        callback_url
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json(response.data);
  } catch (error: any) {
    res.status(500).json({ error: error.response?.data });
  }
};

export const verifyPayment = async (req:Request, res:Response): Promise<any> => {
  const { reference } = req.params;

  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      }
    );

    res.json(response.data);

  } catch (error) {
    res.status(500).json({ error: "Verification failed" });
  }
};

// Get all bookings
export const getBookings = async (req: Request, res: Response) => {
  try {
    const bookings = await Booking.find().populate("clientId chefId serviceId categoryId subCategoryId specialMenuId");
    return res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch bookings",
      error: error.message,
    });
  }
};

// Get a single booking by ID
export const getBookingById = async (req: Request, res: Response) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("clientId chefId serviceId categoryId subCategoryId specialMenuId");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch booking",
      error: error.message,
    });
  }
};

// Update a booking by ID
export const updateBooking = async (req: Request, res: Response) => {
  try {
    const {
      clientId,
      chefId,
      serviceId,
      categoryId,
      subCategoryId,
      specialMenuId,
      dates,
      bookingFeePaid,
      procurementPaid,
      bookingFeeAmount,
      procurementAmount,
      totalAmount,
      status,
      cancellationReason,
    } = req.body;

    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      {
        clientId,
        chefId,
        serviceId,
        categoryId,
        subCategoryId,
        specialMenuId,
        dates,
        bookingFeePaid,
        procurementPaid,
        bookingFeeAmount,
        procurementAmount,
        totalAmount,
        status,
        cancellationReason,
      },
      { new: true }
    ).populate("clientId chefId serviceId categoryId subCategoryId specialMenuId");

    if (!updatedBooking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Booking updated successfully",
      data: updatedBooking,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Failed to update booking",
      error: error.message,
    });
  }
};

// Delete a booking by ID
export const deleteBooking = async (req: Request, res: Response) => {
  try {
    const deletedBooking = await Booking.findByIdAndDelete(req.params.id);

    if (!deletedBooking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Booking deleted successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete booking",
      error: error.message,
    });
  }
};