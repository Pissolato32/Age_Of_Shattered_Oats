import {
  LLMGenerationRequest,
  LLMGenerationResponse,
  ModelConfig
} from '../contracts/LLMContract';
import { BaseLLMAdapter } from './LLMAdapter';
import { BillingGuard } from '../validators/BillingGuard';

export class GeminiAdapter extends BaseLLMAdapter {
  readonly providerId = 'gemini' as const;

  async generate(request: LLMGenerationRequest): Promise<LLMGenerationResponse> {
    if (!this.apiKey) {
      throw new Error(`[GeminiAdapter] API key missing for provider gemini.`);
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
      const keyParam = `?key=${encodeURIComponent(this.apiKey)}`;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent${keyParam}`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const payload: Record<string, unknown> = {
          contents: [
            {
              role: 'user',
              parts: [{ text: request.userPrompt }]
            }
          ]
        };

        if (request.systemPrompt) {
          payload.systemInstruction = {
            parts: [{ text: request.systemPrompt }]
          };
        }

        const generationConfig: Record<string, unknown> = {
          thinkingConfig: {
            thinkingBudget: 0
          }
        };
        if (typeof request.temperature === 'number') {
          generationConfig.temperature = request.temperature;
        }
        if (typeof request.maxTokens === 'number') {
          generationConfig.maxOutputTokens = Math.max(request.maxTokens, 350);
        }
        if (request.responseFormat === 'json') {
          generationConfig.responseMimeType = 'application/json';
        }
        if (Object.keys(generationConfig).length > 0) {
          payload.generationConfig = generationConfig;
        }

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey
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
          throw new Error(`Gemini API Error (${model}): HTTP ${res.status} - ${errText.slice(0, 250)}`);
        }

        const data = await res.json() as {
          candidates?: Array<{
            content?: {
              parts?: Array<{ text?: string }>;
            };
          }>;
          usageMetadata?: {
            promptTokenCount?: number;
            candidatesTokenCount?: number;
            totalTokenCount?: number;
          };
        };

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text || text.trim().length === 0) {
          throw new Error(`Empty response received from Gemini model ${model}`);
        }

        const usage = BillingGuard.buildUsage({
          promptTokens: data.usageMetadata?.promptTokenCount,
          completionTokens: data.usageMetadata?.candidatesTokenCount,
          totalTokens: data.usageMetadata?.totalTokenCount,
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
          providerId: 'gemini',
          rawResponse: data
        };
      } catch (err: any) {
        clearTimeout(timer);
        lastError = err;
      }
    }

    throw lastError || new Error(`[GeminiAdapter] Failed across all candidate models`);
  }
}
