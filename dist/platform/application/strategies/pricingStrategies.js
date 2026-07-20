"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StandardPricingStrategy = void 0;
class StandardPricingStrategy {
    constructor() {
        this.code = 'STANDARD_PRICING';
    }
    calculate(input, context) {
        const estimatedTotalMinor = context.baseChefFeeMinor +
            context.procurementFeeMinor +
            context.estimatedIngredientCostMinor +
            context.modifiersMinor;
        return {
            baseChefFeeMinor: context.baseChefFeeMinor,
            modifiersMinor: context.modifiersMinor,
            estimatedTotalMinor,
            currency: 'NGN',
        };
    }
}
exports.StandardPricingStrategy = StandardPricingStrategy;
