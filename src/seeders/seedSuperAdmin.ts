import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.model";
import { generateEmailVerificationOtp } from "../services/auth/auth.service";
import { sendWelcomeEmail } from "../services/email/rentAChef/usersEmailNotifs";

dotenv.config();

const seedAdmin = async () => {
  const fullName = process.env.SUPER_ADMIN_NAME;
  const firstName = fullName?.split(" ")[0];
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  console.log({email:email,pass:password})

  if (!fullName || !email || !password) {
    throw new Error(
      "Missing SUPER_ADMIN_NAME, SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD in environment variables"
    );
  }

  await mongoose.connect(process.env.MONGO_URI as string);

  let admin = await User.findOne({
    email,
    userType: "Admin"
  });

  if (!admin) {
    admin = await User.create({
      fullName,
      firstName,
      email,
      password,
      userType: "Admin",
      adminDetails: { role: "super_admin" },
      isActive: true,
      isEmailVerified: false,
    });

    console.log("✅ Super Admin created");
  } else {
    console.log("⚠️ Super Admin already exists");
  }

  // Re-runnable: resend the verification email as long as the account isn't
  // verified yet, so a prior run that created the admin but failed to deliver
  // the email (e.g. SMTP misconfigured) can be recovered by just re-seeding.
  if (!admin.isEmailVerified) {
    const emailVerificationOtp = generateEmailVerificationOtp();
    admin.emailVerificationOtp = emailVerificationOtp;
    await admin.save();

    const verifyUrl = `${process.env.CLIENT_URL}/verify-email?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(emailVerificationOtp)}`;

    try {
      await sendWelcomeEmail({
        firstName: firstName || "",
        email,
        emailVerificationOtp,
        verifyUrl,
      });
      console.log("✅ Verification email sent");
    } catch (error) {
      console.error("⚠️ Failed to send verification email:", error);
    }
  } else {
    console.log("✅ Super Admin email already verified");
  }

  process.exit();
};

seedAdmin();