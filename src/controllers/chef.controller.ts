import { Request, Response } from "express";
import Chef from "../models/Chef";
import mongoose from "mongoose";
import bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { sendLoginSuccessEmail } from "../services/email/rentAChef/usersEmailNotifs";
import { sendChefCreationSuccessEmail } from "../services/email/rentAChef/chefsEmailNotification";
import Category from "../models/Category";


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
            categoryName,
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

        // Parse specialties JSON
        let specialtiesArray: string[] = [];
        try {
            specialtiesArray = specialties ? JSON.parse(specialties) : [];
        } catch (err) {
            return res.status(400).json({ message: "Invalid specialties format. Should be an array of strings." });
        }

  //  const categoryName1 = await Category.findById(category).select("name");
        // Create chef
        const chef = await Chef.create({
            staffId,
            name,
            gender,
            email,
            bio,
            specialties: specialtiesArray,
            location,
            state,
            stateId,
            profilePic: chefPic?.location || chefPic?.path || "", // depending on S3 or local
            phoneNumber,
            password: hashedPassword,
            isActive: true,
            isPasswordUpdated: false,
            category,
            categoryName
        });

        try {
          await sendChefCreationSuccessEmail({
          email,
          firstName:name
        })
        } catch (error) {
          console.log(error)
        }
        return res.status(201).json({
            message: "Chef created successfully",
            defaultPassword: pass,
            chef
        });

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
            message: "Login successful",
            token,
            chef: {
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

    if (!chef) {
      res.status(404).json({ success: false, message: "Chef not found" });
      return;
    }

    res.status(200).json({
      success: true,
      payload: chef,
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
    }).populate("category", "name");

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