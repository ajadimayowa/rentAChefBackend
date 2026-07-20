import crypto from 'crypto';
import { IPaymentStrategy, PaymentInitializationResult } from '../contracts/strategies';

export class PaystackInstantPaymentStrategy implements IPaymentStrategy {
  public readonly code = 'PAYSTACK_INSTANT';

  async initializePayment(input: {
    bookingId: string;
    customerEmail: string;
    amountMinor: number;
    metadata?: Record<string, unknown>;
  }): Promise<PaymentInitializationResult> {
    const paymentReference = `rac_${input.bookingId}_${crypto.randomBytes(6).toString('hex')}`;

    return {
      paymentReference,
      authorizationUrl: `https://checkout.paystack.com/${paymentReference}`,
      amountMinor: input.amountMinor,
      currency: 'NGN',
      metadata: {
        customerEmail: input.customerEmail,
        ...(input.metadata || {}),
      },
    };
  }
}
