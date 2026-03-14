import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import * as crypto from "crypto";
import UserModel from "../../models/User.model";


export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    const pageNum = Math.max(parseInt(page as string, 10), 1);
    const limitNum = Math.max(parseInt(limit as string, 10), 1);
    const skip = (pageNum - 1) * limitNum;

    const query: any = {};

    if (search && typeof search === "string") {
      const regex = new RegExp(search.trim(), "i");

      query.$or = [
        { "profile.fullName": regex },
        { "profile.firstName": regex },
        { "profile.lastName": regex },
        { "contact.email": regex },
        { "contact.phoneNumber": regex },
      ];
    }

    const [total, users] = await Promise.all([
      UserModel.countDocuments(query),
      UserModel.find(query)
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 }),
    ]);

    res.status(200).json({
      message: "Users retrieved successfully",
      meta: {
        total,
        page: pageNum,
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
      success: true,
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

export const getUserDashboard = async (req: Request, res: Response): Promise<void> => {
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


// Update Profile Picture
export const updateProfilePic = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params; // Assuming userId is passed in the URL
  const profilePic = req.file as any; // multer file

  if (!profilePic) {
    return res.status(400).json({ message: 'Profile picture is required' });
  }

  try {
    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      { profilePic: profilePic?.location || profilePic?.path || "", },
      { new: true, runValidators: true }
    );

    console.log({ seeRecord: { id, pic: profilePic?.location, path: profilePic?.path } })

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({success:true, message: 'Profile picture updated successfully', updatedUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Complete KYC (Know Your Customer)
export const completeKyc = async (req: Request, res: Response): Promise<any> => {
  const idPic = req.file as any; // multer file
  const { userId } = req.params; // Assuming userId is passed in the URL
  const { idType, idNumber } = req.body;

  if (!idType || !idNumber || !idPic) {
    return res.status(400).json({ message: 'All KYC fields are required' });
  }

  try {
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      {
        kyc: { idType, idNumber, idPicture: idPic?.location || idPic?.path || "", },
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ success: true, message: 'KYC completed successfully', updatedUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Update Health Information
export const updateHealthInformation = async (req: Request, res: Response): Promise<any> => {
  const { userId } = req.params; // Assuming userId is passed in the URL
  const { allergies, healthDetails } = req.body;

  if (!allergies && !healthDetails) {
    return res.status(400).json({ message: 'Health information is required' });
  }

  try {
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      {
        healthInformation: { allergies, healthDetails },
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({success:true, message: 'Health information updated successfully', updatedUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Update Next of Kin (NOK)
export const updateNok = async (req: Request, res: Response): Promise<any> => {
  const { userId } = req.params; // Assuming userId is passed in the URL
  const { fullName, phone, relationship } = req.body;

  if (!fullName || !phone || !relationship) {
    return res.status(400).json({ message: 'All NOK fields are required' });
  }

  try {
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      {
        nok: { fullName, phone, relationship },
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({success:false, message: 'User not found' });
    }

    return res.status(200).json({success:true, message: 'Next of kin updated successfully', updatedUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Update Location
export const updateLocation = async (req: Request, res: Response): Promise<any> => {
  const { userId } = req.params; // Assuming userId is passed in the URL
  const { home, office, state, city, long, lat } = req.body;

  if (!home && !office && !state && !city && !long && !lat) {
    return res.status(400).json({ message: 'One of the address is required' });
  }

  try {
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      {
        location: { home, office, state, city, long, lat },
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({ success: true, message: 'Location updated successfully', updatedUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Update Bio Data (Full name, Marital status, etc.)
export const updateBioData = async (req: Request, res: Response): Promise<any> => {
  const { userId } = req.params; // Assuming userId is passed in the URL
  const { fullName, dob, maritalStatus, gender,phoneNumber } = req.body;

  if (!fullName && !maritalStatus && !dob) {
    return res.status(400).json({ message: 'At least one field should be provided to update' });
  }

  try {
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      {
        fullName,
        gender,
        dob,
        maritalStatus,
        phone:phoneNumber
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ success: true, message: 'Bio data updated successfully', updatedUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};