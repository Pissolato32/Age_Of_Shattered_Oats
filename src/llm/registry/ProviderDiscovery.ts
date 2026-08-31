import { LLMProviderId, ModelConfig, FallbackModelConfig } from '../contracts/LLMContract';
import { BillingMode } from '../validators/BillingGuard';
import { ModelCapabilityProfile, ModelLifecycleStatus } from './ModelRegistry';

export type BillingEligibility = 'FREE' | 'PAID' | 'UNKNOWN' | 'UNAVAILABLE';
export type HealthStatus = 'ONLINE' | 'OFFLINE' | 'DEGRADED' | 'RATE_LIMITED' | 'UNKNOWN';
export type ModelLifecycleState =
  | 'DISCOVERED'
  | 'HEALTHY'
  | 'ELIGIBLE'
  | 'RATE_LIMITED'
  | 'DEGRADED'
  | 'UNAVAILABLE'
  | 'PAID'
  | 'RETIRED';

export interface HealthCheckEvent {
  httpStatus?: number;
  isTimeout?: boolean;
  isAuthFailure?: boolean;
  errorMessage?: string;
  cooldownMs?: number;
}

export interface DiscoveredCandidate {
  readonly id: string;
  readonly provider: LLMProviderId;
  readonly model: string;
  discoveredAt: number;
  billing: {
    mode: BillingEligibility;
    eligible: boolean;
    lastVerifiedAt?: number;
  };
  health: {
    status: HealthStatus;
    lastCheckedAt?: number;
    failureReason?: string;
    rateLimitedUntil?: number;
  };
  lifecycle: ModelLifecycleState;
  capabilities?: ModelCapabilityProfile;
  fallbackConfigs?: readonly FallbackModelConfig[];
  enabled: boolean;
  freePolicy?: 'explicit-free' | 'free-tier';
  maxCost?: number;
}

export class ProviderDiscovery {
  /**
   * Evaluates dynamic billing eligibility in strict fail-closed mode.
   * Health status (HTTP 200) NEVER implies free billing.
   * Only explicit FREE declarations produce eligible=true.
   */
  public static evaluateBillingEligibility(
    provider: LLMProviderId,
    modelName: string,
    declaredBilling?: BillingEligibility,
    freePolicy?: string
  ): { mode: BillingEligibility; eligible: boolean } {
    // 1. Mock is always free
    if (provider === 'mock') {
      return { mode: 'FREE', eligible: true };
    }

    // 2. OpenRouter explicit :free tag
    if (provider === 'openrouter') {
      if (modelName.endsWith(':free')) {
        return { mode: 'FREE', eligible: true };
      }
      if (declaredBilling === 'PAID') {
        return { mode: 'PAID', eligible: false };
      }
      return { mode: 'UNKNOWN', eligible: false }; // Fail-closed
    }

    // 3. Gemini / OpenCode free-tier policies
    if (provider === 'gemini' || provider === 'opencode' || provider === 'huggingface') {
      if (declaredBilling === 'PAID') {
        return { mode: 'PAID', eligible: false };
      }
      if (declaredBilling === 'FREE' || freePolicy === 'free-tier' || freePolicy === 'explicit-free') {
        return { mode: 'FREE', eligible: true };
      }
      return { mode: 'UNKNOWN', eligible: false }; // Fail-closed
    }

    if (declaredBilling === 'FREE') {
      return { mode: 'FREE', eligible: true };
    }

    return { mode: 'UNKNOWN', eligible: false };
  }

  /**
   * Processes a health check event on a candidate.
   * Strictly separates health (reachability) from billing (cost).
   */
  public static processHealthEvent(
    candidate: DiscoveredCandidate,
    event: HealthCheckEvent
  ): DiscoveredCandidate {
    const now = Date.now();
    const updated: DiscoveredCandidate = {
      ...candidate,
      billing: { ...candidate.billing },
      health: { ...candidate.health, lastCheckedAt: now }
    };

    if (event.isAuthFailure) {
      updated.health.status = 'OFFLINE';
      updated.health.failureReason = event.errorMessage || 'Authentication failure';
      updated.lifecycle = 'UNAVAILABLE';
      return updated;
    }

    if (event.isTimeout) {
      updated.health.status = 'DEGRADED';
      updated.health.failureReason = event.errorMessage || 'Request timeout';
      updated.lifecycle = 'DEGRADED';
      return updated;
    }

    if (event.httpStatus === 429) {
      const cooldown = event.cooldownMs ?? 60000;
      updated.health.status = 'RATE_LIMITED';
      updated.health.rateLimitedUntil = now + cooldown;
      updated.health.failureReason = event.errorMessage || 'HTTP 429: Rate limit exceeded';
      updated.lifecycle = 'RATE_LIMITED';
      return updated;
    }

    if (event.httpStatus === 404) {
      updated.health.status = 'OFFLINE';
      updated.health.failureReason = event.errorMessage || 'HTTP 404: Model not found / deprecated';
      updated.lifecycle = 'UNAVAILABLE';
      return updated;
    }

    if (event.httpStatus && event.httpStatus >= 500) {
      updated.health.status = 'OFFLINE';
      updated.health.failureReason = event.errorMessage || `HTTP ${event.httpStatus}: Provider service error`;
      updated.lifecycle = 'UNAVAILABLE';
      return updated;
    }

    if (event.httpStatus === 200) {
      updated.health.status = 'ONLINE';
      updated.health.failureReason = undefined;
      updated.health.rateLimitedUntil = undefined;

      // Transition based on billing eligibility (strictly separated from HTTP 200)
      if (updated.billing.mode === 'FREE' && updated.billing.eligible) {
        updated.lifecycle = 'ELIGIBLE';
      } else if (updated.billing.mode === 'PAID') {
        updated.lifecycle = 'PAID';
      } else {
        // UNKNOWN or UNAVAILABLE billing -> fail-closed
        updated.lifecycle = 'HEALTHY';
      }
      return updated;
    }

    return updated;
  }

  /**
   * Updates billing eligibility dynamically (e.g. when provider changes pricing or free tier status).
   */
  public static updateBillingState(
    candidate: DiscoveredCandidate,
    newMode: BillingEligibility
  ): DiscoveredCandidate {
    const isFree = newMode === 'FREE';
    const now = Date.now();

    const updated: DiscoveredCandidate = {
      ...candidate,
      billing: {
        mode: newMode,
        eligible: isFree,
        lastVerifiedAt: now
      },
      health: { ...candidate.health }
    };

    if (newMode === 'PAID') {
      updated.lifecycle = 'PAID';
    } else if (newMode === 'FREE') {
      if (updated.health.status === 'ONLINE') {
        updated.lifecycle = 'ELIGIBLE';
      } else if (updated.lifecycle === 'PAID') {
        updated.lifecycle = (updated.health.status as HealthStatus) === 'ONLINE' ? 'ELIGIBLE' : 'HEALTHY';
      }
    } else if (newMode === 'UNKNOWN' || newMode === 'UNAVAILABLE') {
      if (updated.lifecycle === 'ELIGIBLE') {
        updated.lifecycle = 'HEALTHY'; // Demoted from ELIGIBLE because billing is unknown
      }
    }

    return updated;
  }
}
