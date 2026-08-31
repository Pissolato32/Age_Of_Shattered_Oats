import * as fs from 'fs';
import * as path from 'path';
import { ModelConfig, LLMProviderId, FallbackModelConfig } from '../contracts/LLMContract';
import { BillingGuard, BillingMode } from '../validators/BillingGuard';
import {
  BillingEligibility,
  DiscoveredCandidate,
  HealthCheckEvent,
  ModelLifecycleState,
  ProviderDiscovery
} from './ProviderDiscovery';

export type LLMTask = 'INTERPRET_INTENT' | 'NARRATE_EXECUTION';

export type ModelLifecycleStatus =
  | 'ACTIVE'
  | 'DEGRADED'
  | 'RATE_LIMITED'
  | 'UNAVAILABLE'
  | 'RETIRED'
  | 'PAID'
  | 'UNKNOWN';

export interface ModelCapabilityProfile {
  readonly interpreterScore: number;
  readonly narratorScore: number;
  readonly mechanicalSilenceScore: number;
  readonly factualGroundingScore: number;
  readonly reliabilityScore: number;
  readonly avgLatencyMs: number;
}

export interface RegisteredModelConfig extends ModelConfig {
  status?: ModelLifecycleStatus;
  rateLimitedUntil?: number;
  lastQualifiedAt?: string;
  capabilities?: ModelCapabilityProfile;
}

export interface ModelRegistryConfig {
  readonly version: string;
  readonly description: string;
  readonly models: readonly RegisteredModelConfig[];
}

export const DEFAULT_MODEL_REGISTRY_CONFIG: ModelRegistryConfig = {
  version: '1.2.0',
  description: 'Capability-Based Model Registry for Age of Shattered Oaths Adaptive LLM Layer',
  models: [
    {
      id: 'gemini-free-default',
      provider: 'gemini',
      model: 'gemini-flash-lite-latest',
      freePolicy: 'free-tier',
      maxCost: 0,
      enabled: true,
      status: 'ACTIVE',
      lastQualifiedAt: '2026-08-30T22:56:00.000Z',
      capabilities: {
        interpreterScore: 9.5,
        narratorScore: 8.6,
        mechanicalSilenceScore: 8.5,
        factualGroundingScore: 9.8,
        reliabilityScore: 9.5,
        avgLatencyMs: 1200
      },
      fallbackConfigs: [
        { id: 'gemini-1.5-flash-fb', provider: 'gemini', model: 'gemini-1.5-flash', freePolicy: 'free-tier', maxCost: 0, enabled: true },
        { id: 'gemini-2.0-flash-lite-fb', provider: 'gemini', model: 'gemini-2.0-flash-lite', freePolicy: 'free-tier', maxCost: 0, enabled: true },
        { id: 'gemini-1.5-pro-fb', provider: 'gemini', model: 'gemini-1.5-pro', freePolicy: 'free-tier', maxCost: 0, enabled: true }
      ]
    },
    {
      id: 'openrouter-free-default',
      provider: 'openrouter',
      model: 'google/gemma-4-31b-it:free',
      freePolicy: 'explicit-free',
      maxCost: 0,
      enabled: true,
      status: 'ACTIVE',
      lastQualifiedAt: '2026-08-30T23:45:00.000Z',
      capabilities: {
        interpreterScore: 8.9,
        narratorScore: 9.3,
        mechanicalSilenceScore: 8.7,
        factualGroundingScore: 10.0,
        reliabilityScore: 8.8,
        avgLatencyMs: 3800
      },
      fallbackConfigs: [
        { id: 'openrouter-gemma-26b-fb', provider: 'openrouter', model: 'google/gemma-4-26b-a4b-it:free', freePolicy: 'explicit-free', maxCost: 0, enabled: true },
        { id: 'openrouter-nemotron-fb', provider: 'openrouter', model: 'nvidia/nemotron-3.5-lightning:free', freePolicy: 'explicit-free', maxCost: 0, enabled: true },
        { id: 'openrouter-glm-fb', provider: 'openrouter', model: 'z-ai/glm-5.2:free', freePolicy: 'explicit-free', maxCost: 0, enabled: true },
        { id: 'openrouter-minimax-fb', provider: 'openrouter', model: 'minimax/minimax-m3:free', freePolicy: 'explicit-free', maxCost: 0, enabled: true }
      ]
    },
    {
      id: 'opencode-free-default',
      provider: 'opencode',
      model: 'nemotron-3.5-lightning-free',
      freePolicy: 'free-tier',
      maxCost: 0,
      enabled: true,
      status: 'ACTIVE',
      lastQualifiedAt: '2026-08-30T23:21:00.000Z',
      capabilities: {
        interpreterScore: 7.2,
        narratorScore: 7.5,
        mechanicalSilenceScore: 7.0,
        factualGroundingScore: 9.6,
        reliabilityScore: 8.5,
        avgLatencyMs: 14000
      },
      fallbackConfigs: [
        { id: 'opencode-nemotron-3-fb', provider: 'opencode', model: 'nemotron-3-ultra-free', freePolicy: 'free-tier', maxCost: 0, enabled: true },
        { id: 'opencode-ling-flash-fb', provider: 'opencode', model: 'ling-3.0-flash-fin-free', freePolicy: 'free-tier', maxCost: 0, enabled: true },
        { id: 'opencode-laguna-fb', provider: 'opencode', model: 'laguna-s-2.1-free', freePolicy: 'free-tier', maxCost: 0, enabled: true }
      ]
    },
    {
      id: 'huggingface-free-default',
      provider: 'huggingface',
      model: 'meta-llama/Llama-3.2-3B-Instruct',
      freePolicy: 'free-tier',
      maxCost: 0,
      enabled: true,
      status: 'DEGRADED',
      capabilities: {
        interpreterScore: 6.5,
        narratorScore: 6.8,
        mechanicalSilenceScore: 6.5,
        factualGroundingScore: 8.0,
        reliabilityScore: 6.0,
        avgLatencyMs: 5000
      },
      fallbackConfigs: [
        { id: 'hf-llama-3.2-1b-fb', provider: 'huggingface', model: 'meta-llama/Llama-3.2-1B-Instruct', freePolicy: 'free-tier', maxCost: 0, enabled: true },
        { id: 'hf-mistral-7b-fb', provider: 'huggingface', model: 'mistralai/Mistral-7B-Instruct-v0.3', freePolicy: 'free-tier', maxCost: 0, enabled: true },
        { id: 'hf-qwen-7b-fb', provider: 'huggingface', model: 'Qwen/Qwen2.5-7B-Instruct', freePolicy: 'free-tier', maxCost: 0, enabled: true },
        { id: 'hf-qwen-coder-7b-fb', provider: 'huggingface', model: 'Qwen/Qwen2.5-Coder-7B-Instruct', freePolicy: 'free-tier', maxCost: 0, enabled: true },
        { id: 'hf-gemma-2-2b-fb', provider: 'huggingface', model: 'google/gemma-2-2b-it', freePolicy: 'free-tier', maxCost: 0, enabled: true },
        { id: 'hf-phi-3.5-fb', provider: 'huggingface', model: 'microsoft/Phi-3.5-mini-instruct', freePolicy: 'free-tier', maxCost: 0, enabled: true }
      ]
    },
    {
      id: 'mock-deterministic',
      provider: 'mock',
      model: 'deterministic-local-mock',
      freePolicy: 'explicit-free',
      maxCost: 0,
      enabled: true,
      status: 'ACTIVE',
      capabilities: {
        interpreterScore: 9.0,
        narratorScore: 9.0,
        mechanicalSilenceScore: 10.0,
        factualGroundingScore: 10.0,
        reliabilityScore: 10.0,
        avgLatencyMs: 5
      }
    }
  ]
};

