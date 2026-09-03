import {
  LLMGenerationRequest,
  LLMGenerationResponse,
  ModelConfig
} from '../contracts/LLMContract';
import { BaseLLMAdapter } from './LLMAdapter';
import { BillingGuard } from '../validators/BillingGuard';

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

export class GroqAdapter extends BaseLLMAdapter {
  readonly providerId = 'groq' as const;

  constructor(modelConfig: ModelConfig, apiKey?: string, fetchFn?: typeof fetch) {
    super(modelConfig, apiKey, fetchFn);
  }

  async generate(request: LLMGenerationRequest): Promise<LLMGenerationResponse> {
    if (!this.apiKey) {
      throw new Error(`[GroqAdapter] API key missing for provider groq.`);
    }

    const timeoutMs = request.timeoutMs || 25000;
    const fallbackList = this.modelConfig.fallbackConfigs?.map(f => f.model) || this.modelConfig.fallbackModels || [];
    const modelsToTry = [
      this.modelConfig.model,
      ...fallbackList.filter(m => m !== this.modelConfig.model)
    ];

    let lastError: Error | null = null;
    const startTime = Date.now();

    for (const model of modelsToTry) {
      const url = `${GROQ_BASE_URL}/chat/completions`;
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
          max_tokens: typeof request.maxTokens === 'number' ? request.maxTokens : 1024
        };

        if (request.responseFormat === 'json') {
          payload.response_format = { type: 'json_object' };
        }

        const res = await this.fetchFn(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        clearTimeout(timer);

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Groq Error (${model}): HTTP ${res.status} - ${errText.slice(0, 250)}`);
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
          throw new Error(`Empty response received from Groq model ${model}`);
        }

        const usage = BillingGuard.buildUsage({
          promptTokens: data.usage?.prompt_tokens,
          completionTokens: data.usage?.completion_tokens,
          totalTokens: data.usage?.total_tokens,
          cost: 0,
          isExplicitFree: true
        });

        BillingGuard.assertZeroCost(usage, this.modelConfig);

        const latencyMs = Date.now() - startTime;

        return {
          text: text.trim(),
          usage,
          latencyMs,
          modelId: model,
          providerId: 'groq',
          rawResponse: data
        };
      } catch (err: unknown) {
        clearTimeout(timer);
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }

    throw lastError || new Error(`[GroqAdapter] Failed across all candidate models`);
  }
}
