import { Request, Response } from "express";
import Chef from "../models/Chef";
import mongoose from "mongoose";
import bcrypt from 'bcryptjs';

// ✅ Create Chef (ADMIN only)
export const createChef = async (req: Request, res: Response): Promise<any> => {
    try {
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
            defaultPassword
        } = req.body;

        if (!staffId || !name || !email || !location|| !state) {
            return res.status(400).json({ message: "staffId, location,state, phone number, name & email are required" });
        }

        const exists = await Chef.findOne({
            $or: [{ email }, { staffId }]
        });

        if (exists) {
            return res.status(400).json({ message: "Chef already exists" });
        }

        // If admin didn't specify password, generate one
        const pass = defaultPassword || "Chef@123";

        const hashedPassword = await bcrypt.hash(pass, 12);

        const chef = await Chef.create({
            staffId,
            name,
            gender,
            email,
            bio,
            specialties,
            location,
            state,
            stateId,
            phoneNumber,
            password: hashedPassword,
            isActive: true,
            isPasswordUpdated: false
        });

       return res.status(201).json({
            message: "Chef created successfully",
            defaultPassword: pass, // Send to admin to give the chef
            chef
        });

    } catch (error) {
       return res.status(500).json({ message: "Error creating chef", error });
    }
};


// ✅ Get all chefs (ANY authenticated user)
export const getAllChefs = async (req: Request, res: Response): Promise<any> => {
    try {
        const chefs = await Chef.find().select('-password')
            // .populate("menus")
            // .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, payload: chefs });

    } catch (error) {
        return res.status(500).json({success:false, message: "Error fetching chefs", payload:error });
    }
};



// ✅ Get one chef
export const getChefById = async (req: Request, res: Response): Promise<any> => {
    try {

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid ID" });
        }

        const chef = await Chef.findById(req.params.id)
        // .populate("menus");

        if (!chef) {
            return res.status(404).json({ message: "Chef not found" });
        }

        res.status(200).json({ chef });

    } catch (error) {
        res.status(500).json({ message: "Error fetching chef", error });
    }
};



// ✅ Update Chef (Admin OR Chef owner)
export const updateChef = async (req: Request, res: Response): Promise<any> => {
    try {
        const updates = req.body;

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid ID" });
        }

        const chef = await Chef.findByIdAndUpdate(req.params.id, updates, { new: true });

        if (!chef) {
            return res.status(404).json({ message: "Chef not found" });
        }

        res.status(200).json({
            message: "Chef updated successfully",
            chef,
        });

    } catch (error) {
        res.status(500).json({ message: "Error updating chef", error });
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