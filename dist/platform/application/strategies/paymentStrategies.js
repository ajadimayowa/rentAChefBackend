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
exports.PaystackInstantPaymentStrategy = void 0;
const crypto_1 = __importDefault(require("crypto"));
class PaystackInstantPaymentStrategy {
    constructor() {
        this.code = 'PAYSTACK_INSTANT';
    }
    initializePayment(input) {
        return __awaiter(this, void 0, void 0, function* () {
            const paymentReference = `rac_${input.bookingId}_${crypto_1.default.randomBytes(6).toString('hex')}`;
            return {
                paymentReference,
                authorizationUrl: `https://checkout.paystack.com/${paymentReference}`,
                amountMinor: input.amountMinor,
                currency: 'NGN',
                metadata: Object.assign({ customerEmail: input.customerEmail }, (input.metadata || {})),
            };
        });
    }
}
exports.PaystackInstantPaymentStrategy = PaystackInstantPaymentStrategy;
