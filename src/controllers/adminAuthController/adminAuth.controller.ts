import { Request, Response } from "express";
import Admin from "../../models/Admin";
import { generateToken } from "../../utils/generateToken";

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

    res.status(200).json({
      success:true,
      message: "Login successful",
      token,
      payload: {
        id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role
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