import { ModelConfig, LLMUsage, LLMProviderId } from '../contracts/LLMContract';

export type BillingMode = 'strict' | 'free-tier';

export class BillingGuardError extends Error {
  constructor(message: string, public readonly provider: LLMProviderId, public readonly model: string) {
    super(`[BillingGuard] ${message}`);
    this.name = 'BillingGuardError';
  }
}

export class BillingGuard {
  /**
   * Pre-execution assertion: verifies that the model configuration specifies $0.00 cost limit
   * and adheres to provider-specific free-tier conventions under the selected BillingMode.
   */
  public static assertFreeModel(model: ModelConfig, mode: BillingMode = 'free-tier'): void {
    if (model.maxCost !== 0) {
      throw new BillingGuardError(
        `Paid model blocked: maxCost is ${model.maxCost}, expected 0`,
        model.provider,
        model.model
      );
    }

    if (mode === 'strict' && model.freePolicy !== 'explicit-free') {
      throw new BillingGuardError(
        `Strict Billing Mode blocked non-explicit-free model: ${model.provider}/${model.model} (policy: ${model.freePolicy})`,
        model.provider,
        model.model
      );
    }

    if (model.provider === 'openrouter' && !model.model.endsWith(':free')) {
      throw new BillingGuardError(
        `OpenRouter non-free endpoint rejected. Model '${model.model}' must end with ':free'`,
        model.provider,
        model.model
      );
    }
  }

  /**
   * Post-execution assertion: inspects reported usage/cost from API responses.
   * Throws immediately if any cost > 0 was generated.
   */
  public static assertZeroCost(usage: LLMUsage, model: ModelConfig): void {
    if (usage.cost !== undefined && usage.cost > 0) {
      throw new BillingGuardError(
        `NON-FREE REQUEST DETECTED: cost=${usage.cost} for model ${model.model}`,
        model.provider,
        model.model
      );
    }

    if (usage.costStatus === 'NON_ZERO_BLOCKED') {
      throw new BillingGuardError(
        `Blocked non-zero cost execution for ${model.model}`,
        model.provider,
        model.model
      );
    }
  }

  /**
   * Evaluates pricing metadata from OpenRouter or other provider model catalogs.
   */
  public static isPricingZero(pricing?: { prompt?: string | number; completion?: string | number }): boolean {
    if (!pricing) return false;
    const promptCost = typeof pricing.prompt === 'string' ? parseFloat(pricing.prompt) : pricing.prompt;
    const completionCost = typeof pricing.completion === 'string' ? parseFloat(pricing.completion) : pricing.completion;
    return promptCost === 0 && completionCost === 0;
  }

  /**
   * Normalizes raw token usage and pricing into strict verified LLMUsage.
   */
  public static buildUsage(params: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    cost?: number;
    isExplicitFree?: boolean;
  }): LLMUsage {
    const cost = params.cost;
    let costStatus: 'VERIFIED_ZERO' | 'NON_ZERO_BLOCKED' | 'COST_UNVERIFIED';

    if (cost !== undefined && cost > 0) {
      costStatus = 'NON_ZERO_BLOCKED';
    } else if (cost === 0 || params.isExplicitFree) {
      costStatus = 'VERIFIED_ZERO';
    } else {
      costStatus = 'COST_UNVERIFIED';
    }

    const verifiedFree = costStatus === 'VERIFIED_ZERO';

    return {
      promptTokens: params.promptTokens,
      completionTokens: params.completionTokens,
      totalTokens: params.totalTokens || ((params.promptTokens || 0) + (params.completionTokens || 0)),
      cost: cost ?? 0,
      verifiedFree,
      costStatus
    };
  }
}
