import { Request, Response } from "express";

/**
 * POST /bookings/menu-upload (multipart, field "menuPdf") — stores the customer's
 * menu PDF and returns its link, which the app then sends with the booking.
 */
export const uploadCustomerMenu = async (req: Request, res: Response): Promise<any> => {
  const file = req.file as any;
  if (!file) return res.status(400).json({ success: false, message: "Choose a PDF of your menu to upload." });
  return res.status(201).json({
    success: true,
    payload: {
      url: file.location || file.path,
      name: file.originalname,
      sizeBytes: file.size,
    },
  });
};
