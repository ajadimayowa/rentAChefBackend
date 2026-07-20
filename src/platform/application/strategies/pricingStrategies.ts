import { IPricingStrategy } from '../contracts/strategies';
import { CreateBookingInput } from '../../domain/workflow';

export class StandardPricingStrategy implements IPricingStrategy {
  public readonly code = 'STANDARD_PRICING';

  calculate(input: CreateBookingInput, context: { baseChefFeeMinor: number; procurementFeeMinor: number; estimatedIngredientCostMinor: number; modifiersMinor: number; }) {
    const estimatedTotalMinor =
      context.baseChefFeeMinor +
      context.procurementFeeMinor +
      context.estimatedIngredientCostMinor +
      context.modifiersMinor;

    return {
      baseChefFeeMinor: context.baseChefFeeMinor,
      modifiersMinor: context.modifiersMinor,
      estimatedTotalMinor,
      currency: 'NGN' as const,
    };
  }
}
