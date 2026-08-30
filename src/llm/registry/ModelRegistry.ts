import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { ModelConfig, ModelRegistryConfig, LLMProviderId } from '../contracts/LLMContract';
import { BillingGuard } from '../validators/BillingGuard';

export const DEFAULT_MODEL_REGISTRY_CONFIG: ModelRegistryConfig = {
  version: '1.0.0',
  description: 'Default Free Model Registry for Age of Shattered Oaths LLM Benchmark',
  models: [
    {
      id: 'gemini-flash-lite',
      provider: 'gemini',
      model: 'gemini-flash-lite-latest',
      freePolicy: 'free-tier',
      maxCost: 0,
      enabled: true,
      fallbackModels: ['gemini-3.5-flash', 'gemini-3.6-flash']
    },
    {
      id: 'openrouter-llama-3.3-70b',
      provider: 'openrouter',
      model: 'meta-llama/llama-3.3-70b-instruct:free',
      freePolicy: 'explicit-free',
      maxCost: 0,
      enabled: true,
      fallbackModels: [
        'google/gemini-2.0-flash-exp:free',
        'mistralai/mistral-small-24b-instruct-2501:free',
        'qwen/qwen-2.5-72b-instruct:free'
      ]
    },
    {
      id: 'huggingface-llama-3.3-70b',
      provider: 'huggingface',
      model: 'meta-llama/Llama-3.3-70B-Instruct',
      freePolicy: 'free-tier',
      maxCost: 0,
      enabled: true,
      fallbackModels: [
        'Qwen/Qwen2.5-72B-Instruct',
        'mistralai/Mistral-7B-Instruct-v0.3',
        'google/gemma-2-27b-it'
      ]
    },
    {
      id: 'opencode-zen-deepseek',
      provider: 'opencode',
      model: 'deepseek-v4-flash-free',
      freePolicy: 'free-tier',
      maxCost: 0,
      enabled: true,
      fallbackModels: [
        'nemotron-3.5-lightning-free',
        'nemotron-3-ultra-free',
        'mimo-v2.5-free'
      ]
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

    // Validate all registered models on initialization
    for (const model of this.config.models) {
      BillingGuard.assertFreeModel(model);
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
