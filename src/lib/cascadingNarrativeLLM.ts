import { NarrativeLLM, InterpretInput } from './narrativeLLM';
import { NarrativeContext, NarrativeCommand } from './narrativeContracts';
import {
  IncidentNarrativeRequest,
  IncidentNarrativeResponse
} from '../domain/events/narrative/IncidentNarrativeContracts';
import { UnifiedNarrativeLLM } from '../llm/adapters/UnifiedNarrativeLLM';
import { MockNarrativeLLM } from './mockNarrativeLLM';

export interface CascadingProvidersConfig {
  readonly geminiApiKey?: string;
  readonly openCodeApiKey?: string;
  readonly openRouterApiKey?: string;
  readonly openCodeBaseURL?: string;
  readonly openRouterBaseURL?: string;
}

/**
 * Cascading Multi-Provider Narrative LLM
 * Chains strictly 100% FREE / Free-Tier providers in canonical order using UnifiedNarrativeLLM:
 * 1. Gemini Flash Free Tier (Primary Online)
 * 2. OpenCode Zen Free (Secondary Online)
 * 3. OpenRouter Free (:free models) (Final Online Fallback)
 * 4. Procedural Fallback (Deterministic Local Engine / Mock)
 */
export class CascadingNarrativeLLM implements NarrativeLLM {
  readonly providerId = 'cascading-free-tier';
  readonly modelId = 'multi-provider-free-cascade';
  private readonly providers: NarrativeLLM[] = [];

  constructor(config: CascadingProvidersConfig = {}) {
    const geminiKey = config.geminiApiKey || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined);
    const openCodeKey = config.openCodeApiKey || (typeof process !== 'undefined' ? process.env?.OPENCODE_API_KEY || process.env?.OX_ALPHA_API_KEY : undefined);
    const openRouterKey = config.openRouterApiKey || (typeof process !== 'undefined' ? process.env?.OPENROUTER_API_KEY : undefined);

    // 1. Primary: Gemini Free Tier
    if (geminiKey && geminiKey !== 'MY_GEMINI_API_KEY' && geminiKey !== 'SUA_CHAVE_AQUI' && geminiKey.trim().length >= 15) {
      try {
        this.providers.push(new UnifiedNarrativeLLM({
          provider: 'gemini',
          apiKey: geminiKey.trim()
        }));
      } catch (err) {
        console.warn('[CascadingNarrativeLLM] Falha ao registrar Gemini:', err);
      }
    }

    // 2. Secondary: OpenCode Zen Free
    if (openCodeKey && openCodeKey !== 'SUA_CHAVE_AQUI' && openCodeKey.trim().length >= 10) {
      try {
        this.providers.push(new UnifiedNarrativeLLM({
          provider: 'opencode',
          apiKey: openCodeKey.trim()
        }));
      } catch (err) {
        console.warn('[CascadingNarrativeLLM] Falha ao registrar OpenCode:', err);
      }
    }

    // 3. Final Online Fallback: OpenRouter :free
    if (openRouterKey && openRouterKey !== 'SUA_CHAVE_AQUI' && openRouterKey.trim().length >= 15) {
      try {
        this.providers.push(new UnifiedNarrativeLLM({
          provider: 'openrouter',
          apiKey: openRouterKey.trim()
        }));
      } catch (err) {
        console.warn('[CascadingNarrativeLLM] Falha ao registrar OpenRouter:', err);
      }
    }

    // 4. Always append deterministic local fallback
    this.providers.push(new UnifiedNarrativeLLM({ provider: 'mock' }));
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
