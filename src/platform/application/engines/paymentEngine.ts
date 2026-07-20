import { BookingStatus, PaymentStatus } from '../../domain/enums';
import { IBookingRepository, IPaymentRepository, IQuotationRepository } from '../contracts/repositories';
import { IPaymentStrategy } from '../contracts/strategies';

export class PaymentEngine {
  constructor(
    private readonly paymentStrategy: IPaymentStrategy,
    private readonly bookingRepository: IBookingRepository,
    private readonly quotationRepository: IQuotationRepository,
    private readonly paymentRepository: IPaymentRepository,
  ) {}

  async initializeInstantPayment(input: {
    bookingId: string;
    customerId: string;
    customerEmail: string;
  }) {
    const booking = await this.bookingRepository.findById(input.bookingId);
    const amountMinor = booking?.pricingSnapshot?.estimatedTotalMinor || 0;

    const gateway = await this.paymentStrategy.initializePayment({
      bookingId: booking?.id || input.bookingId,
      customerEmail: input.customerEmail,
      amountMinor,
      metadata: booking?.bookingNumber ? { bookingNumber: booking.bookingNumber } : undefined,
    });

    const payment = await this.paymentRepository.create({
      bookingId: booking?.id || input.bookingId,
      customerId: input.customerId,
      provider: 'PAYSTACK',
      amountMinor: gateway.amountMinor,
      currency: 'NGN',
      paymentReference: gateway.paymentReference,
      transactionDetails: gateway.metadata,
      status: PaymentStatus.PENDING,
    });

    return { payment, gateway };
  }

  async initializeQuotationPayment(input: {
    bookingId: string;
    quotationId: string;
    customerId: string;
    customerEmail: string;
  }) {
    const quotation = await this.quotationRepository.findById(input.quotationId);
    const amountMinor = quotation?.finalAmountMinor || 0;

    const gateway = await this.paymentStrategy.initializePayment({
      bookingId: input.bookingId,
      customerEmail: input.customerEmail,
      amountMinor,
      metadata: quotation?.id ? { quotationId: quotation.id } : undefined,
    });

    const payment = await this.paymentRepository.create({
      bookingId: input.bookingId,
      quotationId: quotation?.id,
      customerId: input.customerId,
      provider: 'PAYSTACK',
      amountMinor,
      currency: 'NGN',
      paymentReference: gateway.paymentReference,
      status: PaymentStatus.PENDING,
      transactionDetails: gateway.metadata,
    });

    return { payment, gateway };
  }

  async confirmPayment(reference: string, payload: Record<string, unknown>) {
    const payment = await this.paymentRepository.updateByReference(reference, {
      status: PaymentStatus.PAID,
      paidAt: new Date(),
      transactionDetails: payload,
    });

    if (!payment) return null;

    const booking = await this.bookingRepository.findById(payment.bookingId);
    if (!booking) return payment;

    await this.bookingRepository.updateById(booking.id, {
      status: BookingStatus.PAID,
      paymentStatus: PaymentStatus.PAID,
      timeline: [
        ...booking.timeline,
        {
          status: BookingStatus.PAID,
          changedBy: 'PAYSTACK_WEBHOOK',
          changedAt: new Date(),
        },
      ],
    });

    return payment;
  }
}
