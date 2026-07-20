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
exports.QuotationEngine = void 0;
const enums_1 = require("../../domain/enums");
class QuotationEngine {
    constructor(bookingRepository, quotationRepository) {
        this.bookingRepository = bookingRepository;
        this.quotationRepository = quotationRepository;
    }
    generateQuotation(input) {
        return __awaiter(this, void 0, void 0, function* () {
            const booking = yield this.bookingRepository.findById(input.bookingId);
            const finalAmountMinor = input.chefFeeMinor +
                input.ingredientCostMinor +
                input.procurementFeeMinor +
                input.additionalChargesMinor +
                input.taxMinor -
                input.discountMinor;
            const quotation = yield this.quotationRepository.create({
                bookingId: input.bookingId,
                chefFeeMinor: input.chefFeeMinor,
                ingredientCostMinor: input.ingredientCostMinor,
                procurementFeeMinor: input.procurementFeeMinor,
                additionalChargesMinor: input.additionalChargesMinor,
                discountMinor: input.discountMinor,
                taxMinor: input.taxMinor,
                finalAmountMinor,
                currency: 'NGN',
                generatedBy: input.generatedBy,
                notes: input.notes,
                status: 'SENT',
            });
            if (booking) {
                yield this.bookingRepository.updateById(booking.id, {
                    status: enums_1.BookingStatus.QUOTATION_SENT,
                    timeline: [
                        ...booking.timeline,
                        {
                            status: enums_1.BookingStatus.QUOTATION_SENT,
                            changedBy: input.generatedBy,
                            changedAt: new Date(),
                        },
                    ],
                });
            }
            return quotation;
        });
    }
}
exports.QuotationEngine = QuotationEngine;
