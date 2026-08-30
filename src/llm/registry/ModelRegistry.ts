import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { ModelConfig, ModelRegistryConfig, LLMProviderId } from '../contracts/LLMContract';
import { BillingGuard } from '../validators/BillingGuard';

export const DEFAULT_MODEL_REGISTRY_CONFIG: ModelRegistryConfig = {
  version: '1.2.0',
  description: 'Default Free Model Registry for Age of Shattered Oaths LLM Benchmark',
  models: [
    {
      id: 'gemini-flash-lite',
      provider: 'gemini',
      model: 'gemini-flash-lite-latest',
      freePolicy: 'free-tier',
      maxCost: 0,
      enabled: true,
      fallbackConfigs: [
        { id: 'gemini-2.0-flash-fb', provider: 'gemini', model: 'gemini-2.0-flash', freePolicy: 'free-tier', maxCost: 0, enabled: true },
        { id: 'gemini-1.5-flash-fb', provider: 'gemini', model: 'gemini-1.5-flash', freePolicy: 'free-tier', maxCost: 0, enabled: true },
        { id: 'gemini-1.5-flash-8b-fb', provider: 'gemini', model: 'gemini-1.5-flash-8b', freePolicy: 'free-tier', maxCost: 0, enabled: true },
        { id: 'gemini-2.5-flash-fb', provider: 'gemini', model: 'gemini-2.5-flash', freePolicy: 'free-tier', maxCost: 0, enabled: true }
      ]
    },
    {
      id: 'openrouter-free-default',
      provider: 'openrouter',
      model: 'google/gemma-4-31b-it:free',
      freePolicy: 'explicit-free',
      maxCost: 0,
      enabled: true,
      fallbackConfigs: [
        { id: 'openrouter-gemma-26b-fb', provider: 'openrouter', model: 'google/gemma-4-26b-a4b-it:free', freePolicy: 'explicit-free', maxCost: 0, enabled: true },
        { id: 'openrouter-nemotron-3.5-fb', provider: 'openrouter', model: 'nvidia/nemotron-3.5-lightning:free', freePolicy: 'explicit-free', maxCost: 0, enabled: true },
        { id: 'openrouter-nemotron-3-nano-fb', provider: 'openrouter', model: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free', freePolicy: 'explicit-free', maxCost: 0, enabled: true },
        { id: 'openrouter-glm-fb', provider: 'openrouter', model: 'z-ai/glm-5.2:free', freePolicy: 'explicit-free', maxCost: 0, enabled: true },
        { id: 'openrouter-minimax-m3-fb', provider: 'openrouter', model: 'minimax/minimax-m3:free', freePolicy: 'explicit-free', maxCost: 0, enabled: true },
        { id: 'openrouter-minimax-m2.7-fb', provider: 'openrouter', model: 'minimax/minimax-m2.7:free', freePolicy: 'explicit-free', maxCost: 0, enabled: true },
        { id: 'openrouter-liquid-fb', provider: 'openrouter', model: 'liquid/lfm-2.5-2.6b:free', freePolicy: 'explicit-free', maxCost: 0, enabled: true },
        { id: 'openrouter-ling-fb', provider: 'openrouter', model: 'inclusionai/ling-3.0-flash-fin:free', freePolicy: 'explicit-free', maxCost: 0, enabled: true }
      ]
    },
    {
      id: 'opencode-zen-default',
      provider: 'opencode',
      model: 'nemotron-3.5-lightning-free',
      freePolicy: 'free-tier',
      maxCost: 0,
      enabled: true,
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
      enabled: true
    }
  ]
};

export class ModelRegistry {
  private readonly config: ModelRegistryConfig;

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

    // Validate all registered models AND fallback models on initialization
    for (const model of this.config.models) {
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
      } else if (model.fallbackModels && Array.isArray(model.fallbackModels)) {
        for (const fbModel of model.fallbackModels) {
          BillingGuard.assertFreeModel({
            id: `${model.id}_fallback_${fbModel}`,
            provider: model.provider,
            model: fbModel,
            freePolicy: model.freePolicy,
            maxCost: 0,
            enabled: true
          });
        }
      }
    }
  }

  public getModels(): readonly ModelConfig[] {
    return this.config.models;
  }

  public getEnabledModels(): readonly ModelConfig[] {
    return this.config.models.filter(m => m.enabled);
  }

  public getModelByProvider(provider: LLMProviderId): ModelConfig | undefined {
    return this.config.models.find(m => m.provider === provider && m.enabled);
  }

  public static resolveApiKey(provider: LLMProviderId): string | undefined {
    if (typeof process === 'undefined' || !process.env) {
      return undefined;
    }
    switch (provider) {
      case 'gemini':
        return process.env.GEMINI_API_KEY;
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
