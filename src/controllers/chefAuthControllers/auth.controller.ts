import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
// import User from '../models/User';
import UserModel from '../../models/User.model';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateOtp } from '../../utils/otpUtils';
import { sendUserPasswordResetOtpEmail } from '../../services/email/ogasela/userLoginOtpEmailNotifs';
import { sendEmailVerificationOtp, sendLoginOtpEmail } from '../../services/email/rentAChef/usersEmailNotifs';
import Chef from '../../models/Chef';


export const register = async (req: Request, res: Response): Promise<any> => {

  const { email, password, fullName, phoneNumber } = req.body;

  if (!email || !password || !fullName || !phoneNumber) {
    return res.status(401).json({ success: false, message: 'incomplete details' });
  }
  const formatedEmail = email.trim().toLowerCase()
  try {
    const existing = await UserModel.findOne({ formatedEmail });
    if (existing) {return res.status(400).json({success:false, message: 'A user with this email already exist.' });}

    let firstName = fullName.split(' ')[0]
    const hashed = await bcrypt.hash(password, 10);
    const isAdmin = req.body.adminSecret === process.env.ADMIN_SECRET;
    const emailVerificationOtp = generateOtp()
    const user = await UserModel.create({ email: formatedEmail, phone: phoneNumber, emailVerificationOtp, password: hashed, fullName,firstName, isAdmin });

    console.log({ seeEmailVerOtp: emailVerificationOtp })
    //  await  sendEmailVerificationOtp({
    //       firstName,
    //       email:formatedEmail,
    //       emailVerificationOtp,
    //   })
    // const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    return res.status(201).json({ success: true, payload: { id: user._id, email: user.email, fullName: user.fullName, isAdmin: user.isAdmin } });

  } catch (error:any) {
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};


export const verifyEmail = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, otp } = req.body;

    // Validate input
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required.",
      });
    }

    // Find the customer
    const customer = await UserModel.findOne({ email: email.toLowerCase() });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    // Check if already verified
    if (customer.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email already verified.",
      });
    }

    // Check if OTP matches
    if (customer.emailVerificationOtp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP.",
      });
    }

    // Update verification status
    customer.isEmailVerified = true;
    customer.emailVerificationOtp = "";
    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Email verified successfully.",
    });
  } catch (error: any) {
    console.error("Error verifying email:", error);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};



export const login = async (req: Request, res: Response): Promise<any> => {
  console.log('see me')
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // ✅ Fix: Query should use `email`, not `{ normalizedEmail }`
    const user = await UserModel.findOne({ email: normalizedEmail });

    // Prevent timing attacks: always run bcrypt.compare
    const dummyHash = "$2b$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
    const isPasswordMatch = await bcrypt.compare(password, user?.password || dummyHash);

    if (!user || !isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials.",
      });
    }

    // Optional: ensure user has verified their email before logging in
    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in.",
      });
    }

    // Generate OTP and expiry (10 minutes)
    const otp = generateOtp(); // e.g. 6-digit random string
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.loginOtp = otp;
    user.loginOtpExpires = otpExpires;
    await user.save();

    console.log({ seeOtp: otp })

    // Send OTP via email
    // try {
    //   await sendLoginOtpEmail({
    //     firstName: user.firstName,
    //     email: user.email,
    //     loginOtp: otp,
    //   });
    // } catch (error) {
    //   console.error("Error sending OTP email:", error);
    //   // Don't block login flow if email fails, just log it
    // }

    return res.status(200).json({
      success: true,
      message: "OTP sent to email.",
      payload: {
        email: user.email,
        expiresAt: otpExpires,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

export const verifyLoginOtp = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, otp } = req.body;

    // Check for missing fields
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required.",
      });
    }

    // Find the customer
    const customer = await UserModel.findOne({ email: email.trim().toLowerCase() });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    // Ensure OTP exists
    if (!customer.loginOtp || !customer.loginOtpExpires) {
      return res.status(400).json({
        success: false,
        message: "No OTP found for this account. Please request a new one.",
      });
    }

    // Check OTP expiration
    if (customer.loginOtpExpires < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    // Validate OTP
    if (customer.loginOtp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP.",
      });
    }

    // OTP is valid — clear it
    customer.loginOtp = "";
    customer.loginOtpExpires = new Date(0);
    await customer.save();

    // Optionally generate a JWT token
    const token = jwt.sign(
      { id: customer._id, email: customer.email, isAdmin: customer.isAdmin },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      message: "Login OTP verified successfully.",
      token,
      payload: {
        id: customer.id,
        email: customer.email,
        fullName: customer.fullName,
        isAdmin: customer.isAdmin,
      },
    });
  } catch (error: any) {
    console.error("Error verifying login OTP:", error);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

export const chefLogin = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;

    // 1. Validate input
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // 2. Find chef by email
    const chef = await Chef.findOne({ email });

    if (!chef) {
      return res.status(404).json({
        message: "Chef not found",
      });
    }

    // 3. Check if chef is active
    if (!chef.isActive) {
      return res.status(403).json({
        message: "Your account has been disabled. Contact admin.",
      });
    }

    // 4. Check if password exists
    if (!chef.password) {
      return res.status(403).json({
        message: "Password not set. Contact admin.",
      });
    }

    // 5. Compare passwords
    const isMatch = await bcrypt.compare(password, chef.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid login credentials",
      });
    }

    // 6. Generate JWT
    const token = jwt.sign(
      {
        id: chef._id,
        role: "chef",
        email: chef.email,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    // 7. Send response
    res.status(200).json({
      message: "Login successful",
      token,
      chef: {
        id: chef._id,
        staffId: chef.staffId,
        name: chef.name,
        email: chef.email,
        isPasswordUpdated: chef.isPasswordUpdated,
      },
    });

  } catch (error) {
    console.error("Chef Login Error:", error);

    res.status(500).json({
      message: "Unable to login at the moment",
    });
  }
};

export const me = async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  res.json({ user });
};