export class ModelRegistry {
  private readonly config: ModelRegistryConfig;
  private readonly dynamicCandidates: Map<string, DiscoveredCandidate> = new Map();

  constructor(customConfigPath?: string) {
    if (customConfigPath && fs.existsSync(customConfigPath)) {
      try {
        const raw = fs.readFileSync(customConfigPath, 'utf8');
        this.config = JSON.parse(raw) as ModelRegistryConfig;
      } catch {
        this.config = DEFAULT_MODEL_REGISTRY_CONFIG;
      }
    } else {
      const defaultPath = path.resolve(process.cwd(), 'config', 'llm-benchmark.models.json');
      if (fs.existsSync(defaultPath)) {
        try {
          const raw = fs.readFileSync(defaultPath, 'utf8');
          this.config = JSON.parse(raw) as ModelRegistryConfig;
        } catch {
          this.config = DEFAULT_MODEL_REGISTRY_CONFIG;
        }
      } else {
        this.config = DEFAULT_MODEL_REGISTRY_CONFIG;
      }
    }

    // Initialize dynamic candidates from configuration baseline
    for (const model of this.config.models) {
      const billing = ProviderDiscovery.evaluateBillingEligibility(
        model.provider,
        model.model,
        'FREE',
        model.freePolicy
      );

      const candidate: DiscoveredCandidate = {
        id: model.id,
        provider: model.provider,
        model: model.model,
        discoveredAt: Date.now(),
        billing: {
          mode: billing.mode,
          eligible: billing.eligible,
          lastVerifiedAt: Date.now()
        },
        health: {
          status: model.status === 'DEGRADED' ? 'DEGRADED' : 'ONLINE',
          lastCheckedAt: Date.now()
        },
        lifecycle: model.status === 'DEGRADED' ? 'DEGRADED' : (billing.eligible ? 'ELIGIBLE' : 'HEALTHY'),
        capabilities: model.capabilities,
        fallbackConfigs: model.fallbackConfigs,
        enabled: model.enabled,
        freePolicy: model.freePolicy,
        maxCost: model.maxCost
      };

      this.dynamicCandidates.set(model.id, candidate);
      BillingGuard.assertFreeModel(model);
      if (model.fallbackConfigs && Array.isArray(model.fallbackConfigs)) {
        for (const fb of model.fallbackConfigs) {
          BillingGuard.assertFreeModel({
            id: fb.id,
            provider: fb.provider,
            model: fb.model,
            freePolicy: fb.freePolicy,
            maxCost: fb.maxCost,
            enabled: fb.enabled
          });
        }
      }
    }
  }

