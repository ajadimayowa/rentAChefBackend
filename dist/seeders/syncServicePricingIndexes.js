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
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const ServicePricing_1 = require("../models/ServicePricing");
dotenv_1.default.config();
const LEGACY_INDEX_NAMES = ["serviceId_1_chefCategoryId_1", "specialServiceId_1_chefCategoryId_1"];
const run = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is not defined");
        }
        yield mongoose_1.default.connect(process.env.MONGO_URI);
        console.log("MongoDB connected");
        const indexes = yield ServicePricing_1.ServicePricing.collection.indexes();
        for (const legacyIndexName of LEGACY_INDEX_NAMES) {
            const hasLegacyIndex = indexes.some((index) => index.name === legacyIndexName);
            if (hasLegacyIndex) {
                yield ServicePricing_1.ServicePricing.collection.dropIndex(legacyIndexName);
                console.log(`Dropped legacy index: ${legacyIndexName}`);
            }
            else {
                console.log(`Legacy index not found: ${legacyIndexName}`);
            }
        }
        const synced = yield ServicePricing_1.ServicePricing.syncIndexes();
        console.log("ServicePricing indexes synchronized", synced);
        yield mongoose_1.default.disconnect();
        console.log("Done");
        process.exit(0);
    }
    catch (error) {
        console.error("Failed to sync ServicePricing indexes", error);
        yield mongoose_1.default.disconnect();
        process.exit(1);
    }
});
run();
