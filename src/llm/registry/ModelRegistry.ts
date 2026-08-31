import * as fs from 'fs';
import * as path from 'path';
import { ModelConfig, LLMProviderId, FallbackModelConfig } from '../contracts/LLMContract';
import { BillingGuard, BillingMode } from '../validators/BillingGuard';

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
  private readonly runtimeStatus: Map<string, { status: ModelLifecycleStatus; rateLimitedUntil?: number }> = new Map();

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

    // Initialize runtime status and validate models
    for (const model of this.config.models) {
      this.runtimeStatus.set(model.id, { status: model.status || 'ACTIVE' });
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

  public getModels(): readonly RegisteredModelConfig[] {
    return this.config.models;
  }

  public getEnabledModels(): readonly RegisteredModelConfig[] {
    return this.config.models.filter(m => m.enabled);
  }

  public getModelByProvider(provider: LLMProviderId): RegisteredModelConfig | undefined {
    return this.config.models.find(m => m.provider === provider && m.enabled);
  }

  public markRateLimited(modelId: string, cooldownMs: number = 60000): void {
    const entry = this.runtimeStatus.get(modelId) || { status: 'ACTIVE' };
    entry.status = 'RATE_LIMITED';
    entry.rateLimitedUntil = Date.now() + cooldownMs;
    this.runtimeStatus.set(modelId, entry);
  }

  public markUnavailable(modelId: string): void {
    const entry = this.runtimeStatus.get(modelId) || { status: 'ACTIVE' };
    entry.status = 'UNAVAILABLE';
    this.runtimeStatus.set(modelId, entry);
  }

  public markPaid(modelId: string): void {
    const entry = this.runtimeStatus.get(modelId) || { status: 'ACTIVE' };
    entry.status = 'PAID';
    this.runtimeStatus.set(modelId, entry);
  }

  public markActive(modelId: string): void {
    const entry = this.runtimeStatus.get(modelId) || { status: 'ACTIVE' };
    entry.status = 'ACTIVE';
    entry.rateLimitedUntil = undefined;
    this.runtimeStatus.set(modelId, entry);
  }

  public getModelStatus(modelId: string): ModelLifecycleStatus {
    const entry = this.runtimeStatus.get(modelId);
    if (!entry) return 'ACTIVE';

    if (entry.status === 'RATE_LIMITED' && entry.rateLimitedUntil) {
      if (Date.now() >= entry.rateLimitedUntil) {
        entry.status = 'ACTIVE';
        entry.rateLimitedUntil = undefined;
      }
    }
    return entry.status;
  }

  /**
   * Task-Based Dynamic Resolver with Strict Multi-Stage Funnel:
   * 1. Billing Eligibility (assertFreeModel / strict check)
   * 2. Provider Availability (configured API key)
   * 3. Lifecycle Status (ACTIVE vs RATE_LIMITED cooldown vs UNAVAILABLE/PAID)
   * 4. Task Capability Ranking (Interpreter score vs Narrator score)
   * 5. Fallback to Mock if all remote models fail
   */
  public resolveModelForTask(task: LLMTask, billingMode: BillingMode = 'free-tier'): RegisteredModelConfig {
    const candidates = this.config.models.filter(m => m.enabled);

    const eligible = candidates.filter(m => {
      // 1. Billing check
      if (billingMode === 'strict' && m.freePolicy !== 'explicit-free') {
        return false;
      }
      // 2. Provider configured
      if (!ModelRegistry.isProviderConfigured(m.provider)) {
        return false;
      }
      // 3. Status check
      const status = this.getModelStatus(m.id);
      if (status === 'UNAVAILABLE' || status === 'PAID' || status === 'RETIRED') {
        return false;
      }
      if (status === 'RATE_LIMITED') {
        return false;
      }
      return true;
    });

    const remoteEligible = eligible.filter(m => m.provider !== 'mock');

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

    return remoteEligible[0];
  }

  public getMockModel(): RegisteredModelConfig {
    const mock = this.config.models.find(m => m.provider === 'mock');
    return mock || {
      id: 'mock-deterministic',
      provider: 'mock',
      model: 'deterministic-local-mock',
      freePolicy: 'explicit-free',
      maxCost: 0,
      enabled: true,
      status: 'ACTIVE'
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
