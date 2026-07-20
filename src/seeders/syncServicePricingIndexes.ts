import mongoose from "mongoose";
import dotenv from "dotenv";
import { ServicePricing } from "../models/ServicePricing";

dotenv.config();

const LEGACY_INDEX_NAMES = ["serviceId_1_chefCategoryId_1", "specialServiceId_1_chefCategoryId_1"];

const run = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    const indexes = await ServicePricing.collection.indexes();
    for (const legacyIndexName of LEGACY_INDEX_NAMES) {
      const hasLegacyIndex = indexes.some((index) => index.name === legacyIndexName);

      if (hasLegacyIndex) {
        await ServicePricing.collection.dropIndex(legacyIndexName);
        console.log(`Dropped legacy index: ${legacyIndexName}`);
      } else {
        console.log(`Legacy index not found: ${legacyIndexName}`);
      }
    }

    const synced = await ServicePricing.syncIndexes();
    console.log("ServicePricing indexes synchronized", synced);

    await mongoose.disconnect();
    console.log("Done");
    process.exit(0);
  } catch (error) {
    console.error("Failed to sync ServicePricing indexes", error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

run();
