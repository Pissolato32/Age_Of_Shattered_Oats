import {
  LLMGenerationRequest,
  LLMGenerationResponse,
  ModelConfig
} from '../contracts/LLMContract';
import { BaseLLMAdapter } from './LLMAdapter';
import { BillingGuard } from '../validators/BillingGuard';

export class HuggingFaceAdapter extends BaseLLMAdapter {
  readonly providerId = 'huggingface' as const;
  private readonly baseURL: string;

  constructor(modelConfig: ModelConfig, apiKey?: string, fetchFn?: typeof fetch) {
    super(modelConfig, apiKey, fetchFn);
    this.baseURL = (modelConfig.customBaseURL || 'https://router.huggingface.co/hf-inference/v1').replace(/\/+$/, '');
  }

  async generate(request: LLMGenerationRequest): Promise<LLMGenerationResponse> {
    if (!this.apiKey) {
      throw new Error(`[HuggingFaceAdapter] API key missing for provider huggingface.`);
    }

    const timeoutMs = request.timeoutMs || 30000;
    const fallbackList = this.modelConfig.fallbackConfigs?.map(f => f.model) || this.modelConfig.fallbackModels || [];
    const modelsToTry = [
      this.modelConfig.model,
      ...fallbackList.filter(m => m !== this.modelConfig.model)
    ];

    let lastError: Error | null = null;
    const startTime = Date.now();

    for (const model of modelsToTry) {
      // Pre-call billing assertion on every fallback candidate
      BillingGuard.assertFreeModel({
        id: `hf_${model}`,
        provider: 'huggingface',
        model,
        freePolicy: this.modelConfig.freePolicy,
        maxCost: 0,
        enabled: true
      });

      const url = `${this.baseURL}/chat/completions`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const messages: Array<{ role: string; content: string }> = [];
        if (request.systemPrompt) {
          messages.push({ role: 'system', content: request.systemPrompt });
        }
        messages.push({ role: 'user', content: request.userPrompt });

        const payload: Record<string, unknown> = {
          model,
          messages,
          temperature: typeof request.temperature === 'number' ? request.temperature : 0.7,
          max_tokens: typeof request.maxTokens === 'number' ? request.maxTokens : 1000
        };

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        };

        const res = await this.fetchFn(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        clearTimeout(timer);

        const inferenceProvider = res.headers.get('x-inference-provider') || 'huggingface-serverless';

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`HuggingFace Error (${model} / ${inferenceProvider}): HTTP ${res.status} - ${errText.slice(0, 250)}`);
        }

        const data = await res.json() as {
          choices?: Array<{ message?: { content?: string } }>;
          usage?: {
            prompt_tokens?: number;
            completion_tokens?: number;
            total_tokens?: number;
          };
        };

        const text = data.choices?.[0]?.message?.content;
        if (!text || text.trim().length === 0) {
          throw new Error(`Empty response received from HuggingFace model ${model}`);
        }

        const usage = BillingGuard.buildUsage({
          promptTokens: data.usage?.prompt_tokens,
          completionTokens: data.usage?.completion_tokens,
          totalTokens: data.usage?.total_tokens,
          cost: 0,
          isExplicitFree: false // Track as free-tier unverified cost on serverless
        });

        BillingGuard.assertZeroCost(usage, this.modelConfig);

        const latencyMs = Date.now() - startTime;

        return {
          text: text.trim(),
          usage,
          latencyMs,
          modelId: model,
          providerId: 'huggingface',
          inferenceProvider,
          rawResponse: data
        };
      } catch (err: any) {
        clearTimeout(timer);
        lastError = err;
        continue;
      }
    }

    throw lastError || new Error(`[HuggingFaceAdapter] All model attempts failed.`);
  }
}
