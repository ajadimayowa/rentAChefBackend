"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServicePrice = void 0;
// utils/getServicePrice.ts
const Chef_1 = __importDefault(require("../models/Chef"));
const ServicePricing_1 = require("../models/ServicePricing");
const getServicePrice = (chefId, serviceId) => __awaiter(void 0, void 0, void 0, function* () {
    // 1️⃣ Find the chef and get their category
    const chef = yield Chef_1.default.findById(chefId).lean();
    if (!chef)
        throw new Error("Chef not found");
    const chefCategoryId = chef.category;
    // 2️⃣ Find the service pricing for this chef category
    const pricing = yield ServicePricing_1.ServicePricing.findOne({
        serviceId,
        chefCategoryId,
    }).lean();
    if (!pricing)
        throw new Error("Pricing not found for this service and chef category");
    return { price: pricing.price, currency: pricing.currency };
});
exports.getServicePrice = getServicePrice;
