import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import * as crypto from "crypto";
import UserModel from "../../models/User.model";


// Get all users (with pagination & search)
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const { page = 1, limit = 10, search } = req.query;

        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);
        const skip = (pageNum - 1) * limitNum;

        const query: any = {};

        // Search by full name or email (case-insensitive)
        if (search) {
            query.$or = [
                { "profile.fullName": { $regex: search, $options: "i" } },
                { "contact.email": { $regex: search, $options: "i" } },
            ];
        }

        const total = await UserModel.countDocuments(query);
        const users = await UserModel.find(query)
            .skip(skip)
            .limit(limitNum)
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Users retrieved successfully",
            pagination: {
                total,
                currentPage: pageNum,
                totalPages: Math.ceil(total / limitNum),
                limit: limitNum,
            },
            data: users,
        });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching users",
            error,
        });
    }
};

// Get single user by ID
export const getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({ message: "Invalid user ID" });
            return;
        }

       
        const user = await UserModel.findById(id).select("-profile.password");
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        res.status(200).json({
            message: "User retrieved successfully",
            payload: user,
        });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching user",
            error,
        });
    }
};