  /**
   * Registers a newly discovered model candidate at runtime.
   */
  public registerDiscoveredCandidate(candidate: DiscoveredCandidate): void {
    this.dynamicCandidates.set(candidate.id, candidate);
  }

  /**
   * Records a health event (HTTP 200, 404, 429, timeout, etc.) on a candidate.
   */
  public recordHealthEvent(modelId: string, event: HealthCheckEvent): DiscoveredCandidate | undefined {
    const candidate = this.dynamicCandidates.get(modelId);
    if (!candidate) return undefined;

    const updated = ProviderDiscovery.processHealthEvent(candidate, event);
    this.dynamicCandidates.set(modelId, updated);
    return updated;
  }

  /**
   * Records a dynamic billing update on a candidate (FREE, PAID, UNKNOWN, UNAVAILABLE).
   */
  public recordBillingUpdate(modelId: string, newBilling: BillingEligibility): DiscoveredCandidate | undefined {
    const candidate = this.dynamicCandidates.get(modelId);
    if (!candidate) return undefined;

    const updated = ProviderDiscovery.updateBillingState(candidate, newBilling);
    this.dynamicCandidates.set(modelId, updated);
    return updated;
  }

  public getCandidate(modelId: string): DiscoveredCandidate | undefined {
    const candidate = this.dynamicCandidates.get(modelId);
    if (!candidate) return undefined;

    // Check rate limit expiration
    if (candidate.lifecycle === 'RATE_LIMITED' && candidate.health.rateLimitedUntil) {
      if (Date.now() >= candidate.health.rateLimitedUntil) {
        candidate.health.status = 'ONLINE';
        candidate.health.rateLimitedUntil = undefined;
        candidate.health.failureReason = undefined;
        candidate.lifecycle = candidate.billing.eligible ? 'ELIGIBLE' : 'HEALTHY';
        this.dynamicCandidates.set(modelId, candidate);
      }
    }

    return candidate;
  }

  public getAllCandidates(): readonly DiscoveredCandidate[] {
    return Array.from(this.dynamicCandidates.values());
  }

  public getModels(): readonly RegisteredModelConfig[] {
    return this.config.models;
  }

  public getEnabledModels(): readonly RegisteredModelConfig[] {
    return Array.from(this.dynamicCandidates.values())
      .filter(c => c.enabled)
      .map(c => this.toRegisteredModelConfig(c));
  }

  public getModelByProvider(provider: LLMProviderId): RegisteredModelConfig | undefined {
    const candidate = Array.from(this.dynamicCandidates.values()).find(
      c => c.provider === provider && c.enabled
    );
    return candidate ? this.toRegisteredModelConfig(candidate) : undefined;
  }

  public markRateLimited(modelId: string, cooldownMs: number = 60000): void {
    this.recordHealthEvent(modelId, { httpStatus: 429, cooldownMs });
  }

  public markUnavailable(modelId: string): void {
    this.recordHealthEvent(modelId, { httpStatus: 404 });
  }

  public markPaid(modelId: string): void {
    this.recordBillingUpdate(modelId, 'PAID');
  }

  public markActive(modelId: string): void {
    this.recordHealthEvent(modelId, { httpStatus: 200 });
  }

  public getModelStatus(modelId: string): ModelLifecycleStatus {
    const candidate = this.getCandidate(modelId);
    if (!candidate) return 'ACTIVE';

    switch (candidate.lifecycle) {
      case 'ELIGIBLE':
      case 'HEALTHY':
      case 'DISCOVERED':
        return 'ACTIVE';
      case 'RATE_LIMITED':
        return 'RATE_LIMITED';
      case 'DEGRADED':
        return 'DEGRADED';
      case 'PAID':
        return 'PAID';
      case 'UNAVAILABLE':
      case 'RETIRED':
        return 'UNAVAILABLE';
      default:
        return 'ACTIVE';
    }
  }

