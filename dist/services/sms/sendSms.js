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
exports.sendSms = void 0;
const axios_1 = __importDefault(require("axios"));
const sendSms = (_a) => __awaiter(void 0, [_a], void 0, function* ({ to, message, }) {
    var _b;
    const apiKey = process.env.SMS_SENDER_APIKEY;
    if (!apiKey) {
        throw new Error("SMS_SENDER_APIKEY is missing");
    }
    const phone = to
        .replace(/\s+/g, "")
        .replace(/^\+234/, "234")
        .replace(/^234/, "234")
        .replace(/^0/, "234");
    const { data } = yield axios_1.default.post(process.env.SMS_SENDER_PROVIDER || "https://v3.api.termii.com/api/sms/send", {
        api_key: apiKey,
        to: phone,
        from: "FloathHub",
        sms: message,
        type: "plain",
        channel: "generic",
    });
    // Termii returns an error object even with HTTP 200 in some cases
    if (data.code !== "ok" &&
        ((_b = data.message) === null || _b === void 0 ? void 0 : _b.toLowerCase()) !== "success") {
        throw new Error(data.message || "SMS sending failed");
    }
    return data;
});
exports.sendSms = sendSms;
