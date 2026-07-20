import { BookingStatus } from '../../domain/enums';
import { IBookingRepository, IQuotationRepository } from '../contracts/repositories';

export interface GenerateQuotationInput {
  bookingId: string;
  chefFeeMinor: number;
  ingredientCostMinor: number;
  procurementFeeMinor: number;
  additionalChargesMinor: number;
  discountMinor: number;
  taxMinor: number;
  notes?: string;
  generatedBy: string;
}

export class QuotationEngine {
  constructor(
    private readonly bookingRepository: IBookingRepository,
    private readonly quotationRepository: IQuotationRepository,
  ) {}

  async generateQuotation(input: GenerateQuotationInput) {
    const booking = await this.bookingRepository.findById(input.bookingId);

    const finalAmountMinor =
      input.chefFeeMinor +
      input.ingredientCostMinor +
      input.procurementFeeMinor +
      input.additionalChargesMinor +
      input.taxMinor -
      input.discountMinor;

    const quotation = await this.quotationRepository.create({
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
      await this.bookingRepository.updateById(booking.id, {
        status: BookingStatus.QUOTATION_SENT,
        timeline: [
          ...booking.timeline,
          {
            status: BookingStatus.QUOTATION_SENT,
            changedBy: input.generatedBy,
            changedAt: new Date(),
          },
        ],
      });
    }

    return quotation;
  }
}
