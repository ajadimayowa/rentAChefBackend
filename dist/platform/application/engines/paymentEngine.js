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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentEngine = void 0;
const enums_1 = require("../../domain/enums");
class PaymentEngine {
    constructor(paymentStrategy, bookingRepository, quotationRepository, paymentRepository) {
        this.paymentStrategy = paymentStrategy;
        this.bookingRepository = bookingRepository;
        this.quotationRepository = quotationRepository;
        this.paymentRepository = paymentRepository;
    }
    initializeInstantPayment(input) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const booking = yield this.bookingRepository.findById(input.bookingId);
            const amountMinor = ((_a = booking === null || booking === void 0 ? void 0 : booking.pricingSnapshot) === null || _a === void 0 ? void 0 : _a.estimatedTotalMinor) || 0;
            const gateway = yield this.paymentStrategy.initializePayment({
                bookingId: (booking === null || booking === void 0 ? void 0 : booking.id) || input.bookingId,
                customerEmail: input.customerEmail,
                amountMinor,
                metadata: (booking === null || booking === void 0 ? void 0 : booking.bookingNumber) ? { bookingNumber: booking.bookingNumber } : undefined,
            });
            const payment = yield this.paymentRepository.create({
                bookingId: (booking === null || booking === void 0 ? void 0 : booking.id) || input.bookingId,
                customerId: input.customerId,
                provider: 'PAYSTACK',
                amountMinor: gateway.amountMinor,
                currency: 'NGN',
                paymentReference: gateway.paymentReference,
                transactionDetails: gateway.metadata,
                status: enums_1.PaymentStatus.PENDING,
            });
            return { payment, gateway };
        });
    }
    initializeQuotationPayment(input) {
        return __awaiter(this, void 0, void 0, function* () {
            const quotation = yield this.quotationRepository.findById(input.quotationId);
            const amountMinor = (quotation === null || quotation === void 0 ? void 0 : quotation.finalAmountMinor) || 0;
            const gateway = yield this.paymentStrategy.initializePayment({
                bookingId: input.bookingId,
                customerEmail: input.customerEmail,
                amountMinor,
                metadata: (quotation === null || quotation === void 0 ? void 0 : quotation.id) ? { quotationId: quotation.id } : undefined,
            });
            const payment = yield this.paymentRepository.create({
                bookingId: input.bookingId,
                quotationId: quotation === null || quotation === void 0 ? void 0 : quotation.id,
                customerId: input.customerId,
                provider: 'PAYSTACK',
                amountMinor,
                currency: 'NGN',
                paymentReference: gateway.paymentReference,
                status: enums_1.PaymentStatus.PENDING,
                transactionDetails: gateway.metadata,
            });
            return { payment, gateway };
        });
    }
    confirmPayment(reference, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            const payment = yield this.paymentRepository.updateByReference(reference, {
                status: enums_1.PaymentStatus.PAID,
                paidAt: new Date(),
                transactionDetails: payload,
            });
            if (!payment)
                return null;
            const booking = yield this.bookingRepository.findById(payment.bookingId);
            if (!booking)
                return payment;
            yield this.bookingRepository.updateById(booking.id, {
                status: enums_1.BookingStatus.PAID,
                paymentStatus: enums_1.PaymentStatus.PAID,
                timeline: [
                    ...booking.timeline,
                    {
                        status: enums_1.BookingStatus.PAID,
                        changedBy: 'PAYSTACK_WEBHOOK',
                        changedAt: new Date(),
                    },
                ],
            });
            return payment;
        });
    }
}
exports.PaymentEngine = PaymentEngine;
