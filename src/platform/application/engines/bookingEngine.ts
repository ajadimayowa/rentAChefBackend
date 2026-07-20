import crypto from 'crypto';
import { IAuditLogRepository, IBookingRepository } from '../contracts/repositories';
import { BookingStatus, ModeOfPayment, PaymentStatus } from '../../domain/enums';
import { CreateBookingInput } from '../../domain/workflow';
import { IPricingStrategy } from '../contracts/strategies';

const BOOKING_CODE_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

const generateBookingNumber = () => {
  const suffix = Array.from({ length: 6 }, () => BOOKING_CODE_CHARSET[crypto.randomInt(BOOKING_CODE_CHARSET.length)]).join('');
  return `RAC-${suffix}`;
};

export class BookingEngine {
  constructor(
    private readonly pricingStrategy: IPricingStrategy,
    private readonly bookingRepository: IBookingRepository,
    private readonly auditLogRepository: IAuditLogRepository,
  ) {}

  async createBooking(input: CreateBookingInput, actorId: string) {
    const modeOfPayment = input.transactnRef ? ModeOfPayment.PAYSTACK : ModeOfPayment.UNPAID;
    const paymentStatus = input.paymentStatus ?? PaymentStatus.UNPAID;
    const initialStatus = paymentStatus === PaymentStatus.PAID ? BookingStatus.PAID : BookingStatus.PAYMENT_PENDING;

    const resolvedPricing = this.pricingStrategy.calculate(input, {
      baseChefFeeMinor: 0,
      procurementFeeMinor: input.procurement?.procurementFeeMinor || 0,
      estimatedIngredientCostMinor: input.procurement?.estimatedIngredientCostMinor || 0,
      modifiersMinor: 0,
    });

    const booking = await this.bookingRepository.create({
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

    await this.auditLogRepository.create({
      actorId,
      action: 'BOOKING_CREATED',
      entityType: 'BOOKING',
      entityId: booking.id,
      after: { bookingNumber: booking.bookingNumber, status: booking.status },
      createdAt: new Date(),
    });

    return booking;
  }
}