  /**
   * Task-Based Dynamic Resolver with Strict Multi-Stage Funnel (M28.2):
   * 1. Billing Eligibility (Dynamic check: FREE required; PAID/UNKNOWN fail-closed)
   * 2. Provider Availability (configured API key / mock)
   * 3. Lifecycle Status (ELIGIBLE / HEALTHY vs RATE_LIMITED cooldown vs UNAVAILABLE/PAID)
   * 4. Task Capability Ranking (Interpreter score vs Narrator score)
   * 5. Fallback to Mock if all remote candidates fail
   */
  public resolveModelForTask(task: LLMTask, billingMode: BillingMode = 'free-tier'): RegisteredModelConfig {
    const candidates = Array.from(this.dynamicCandidates.values()).filter(c => c.enabled);

    const eligible = candidates.filter(c => {
      // 1. Dynamic Billing check (FAIL-CLOSED on UNKNOWN and PAID)
      if (c.billing.mode !== 'FREE' || !c.billing.eligible) {
        return false;
      }
      if (billingMode === 'strict' && c.freePolicy !== 'explicit-free') {
        return false;
      }

      // 2. Provider configured
      if (!ModelRegistry.isProviderConfigured(c.provider)) {
        return false;
      }

      // 3. Lifecycle Status check
      const current = this.getCandidate(c.id);
      if (!current) return false;

      if (
        current.lifecycle === 'UNAVAILABLE' ||
        current.lifecycle === 'PAID' ||
        current.lifecycle === 'RETIRED' ||
        current.lifecycle === 'RATE_LIMITED'
      ) {
        return false;
      }

      return current.lifecycle === 'ELIGIBLE' || current.lifecycle === 'HEALTHY';
    });

    const remoteEligible = eligible.filter(c => c.provider !== 'mock');

    if (remoteEligible.length === 0) {
      return this.getMockModel();
    }

    // Sort remote candidates by task-specific score
    remoteEligible.sort((a, b) => {
      const capA = a.capabilities || { interpreterScore: 5, narratorScore: 5, reliabilityScore: 5 };
      const capB = b.capabilities || { interpreterScore: 5, narratorScore: 5, reliabilityScore: 5 };

      const scoreA = task === 'INTERPRET_INTENT'
        ? (capA.interpreterScore * 0.7 + capA.reliabilityScore * 0.3)
        : (capA.narratorScore * 0.7 + capA.reliabilityScore * 0.3);

      const scoreB = task === 'INTERPRET_INTENT'
        ? (capB.interpreterScore * 0.7 + capB.reliabilityScore * 0.3)
        : (capB.narratorScore * 0.7 + capB.reliabilityScore * 0.3);

      return scoreB - scoreA;
    });

    return this.toRegisteredModelConfig(remoteEligible[0]);
  }

  public getMockModel(): RegisteredModelConfig {
    const mock = this.dynamicCandidates.get('mock-deterministic');
    if (mock) {
      return this.toRegisteredModelConfig(mock);
    }
    return {
      id: 'mock-deterministic',
      provider: 'mock',
      model: 'deterministic-local-mock',
      freePolicy: 'explicit-free',
      maxCost: 0,
      enabled: true,
      status: 'ACTIVE'
    };
  }

  private toRegisteredModelConfig(candidate: DiscoveredCandidate): RegisteredModelConfig {
    return {
      id: candidate.id,
      provider: candidate.provider,
      model: candidate.model,
      freePolicy: candidate.freePolicy || (candidate.billing.mode === 'FREE' ? 'free-tier' : 'explicit-free'),
      maxCost: candidate.maxCost ?? 0,
      enabled: candidate.enabled,
      status: this.getModelStatus(candidate.id),
      capabilities: candidate.capabilities,
      fallbackConfigs: candidate.fallbackConfigs
    };
  }

  public static resolveApiKey(provider: LLMProviderId): string | undefined {
    if (typeof process === 'undefined' || !process.env) {
      return undefined;
    }
    switch (provider) {
      case 'gemini':
        return process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY;
      case 'openrouter':
        return process.env.OPENROUTER_API_KEY;
      case 'huggingface':
        return process.env.HUGGINGFACE_API_KEY;
      case 'opencode':
        return process.env.OPENCODE_API_KEY || process.env.OX_ALPHA_API_KEY;
      case 'mock':
        return 'mock-deterministic-key';
      default:
        return undefined;
    }
  }

  public static isProviderConfigured(provider: LLMProviderId): boolean {
    if (provider === 'mock') return true;
    const key = ModelRegistry.resolveApiKey(provider);
    return Boolean(key && key.trim().length > 0);
  }
}

