import { Request, Response } from "express";
import { Booking } from "../models/Booking"; // Path to your Booking model

// Create a new booking
import axios from "axios";
import { isChefAvailable } from "../utils/checkChefAvailability";

export const createBooking = async (req: Request, res: Response): Promise<any> => {
  try {
    const {
      clientId,
      clientNote,
      numberOfPeople,
      chefId,
      serviceId,
      categoryId,
      subCategoryId,
      specialMenuId,
      startDate,
      endDate,
      bookingFeeAmount,
      procurementAmount,
      totalAmount,
      paymentChannel,
      paymentReference
    } = req.body;

    // console.log({
    //   updating:req.body
    // })
    if (!clientId || !startDate || !endDate || !paymentReference) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }



    if (!serviceId && !specialMenuId) {
  return res.status(400).json({
    success: false,
    message: "Either Service ID or Special Menu ID is required"
  });
}

 /* Determine booking type */
    let bookingType: "chef" | "special-menu";
    if (specialMenuId) {
      bookingType = "special-menu";
    } else if (chefId && serviceId) {
      bookingType = "chef";
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid booking payload"
      });
    }


if (bookingType === "chef") {

  const available = await isChefAvailable(
    chefId,
    new Date(startDate),
    new Date(endDate)
  );

  if (!available) {
    return res.status(409).json({
      success: false,
      message: "Chef already booked for this time range"
    });
  }

}
    /* Prevent duplicate booking from same payment */
    const existingPayment = await Booking.findOne({ paymentReference });
    if (existingPayment) {
      return res.status(409).json({
        success: false,
        message: "Booking already created for this payment"
      });
    }

    /* If payment channel is paystack, verify payment */
    if (paymentChannel === "paystack") {
      const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
      if (!PAYSTACK_SECRET_KEY) {
        throw new Error("Paystack secret key not configured");
      }

      const verifyUrl = `https://api.paystack.co/transaction/verify/${paymentReference}`;

      const response = await axios.get(verifyUrl, {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
        }
      });

      if (!response.data || !response.data.data || response.data.data.status !== "success") {
        return res.status(400).json({
          success: false,
          message: "Payment verification failed"
        });
      }
    }

   

    /* Chef availability protection */
    if (bookingType === "chef") {
      const conflict = await Booking.findOne({
        chefId,
        status: { $in: ["confirmed", "ongoing"] },
        startDate: { $lt: new Date(endDate) },
        endDate: { $gt: new Date(startDate) }
      });

      if (conflict) {
        return res.status(409).json({
          success: false,
          message: "Chef already booked for this time range"
        });
      }
    }

    /* Create booking */
    const booking = await Booking.create({
      bookingType,
      clientId,
      clientNote,
      numberOfPeople,
      chefId,
      serviceId,
      categoryId,
      subCategoryId,
      specialMenuId,
      startDate,
      endDate,
      bookingFeePaid: true,
      procurementPaid: false,
      bookingFeeAmount,
      procurementAmount: procurementAmount || 0,
      totalAmount: totalAmount || bookingFeeAmount,
      paymentChannel,
      paymentReference,
      status: "confirmed"
    });

    return res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: booking
    });

  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Chef already booked for this time slot"
      });
    }
console.log({seeError:error})
    return res.status(500).json({
      success: false,
      message: "Failed to create booking",
      error: error.message
    });
  }
};

/**
 * GET ALL BOOKINGS
 * Filters + Pagination
 */
export const getBookings = async (req: Request, res: Response): Promise<any> => {
  try {

    const {
      page = 1,
      limit = 10,
      clientId,
      chefId,
      status,
      startDate,
      endDate,
      paymentReference
    } = req.query;

    const query: any = {};

    if (clientId) query.clientId = clientId;
    if (chefId) query.chefId = chefId;
    if (status) query.status = status;
    if (paymentReference) query.paymentReference = paymentReference;

    /* DATE RANGE FILTER */
    if (startDate || endDate) {
      query.startDate = {};

      if (startDate) query.startDate.$gte = new Date(startDate as string);
      if (endDate) query.startDate.$lte = new Date(endDate as string);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const bookings = await Booking
      .find(query)
      .populate("clientId")
      .populate("chefId")
      .populate("serviceId")
      .populate("specialMenuId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Booking.countDocuments(query);

    return res.json({
      success: true,
      payload: bookings,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit)
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching bookings",
      error
    });
  }
};



/**
 * GET SINGLE BOOKING
 */
export const getBooking = async (req: Request, res: Response): Promise<any> => {
  try {

    const booking = await Booking
      .findById(req.params.id)
      .populate("clientId")
      .populate("chefId")
      .populate("serviceId")
      .populate("specialMenuId");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    return res.json({
      success: true,
      payload: booking
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching booking",
      error
    });
  }
};



/**
 * UPDATE BOOKING
 */
export const updateBooking = async (req: Request, res: Response): Promise<any> => {
  try {

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    return res.json({
      success: true,
      message: "Booking updated successfully",
      payload: booking
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: "Error updating booking",
      error
    });

  }
};



/**
 * DELETE BOOKING
 */
export const deleteBooking = async (req: Request, res: Response): Promise<any> => {
  try {

    const booking = await Booking.findByIdAndDelete(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    return res.json({
      success: true,
      message: "Booking deleted successfully"
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: "Error deleting booking",
      error
    });

  }
};