import { Request, Response } from "express";
import Chef from "../models/Chef";
import mongoose from "mongoose";
import bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { sendLoginSuccessEmail, sendPasswordChangeSuccessEmail, sendUserPasswordResetOTPEmail } from "../services/email/rentAChef/usersEmailNotifs";
import { sendChefCreationSuccessEmail } from "../services/email/rentAChef/chefsEmailNotification";
import Category from "../models/Category";
import { ChefService } from "../models/ChefService";
import { Booking, IBooking } from "../models/Booking";
import { generateOtp } from "../utils/otpUtils";
import { isChefAvailable } from "../utils/checkChefAvailability";


export const createChef = async (req: Request, res: Response): Promise<any> => {
  try {
    const chefPic = req.file as any; // multer file

    const {
      staffId,
      name,
      gender,
      email,
      bio,
      phoneNumber,
      specialties,
      location,
      state,
      stateId,
      defaultPassword,
      category,
      yearsOfExperience,
      rating,
      dob
    } = req.body;

    // console.log({ adminSent: req.body });

    if (!staffId || !name || !email || !location || !state || !category) {
      return res.status(400).json({ message: "staffId, category, location, state, name & email are required" });
    }

    // Check if chef already exists
    const exists = await Chef.findOne({ $or: [{ email }, { staffId }] });
    if (exists) {
      return res.status(400).json({ message: "Chef already exists" });
    }

    // Handle password
    const pass = defaultPassword || "Chef@123";
    const hashedPassword = await bcrypt.hash(pass, 12);

    // // Parse specialties JSON
    // let specialtiesArray: string[] = [];
    // try {
    //     specialtiesArray = specialties ? JSON.parse(specialties) : [];
    // } catch (err) {
    //     return res.status(400).json({ message: "Invalid specialties format. Should be an array of strings." });
    // }

    //  const categoryName1 = await Category.findById(category).select("name");
    // Create chef
    const chef = await Chef.create({
      staffId,
      name,
      gender,
      email,
      bio,
      specialties,
      location,
      state,
      category,
      stateId,
      profilePic: chefPic?.location || chefPic?.path || "", // depending on S3 or local
      phoneNumber,
      dob,
    });

    try {
      await sendChefCreationSuccessEmail({
        email,
        firstName: name
      })
    } catch (error) {
      console.log(error)
    }

    // After creating chef, optionally create ChefService entries if serviceId(s) provided
    try {
      const { serviceId, serviceIds, isAvailable } = req.body as any;
      const ids: string[] = Array.isArray(serviceIds) ? serviceIds : (serviceId ? [serviceId] : []);

      let createdServices: any[] = [];
      let dupCount = 0;

      if (ids.length > 0) {
        const results = await Promise.allSettled(
          ids.map((sid: string) => ChefService.create({ chefId: chef._id, serviceId: sid, isAvailable: isAvailable ?? true }))
        );

        createdServices = results.filter((r: any) => r.status === 'fulfilled').map((r: any) => r.value);
        dupCount = results.filter((r: any) => r.status === 'rejected' && r.reason && r.reason.code === 11000).length;
      }

      return res.status(201).json({
        message: "Chef created successfully",
        defaultPassword: pass,
        chef,
        chefServicesCreated: createdServices,
        chefServicesDuplicatesSkipped: dupCount
      });

    } catch (err) {
      console.warn('Failed to create chef services:', err);
      return res.status(201).json({
        message: "Chef created successfully (services creation failed)",
        defaultPassword: pass,
        chef
      });
    }

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error creating chef", error });
  }
};

export const loginChef = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const chef = await Chef.findOne({ email });

    if (!chef) {
      return res.status(404).json({ message: "Chef not found" });
    }

    const isMatch = await bcrypt.compare(password, chef.password as string);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: chef._id, email: chef.email, staffId: chef.staffId },
      process.env.JWT_SECRET || "your_jwt_secret",
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      payload: {
        id: chef._id,
        staffId: chef.staffId,
        name: chef.name,
        email: chef.email,
        profilePic: chef.profilePic,
        isActive: chef.isActive
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error logging in chef", error });
  }
};

/**
 * REQUEST PASSWORD CHANGE OTP
 */
