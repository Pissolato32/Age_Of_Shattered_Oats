import {
  LLMGenerationRequest,
  LLMGenerationResponse,
  ModelConfig
} from '../contracts/LLMContract';
import { BaseLLMAdapter } from './LLMAdapter';
import { BillingGuard } from '../validators/BillingGuard';

export class OpenRouterAdapter extends BaseLLMAdapter {
  readonly providerId = 'openrouter' as const;
  private readonly baseURL: string;

  constructor(modelConfig: ModelConfig, apiKey?: string, fetchFn?: typeof fetch) {
    super(modelConfig, apiKey, fetchFn);
    this.baseURL = (modelConfig.customBaseURL || 'https://openrouter.ai/api/v1').replace(/\/+$/, '');
  }

  async generate(request: LLMGenerationRequest): Promise<LLMGenerationResponse> {
    if (!this.apiKey) {
      throw new Error(`[OpenRouterAdapter] API key missing for provider openrouter.`);
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
      // Strict check: OpenRouter model must end with :free
      if (!model.endsWith(':free')) {
        throw new Error(`[OpenRouterAdapter] Paid model blocked: ${model}. Expected ':free' suffix.`);
      }

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

        if (request.responseFormat === 'json') {
          payload.response_format = { type: 'json_object' };
        }

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'https://github.com/Pissolato32/Age_Of_Shattered_Oats',
          'X-Title': 'Age of Shattered Oaths LLM Benchmark'
        };

        const res = await this.fetchFn(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        clearTimeout(timer);

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`OpenRouter Error (${model}): HTTP ${res.status} - ${errText.slice(0, 250)}`);
        }

        const data = await res.json() as {
          choices?: Array<{ message?: { content?: string } }>;
          usage?: {
            prompt_tokens?: number;
            completion_tokens?: number;
            total_tokens?: number;
            cost?: number;
            total_cost?: number;
          };
        };

        const text = data.choices?.[0]?.message?.content;
        if (!text || text.trim().length === 0) {
          throw new Error(`Empty response received from OpenRouter model ${model}`);
        }

        const reportedCost = data.usage?.cost ?? data.usage?.total_cost ?? 0;
        const usage = BillingGuard.buildUsage({
          promptTokens: data.usage?.prompt_tokens,
          completionTokens: data.usage?.completion_tokens,
          totalTokens: data.usage?.total_tokens,
          cost: reportedCost,
          isExplicitFree: true
        });

        BillingGuard.assertZeroCost(usage, this.modelConfig);

        const latencyMs = Date.now() - startTime;

        return {
          text: text.trim(),
          usage,
          latencyMs,
          modelId: model,
          providerId: 'openrouter',
          rawResponse: data
        };
      } catch (err: any) {
        clearTimeout(timer);
        lastError = err;
      }
    }

    throw lastError || new Error(`[OpenRouterAdapter] Failed across all candidate models`);
  }
}
