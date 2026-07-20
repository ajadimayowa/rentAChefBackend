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
exports.BookingEngine = void 0;
const crypto_1 = __importDefault(require("crypto"));
const enums_1 = require("../../domain/enums");
const BOOKING_CODE_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const generateBookingNumber = () => {
    const suffix = Array.from({ length: 6 }, () => BOOKING_CODE_CHARSET[crypto_1.default.randomInt(BOOKING_CODE_CHARSET.length)]).join('');
    return `RAC-${suffix}`;
};
class BookingEngine {
    constructor(pricingStrategy, bookingRepository, auditLogRepository) {
        this.pricingStrategy = pricingStrategy;
        this.bookingRepository = bookingRepository;
        this.auditLogRepository = auditLogRepository;
    }
    createBooking(input, actorId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const modeOfPayment = input.transactnRef ? enums_1.ModeOfPayment.PAYSTACK : enums_1.ModeOfPayment.UNPAID;
            const paymentStatus = (_a = input.paymentStatus) !== null && _a !== void 0 ? _a : enums_1.PaymentStatus.UNPAID;
            const initialStatus = paymentStatus === enums_1.PaymentStatus.PAID ? enums_1.BookingStatus.PAID : enums_1.BookingStatus.PAYMENT_PENDING;
            const resolvedPricing = this.pricingStrategy.calculate(input, {
                baseChefFeeMinor: 0,
                procurementFeeMinor: ((_b = input.procurement) === null || _b === void 0 ? void 0 : _b.procurementFeeMinor) || 0,
                estimatedIngredientCostMinor: ((_c = input.procurement) === null || _c === void 0 ? void 0 : _c.estimatedIngredientCostMinor) || 0,
                modifiersMinor: 0,
            });
            const booking = yield this.bookingRepository.create({
                bookingNumber: generateBookingNumber(),
                customerId: input.customerId,
                serviceId: input.serviceId,
                specialServiceId: input.specialServiceId,
                workflow: input.workflow,
                chefLevel: input.chefLevel,
                modeOfPayment,
                status: initialStatus,
                paymentStatus,
                transactnRef: input.transactnRef,
                menuSelectionType: input.menuSelectionType,
                chefMenuId: input.chefMenuId,
                customerUploadedMenuFileId: input.customerUploadedMenuFileId,
                procurement: input.procurement
                    ? {
                        option: input.procurement.option,
                        estimatedIngredientCostMinor: input.procurement.estimatedIngredientCostMinor,
                        procurementFeeMinor: input.procurement.procurementFeeMinor,
                    }
                    : undefined,
                bookingData: input.bookingData,
                pricingSnapshot: {
                    baseChefFeeMinor: resolvedPricing.baseChefFeeMinor,
                    estimatedTotalMinor: resolvedPricing.estimatedTotalMinor,
                    currency: 'NGN',
                },
                timeline: [
                    {
                        status: initialStatus,
                        changedBy: actorId,
                        changedAt: new Date(),
                    },
                ],
            });
            yield this.auditLogRepository.create({
                actorId,
                action: 'BOOKING_CREATED',
                entityType: 'BOOKING',
                entityId: booking.id,
                after: { bookingNumber: booking.bookingNumber, status: booking.status },
                createdAt: new Date(),
            });
            return booking;
        });
    }
}
exports.BookingEngine = BookingEngine;
