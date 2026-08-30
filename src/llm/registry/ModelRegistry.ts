import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { ModelConfig, ModelRegistryConfig, LLMProviderId } from '../contracts/LLMContract';
import { BillingGuard } from '../validators/BillingGuard';

export const DEFAULT_MODEL_REGISTRY_CONFIG: ModelRegistryConfig = {
  version: '1.1.0',
  description: 'Default Free Model Registry for Age of Shattered Oaths LLM Benchmark',
  models: [
    {
      id: 'gemini-flash-lite',
      provider: 'gemini',
      model: 'gemini-flash-lite-latest',
      freePolicy: 'free-tier',
      maxCost: 0,
      enabled: true,
      fallbackModels: ['gemini-1.5-flash-latest', 'gemini-2.5-flash']
    },
    {
      id: 'openrouter-free-default',
      provider: 'openrouter',
      model: 'deepseek/deepseek-r1:free',
      freePolicy: 'explicit-free',
      maxCost: 0,
      enabled: true,
      fallbackModels: [
        'meta-llama/llama-3.3-70b-instruct:free',
        'meta-llama/llama-3.2-3b-instruct:free',
        'mistralai/mistral-7b-instruct:free',
        'google/gemini-2.0-flash-exp:free'
      ]
    },
    {
      id: 'huggingface-free-default',
      provider: 'huggingface',
      model: 'Qwen/Qwen2.5-72B-Instruct',
      freePolicy: 'free-tier',
      maxCost: 0,
      enabled: true,
      fallbackModels: [
        'Qwen/Qwen2.5-Coder-32B-Instruct',
        'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B',
        'mistralai/Mistral-7B-Instruct-v0.3',
        'meta-llama/Llama-3.2-3B-Instruct'
      ]
    },
    {
      id: 'opencode-zen-default',
      provider: 'opencode',
      model: 'mimo-v2.5-free',
      freePolicy: 'free-tier',
      maxCost: 0,
      enabled: true,
      fallbackModels: [
        'nemotron-3.5-lightning-free',
        'nemotron-3-ultra-free',
        'hy3-free',
        'ling-3.0-flash-fin-free'
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

    // Validate all registered models AND fallback models on initialization
    for (const model of this.config.models) {
      BillingGuard.assertFreeModel(model);
      if (model.fallbackModels && Array.isArray(model.fallbackModels)) {
        for (const fb of model.fallbackModels) {
          BillingGuard.assertFreeModel({
            id: `${model.id}_fallback_${fb}`,
            provider: model.provider,
            model: fb,
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
