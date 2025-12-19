import mongoose from "mongoose";
import dotenv from "dotenv";
import Admin from "../models/Admin";

dotenv.config();

const seedAdmin = async () => {
  await mongoose.connect(process.env.MONGO_URI as string);

  const adminExists = await Admin.findOne({
    email: "admin@rentachef.com"
  });

  if (!adminExists) {
    await Admin.create({
      fullName: "Super Admin",
      email: "admin@rentachef.com",
      password: "Admin@123",
      role: "super_admin"
    });

    console.log("✅ Super Admin created");
  } else {
    console.log("⚠️ Super Admin already exists");
  }

  process.exit();
};

seedAdmin();