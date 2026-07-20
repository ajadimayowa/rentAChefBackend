import { CreateBookingInput, WorkflowResolvedPricing } from '../../domain/workflow';

export interface PricingContext {
  baseChefFeeMinor: number;
  procurementFeeMinor: number;
  estimatedIngredientCostMinor: number;
  modifiersMinor: number;
}

export interface IPricingStrategy {
  code: string;
  calculate(input: CreateBookingInput, context: PricingContext): WorkflowResolvedPricing;
}

export interface PaymentInitializationResult {
  paymentReference: string;
  authorizationUrl?: string;
  amountMinor: number;
  currency: 'NGN';
  metadata?: Record<string, unknown>;
}

export interface IPaymentStrategy {
  code: string;
  initializePayment(input: {
    bookingId: string;
    customerEmail: string;
    amountMinor: number;
    metadata?: Record<string, unknown>;
  }): Promise<PaymentInitializationResult>;
}
