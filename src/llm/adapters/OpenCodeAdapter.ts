import {
  LLMGenerationRequest,
  LLMGenerationResponse,
  ModelConfig
} from '../contracts/LLMContract';
import { BaseLLMAdapter } from './LLMAdapter';
import { BillingGuard } from '../validators/BillingGuard';

export class OpenCodeAdapter extends BaseLLMAdapter {
  readonly providerId = 'opencode' as const;
  private readonly baseURL: string;

  constructor(modelConfig: ModelConfig, apiKey?: string, fetchFn?: typeof fetch) {
    super(modelConfig, apiKey, fetchFn);
    this.baseURL = (modelConfig.customBaseURL || 'https://opencode.ai/zen/v1').replace(/\/+$/, '');
  }

  async generate(request: LLMGenerationRequest): Promise<LLMGenerationResponse> {
    if (!this.apiKey) {
      throw new Error(`[OpenCodeAdapter] API key missing for provider opencode.`);
    }

    const timeoutMs = request.timeoutMs || 30000;
    const modelsToTry = [
      this.modelConfig.model,
      ...(this.modelConfig.fallbackModels || []).filter(m => m !== this.modelConfig.model)
    ];

    let lastError: Error | null = null;
    const startTime = Date.now();

    for (const model of modelsToTry) {
      // Pre-call billing assertion on every candidate fallback model
      BillingGuard.assertFreeModel({
        id: `opencode_${model}`,
        provider: 'opencode',
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

        if (request.responseFormat === 'json') {
          payload.response_format = { type: 'json_object' };
        }

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

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`OpenCode Error (${model}): HTTP ${res.status} - ${errText.slice(0, 250)}`);
        }

        const data = await res.json() as {
          choices?: Array<{ message?: { content?: string } }>;
          model?: string;
          usage?: {
            prompt_tokens?: number;
            completion_tokens?: number;
            total_tokens?: number;
          };
        };

        const text = data.choices?.[0]?.message?.content;
        if (!text || text.trim().length === 0) {
          throw new Error(`Empty response received from OpenCode model ${model}`);
        }

        // OpenCode models ending with -free are verified zero cost
        const isExplicitFree = model.endsWith('-free');

        const usage = BillingGuard.buildUsage({
          promptTokens: data.usage?.prompt_tokens,
          completionTokens: data.usage?.completion_tokens,
          totalTokens: data.usage?.total_tokens,
          cost: 0,
          isExplicitFree
        });

        BillingGuard.assertZeroCost(usage, this.modelConfig);

        const latencyMs = Date.now() - startTime;

        return {
          text: text.trim(),
          usage,
          latencyMs,
          modelId: model,
          providerId: 'opencode',
          rawResponse: data
        };
      } catch (err: any) {
        clearTimeout(timer);
        lastError = err;
        continue;
      }
    }

    throw lastError || new Error(`[OpenCodeAdapter] All model attempts failed.`);
  }
}
