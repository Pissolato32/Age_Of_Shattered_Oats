import {
  LLMGenerationRequest,
  LLMGenerationResponse,
  ModelConfig,
  LLMProviderId
} from '../contracts/LLMContract';
import { BillingGuard } from '../validators/BillingGuard';

export interface LLMAdapter {
  readonly providerId: LLMProviderId;
  readonly modelConfig: ModelConfig;
  generate(request: LLMGenerationRequest): Promise<LLMGenerationResponse>;
}

export abstract class BaseLLMAdapter implements LLMAdapter {
  abstract readonly providerId: LLMProviderId;
  readonly modelConfig: ModelConfig;
  protected readonly apiKey?: string;
  protected readonly fetchFn: typeof fetch;

  constructor(modelConfig: ModelConfig, apiKey?: string, fetchFn?: typeof fetch) {
    BillingGuard.assertFreeModel(modelConfig);
    this.modelConfig = modelConfig;
    this.apiKey = apiKey;
    this.fetchFn = fetchFn || (typeof fetch !== 'undefined' ? fetch : (undefined as never));
  }

  abstract generate(request: LLMGenerationRequest): Promise<LLMGenerationResponse>;

  protected extractJson(rawText: string): string {
    let text = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      text = text.substring(firstBrace, lastBrace + 1);
    }
    return text;
  }
}