export const requestChefPasswordChangeOtp = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email } = req.body;

    const chef = await Chef.findOne({ email });
    if (!chef) {
      return res.status(404).json({ message: 'User not found' });
    }

    const otp = generateOtp();

    chef.loginOtp = otp;
    chef.loginOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    await chef.save();

    // await sendEmail(
    //   user.email,
    //   'Password Reset OTP',
    //   `Your password reset OTP is ${otp}. It expires in 10 minutes.`
    // );

    // Send OTP via email
    try {
      await sendUserPasswordResetOTPEmail({
        firstName: chef.name,
        email: chef.email,
        loginOtp: otp,
      });
    } catch (error) {
      console.error("Error sending OTP email:", error);
      // Don't block login flow if email fails, just log it
    }

    return res.status(200).json({
      success: true,
      message: 'Password reset OTP sent to email',
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const changeChefPasswordWithOtp = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, otp, newPassword } = req.body;

    const chef = await Chef.findOne({ email });
    if (!chef || !chef.loginOtp || !chef.loginOtpExpires) {
      return res.status(400).json({ message: 'Invalid request' });
    }

    if (chef.loginOtp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (chef.loginOtpExpires < new Date()) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    chef.password = hashedPassword;

    // clear otp
    chef.loginOtp = undefined;
    chef.loginOtpExpires = undefined;

    await chef.save();

    try {
      await sendPasswordChangeSuccessEmail({
        firstName: chef.name,
        email: chef.name,
      });
    } catch (error) {
      console.log(error)
    }

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};



export const getAllChefs = async (req: Request, res: Response): Promise<any> => {
  try {
    // Pagination
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    // Filters
    const { location, state, isActive, name } = req.query;

    const filter: any = {};

    if (location) {
      filter.location = location;
    }

    if (state) {
      filter.state = state;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    // 🔍 Search by chef name (case-insensitive, partial match)
    if (name) {
      filter.name = { $regex: name, $options: "i" };
    }

    // Query
    const [chefs, total] = await Promise.all([
      Chef.find(filter)
        .populate("category name")
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Chef.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      payload: chefs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching chefs",
      payload: error,
    });
  }
};



// ✅ Get one chef
export const getChefById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid ID" });
      return;
    }

    const chef = await Chef.findById(id)
      .select("-password") // ✅ exclude password
      .populate('category', 'name')

    if (!chef) {
      res.status(404).json({ success: false, message: "Chef not found" });
      return;
    }

    // compute booking counts
    const now = new Date();
    const [totalChefBooking, totalCompletedBooking, totalUpcoming] = await Promise.all([
      Booking.countDocuments({ chefId: id }),
      Booking.countDocuments({ chefId: id, status: 'completed' }),
      Booking.countDocuments({ chefId: id, status: { $in: ['confirmed', 'ongoing'] }, startDate: { $gte: now } }),
    ]);

    // fetch recent menus for this chef (last 3)
    const { Menu } = await import('../models/Menu');
    const getTheChefMenu = await Menu.find({ chefId: id }).sort({ createdAt: -1 }).limit(3).lean();

    // fetch services offered via ChefService
    const { ChefService } = await import('../models/ChefService');
    const services = await ChefService.find({ chefId: id, isAvailable: true }).populate('serviceId', 'name').lean();
    const servicesOffered = services.map((s: any) => ({ id: s.serviceId?._id || s.serviceId, name: s.serviceId?.name || s.serviceId }));

    res.status(200).json({
      success: true,
      payload: {
        chef,
        totalChefBooking,
        totalCompletedBooking,
        totalUpcoming,
        getTheChefMenu,
        servicesOffered,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching chef",
      error,
    });
  }
};



// ✅ Update Chef (Admin OR Chef owner)
export const updateChef = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    // ✅ Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid chef ID" });
    }

    /**
     * ✅ Whitelisted fields
     * Prevent updating sensitive fields like password, isActive, staffId, etc.
     */
    const allowedUpdates = [
      "name",
      "gender",
      "email",
      "bio",
      "specialties",
      "category",
      "phoneNumber",
      "location",
      "state",
      "stateId",
      "staffId",
      "profilePic",
      "dob",
      "yearsOfExperience",
      "password",
      "rating"
    ];

    const updates: Record<string, any> = {};

    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    // ✅ If category is updated, also update categoryName
    if (updates.category) {
      if (!mongoose.Types.ObjectId.isValid(updates.category)) {
        return res.status(400).json({ success: false, message: "Invalid category ID" });
      }

      const category = await Category.findById(updates.category).select("name");

      if (!category) {
        return res.status(404).json({ success: false, message: "Category not found" });
      }

      updates.categoryName = category.name;
    }

    const chef = await Chef.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).populate("category", "name").select("-password");

    if (!chef) {
      return res.status(404).json({ success: false, message: "Chef not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Chef updated successfully",
      payload: chef,
    });

  } catch (error: any) {
    console.error("Update Chef Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating chef",
      error: error.message,
    });
  }
};



// ✅ Disable Chef (ADMIN only)
export const disableChef = async (req: Request, res: Response): Promise<any> => {
  try {
    const chef = await Chef.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!chef) {
      return res.status(404).json({ message: "Chef not found" });
    }

    res.status(200).json({
      message: "Chef has been disabled",
      chef
    });

  } catch (error) {
    res.status(500).json({ message: "Error disabling chef", error });
  }
};



// ✅ Delete Chef (ADMIN only)
export const deleteChef = async (req: Request, res: Response): Promise<any> => {
  try {
    const chef = await Chef.findByIdAndDelete(req.params.id);

    if (!chef) {
      return res.status(404).json({ message: "Chef not found" });
    }

    res.status(200).json({
      message: "Chef deleted permanently",
    });

  } catch (error) {
    res.status(500).json({ message: "Error deleting chef", error });
  }
};

// Controller function to check chef availability
export const checkChefAvailability = async (req: Request, res: Response): Promise<any> => {
  try {

    const { chefId, startDate, endDate } = req.body;

    if (!chefId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "chefId, startDate and endDate are required"
      });
    }

    const available = await isChefAvailable(
      chefId,
      new Date(startDate),
      new Date(endDate)
    );

    if (!available) {
      return res.status(409).json({
        success: false,
        message: "Chef is not available for the selected dates"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Chef is available"
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: "Server error",
      error
    });

  }
};