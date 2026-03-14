// utils/getServicePrice.ts
import ChefSchema from "../models/Chef";
import { ServicePricing } from "../models/ServicePricing";
import { Types } from "mongoose";

export const getServicePrice = async (
    chefId: Types.ObjectId | string,
    serviceId: Types.ObjectId | string
): Promise<{ price: number; currency: string }> => {
    // 1️⃣ Find the chef and get their category
    const chef = await ChefSchema.findById(chefId).lean();
    if (!chef) throw new Error("Chef not found");

    const chefCategoryId = chef.category;

    // 2️⃣ Find the service pricing for this chef category
    const pricing = await ServicePricing.findOne({
        serviceId,
        chefCategoryId,
    }).lean();

    if (!pricing) throw new Error("Pricing not found for this service and chef category");

    return { price: pricing.price, currency: pricing.currency };
};