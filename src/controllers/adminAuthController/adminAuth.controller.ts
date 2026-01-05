import { Request, Response } from "express";
import Admin from "../../models/Admin";
import { generateToken } from "../../utils/generateToken";
import Booking from "../../models/Booking";
import Chef from "../../models/Chef";
import UserModel from "../../models/User.model";
import Category from "../../models/Category";

export const adminLogin = async (req: Request, res: Response):Promise<any> => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin)
      return res.status(401).json({success:false, message: "Invalid credentials" });

    if (!admin.isActive)
      return res.status(403).json({success:false, message: "Admin account disabled" });

    const isMatch = await admin.comparePassword(password);
    if (!isMatch)
      return res.status(401).json({success:false, message: "Invalid credentials" });

    const token = generateToken({
      id: admin._id,
      role: admin.role
    });

    const categories = await Category.find()
  .select('_id name') // only fetch what you need
  .lean();

const formattedCategories = categories.map(cat => ({
  label: cat.name,
  value: cat._id,
}));
    res.status(200).json({
      success:true,
      message: "Login successful",
      token,
      payload: {
        id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role,
        formattedCategories,
      }
    });
  } catch (error) {
    res.status(500).json({ success:false,message: "Server error",error: error });
  }
};

export const createAdmin = async (req: Request, res: Response):Promise<any> => {
  try {
    const { fullName, email, password, role } = req.body;

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin)
      return res.status(400).json({ message: "Admin already exists" });

    const admin = await Admin.create({
      fullName,
      email,
      password,
      role: role || "admin"
    });

    res.status(201).json({
      message: "Admin created successfully",
      admin: {
        id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create admin", error });
  }
};


export const getAdmins = async (req: Request, res: Response):Promise<any> => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const [admins, total] = await Promise.all([
      Admin.find()
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Admin.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      data: admins,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch admins",
      error,
    });
  }
};

export const getAdminById = async (req: Request, res: Response):Promise<any>  => {
  try {
    const admin = await Admin.findById(req.params.id).select("-password");

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: admin,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin",
      error,
    });
  }
};

export const getAdminDashboard = async (req: Request, res: Response):Promise<any>  => {
  
  try {
    const bookings = await Booking.find();
    const chefs = await Chef.find();
    const customers = await UserModel.find();
    const grouped: Record<string, number> = {};
    bookings.forEach((booking) => {
      const day = booking.createdAt.toLocaleDateString('en-US', {
        weekday: 'short',
      });

      grouped[day] = (grouped[day] || 0) + 1;
    });
    const chartData = Object.entries(grouped).map(
      ([day, count]) => ({
        name: day,     // 👈 xKey
        users: count,  // 👈 dataKey
      })
    );
    // const admin = await Admin.findById(req.params.id).select("-password");

    // if (!admin) {
    //   return res.status(404).json({
    //     success: false,
    //     message: "Admin not found",
    //   });
    // }

    return res.status(200).json({
      success: true,
      payload: {
        cardData:{
          revenue:500000,
        customers:customers.length,
        chefs:chefs.length
        },
        bookings: chartData
          
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin",
      error,
    });
  }
};

/**
 * =====================
 * UPDATE ADMIN
 * =====================
 */
export const updateAdmin = async (req: Request, res: Response):Promise<any>  => {
  try {
    const { fullName, email, role, isActive, password } = req.body;

    const admin = await Admin.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    if (fullName !== undefined) admin.fullName = fullName;
    if (email !== undefined) admin.email = email;
    if (role !== undefined) admin.role = role;
    if (isActive !== undefined) admin.isActive = isActive;

    // Allow password update (will be hashed by pre-save hook)
    if (password) {
      admin.password = password;
    }

    await admin.save();

    const updatedAdmin = admin.toJSON();
    // delete updatedAdmin.password;

    return res.status(200).json({
      success: true,
      message: "Admin updated successfully",
      data: updatedAdmin,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update admin",
      error,
    });
  }
};

/**
 * =====================
 * DELETE ADMIN
 * =====================
 */
export const deleteAdmin = async (req: Request, res: Response):Promise<any>  => {
  try {
    const admin = await Admin.findByIdAndDelete(req.params.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Admin deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete admin",
      error,
    });
  }
};