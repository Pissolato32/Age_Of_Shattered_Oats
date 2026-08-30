import { NarrativeLLM, InterpretInput } from './narrativeLLM';
import { NarrativeContext, NarrativeCommand } from './narrativeContracts';
import {
  IncidentNarrativeRequest,
  IncidentNarrativeResponse
} from '../domain/events/narrative/IncidentNarrativeContracts';
import { OpenCodeNarrativeLLM } from './openCodeNarrativeLLM';
import { OpenRouterNarrativeLLM } from './openRouterNarrativeLLM';
import { GeminiNarrativeLLM } from './geminiNarrativeLLM';
import { HuggingFaceNarrativeLLM } from './huggingFaceNarrativeLLM';
import { MockNarrativeLLM } from './mockNarrativeLLM';

export interface CascadingProvidersConfig {
  readonly openCodeApiKey?: string;
  readonly openRouterApiKey?: string;
  readonly geminiApiKey?: string;
  readonly huggingFaceApiKey?: string;
  readonly openCodeBaseURL?: string;
  readonly openRouterBaseURL?: string;
  readonly huggingFaceBaseURL?: string;
}

/**
 * Cascading Multi-Provider Narrative LLM
 * Chains strictly 100% FREE / Free-Tier providers in order:
 * 1. OpenCode Zen Free (deepseek-v4-flash-free, nemotron, etc.)
 * 2. OpenRouter Free (:free models: Llama-3.3-70b:free, Gemini-2.0-flash:free, DeepSeek-R1:free)
 * 3. Gemini Flash Free Tier (gemini-flash-lite-latest, gemini-3.6-flash, gemini-3.5-flash)
 * 4. Hugging Face Inference Free Tier (Llama-3.3-70B-Instruct, Qwen2.5-72B, etc.)
 * 5. Procedural Fallback (Deterministic Local Engine)
 */
export class CascadingNarrativeLLM implements NarrativeLLM {
  readonly providerId = 'cascading-free-tier';
  readonly modelId = 'multi-provider-free-cascade';
  private readonly providers: NarrativeLLM[] = [];

  constructor(config: CascadingProvidersConfig = {}) {
    const openCodeKey = config.openCodeApiKey || (typeof process !== 'undefined' ? process.env?.OPENCODE_API_KEY || process.env?.OX_ALPHA_API_KEY : undefined);
    const openRouterKey = config.openRouterApiKey || (typeof process !== 'undefined' ? process.env?.OPENROUTER_API_KEY : undefined);
    const geminiKey = config.geminiApiKey || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined);
    const hfKey = config.huggingFaceApiKey || (typeof process !== 'undefined' ? process.env?.HUGGINGFACE_API_KEY || process.env?.HF_TOKEN || process.env?.HF_API_KEY : undefined);

    if (openCodeKey && openCodeKey !== 'SUA_CHAVE_AQUI' && openCodeKey.trim().length >= 10) {
      this.providers.push(new OpenCodeNarrativeLLM({
        apiKey: openCodeKey.trim(),
        baseURL: config.openCodeBaseURL
      }));
    }

    if (openRouterKey && openRouterKey !== 'SUA_CHAVE_AQUI' && openRouterKey.trim().length >= 15) {
      this.providers.push(new OpenRouterNarrativeLLM({
        apiKey: openRouterKey.trim(),
        baseURL: config.openRouterBaseURL
      }));
    }

    if (geminiKey && geminiKey !== 'MY_GEMINI_API_KEY' && geminiKey !== 'SUA_CHAVE_AQUI' && geminiKey.trim().length >= 15) {
      this.providers.push(new GeminiNarrativeLLM({
        apiKey: geminiKey.trim()
      }));
    }

    if (hfKey && hfKey !== 'SUA_CHAVE_AQUI' && hfKey.trim().length >= 10) {
      this.providers.push(new HuggingFaceNarrativeLLM({
        apiKey: hfKey.trim(),
        baseURL: config.huggingFaceBaseURL
      }));
    }

    // Always append deterministic local fallback
    this.providers.push(new MockNarrativeLLM());
  }

  async interpret(input: InterpretInput): Promise<NarrativeCommand> {
    for (const provider of this.providers) {
      try {
        console.log(`[CascadingNarrativeLLM.interpret] Tentando com provedor gratuito: ${provider.providerId} (${provider.modelId})...`);
        const cmd = await provider.interpret(input);
        if (cmd && cmd.action !== 'UNKNOWN') {
          return cmd;
        }
      } catch (err: any) {
        console.warn(`[CascadingNarrativeLLM.interpret] Provedor ${provider.providerId} falhou, passando para o próximo:`, err?.message || err);
      }
    }

    const mock = new MockNarrativeLLM();
    return mock.interpret(input);
  }

  async narrate(context: NarrativeContext): Promise<string> {
    for (const provider of this.providers) {
      try {
        console.log(`[CascadingNarrativeLLM.narrate] Solicitando narrativa ao provedor gratuito: ${provider.providerId} (${provider.modelId})...`);
        const result = await provider.narrate(context);
        if (result && result.trim().length > 0) {
          return result;
        }
      } catch (err: any) {
        console.warn(`[CascadingNarrativeLLM.narrate] Provedor ${provider.providerId} falhou, passando para o próximo:`, err?.message || err);
      }
    }

    const mock = new MockNarrativeLLM();
    return mock.narrate(context);
  }

  async narrateIncident(request: IncidentNarrativeRequest): Promise<IncidentNarrativeResponse> {
    for (const provider of this.providers) {
      try {
        if (provider.narrateIncident) {
          const result = await provider.narrateIncident(request);
          if (result && result.narration) {
            return result;
          }
        }
      } catch (err: any) {
        console.warn(`[CascadingNarrativeLLM.narrateIncident] Provedor ${provider.providerId} falhou:`, err?.message || err);
      }
    }

    const mock = new MockNarrativeLLM();
    return mock.narrateIncident(request);
  }
}
