import { NarrativeLLM, InterpretInput } from '../../lib/narrativeLLM';
import { NarrativeCommand, NarrativeContext } from '../../lib/narrativeContracts';
import { toNarrativeProjection } from '../../lib/narrativeProjection';
import { LLMAdapter } from './LLMAdapter';
import { GeminiAdapter } from './GeminiAdapter';
import { OpenRouterAdapter } from './OpenRouterAdapter';
import { HuggingFaceAdapter } from './HuggingFaceAdapter';
import { OpenCodeAdapter } from './OpenCodeAdapter';
import { MockAdapter } from './MockAdapter';
import { ModelRegistry } from '../registry/ModelRegistry';
import { ModelConfig, LLMProviderId } from '../contracts/LLMContract';
import { BillingGuard, BillingGuardError, BillingMode } from '../validators/BillingGuard';
import { SemanticValidator } from '../validators/SemanticValidator';
import { NarrativeJudge } from '../validators/NarrativeJudge';
import { NarrativeReportSanitizer } from '../contracts/NarrativeExecutionReport';

export interface UnifiedNarrativeLLMOptions {
  provider: LLMProviderId;
  apiKey?: string;
  modelConfig?: ModelConfig;
  billingMode?: BillingMode;
}

export class UnifiedNarrativeLLM implements NarrativeLLM {
  readonly providerId: string;
  readonly modelId: string;
  private readonly adapter: LLMAdapter;
  private readonly billingMode: BillingMode;

  constructor(options: UnifiedNarrativeLLMOptions) {
    this.providerId = options.provider;
    this.billingMode = options.billingMode || 'free-tier';

    const registry = new ModelRegistry();
    const config = options.modelConfig || registry.getModelByProvider(options.provider);

    if (!config) {
      throw new BillingGuardError(
        `Provider or model '${options.provider}' not registered in ModelRegistry and no valid modelConfig was supplied`,
        options.provider,
        'unregistered'
      );
    }

    this.modelId = config.model;

    BillingGuard.assertFreeModel(config, this.billingMode);

    const apiKey = options.apiKey || ModelRegistry.resolveApiKey(options.provider);

    switch (options.provider) {
      case 'gemini':
        this.adapter = new GeminiAdapter(config, apiKey);
        break;
      case 'openrouter':
        this.adapter = new OpenRouterAdapter(config, apiKey);
        break;
      case 'huggingface':
        this.adapter = new HuggingFaceAdapter(config, apiKey);
        break;
      case 'opencode':
        this.adapter = new OpenCodeAdapter(config, apiKey);
        break;
      case 'mock':
      default:
        this.adapter = new MockAdapter(config);
        break;
    }
  }

  async interpret(input: InterpretInput): Promise<NarrativeCommand> {
    const prompt = `Analise a entrada do jogador abaixo e retorne o JSON de intenção:\n\n<PLAYER_INPUT>\n${input.playerInput}\n</PLAYER_INPUT>`;

    const response = await this.adapter.generate({
      systemPrompt: `Você é o Classificador de Intenções de Age of Shattered Oaths. Responda APENAS com JSON estruturado contendo 'action', 'targetId', 'objectId', 'locationId', 'magnitude', 'stance', 'confidence', 'requiresClarification', 'ambiguity'.`,
      userPrompt: prompt,
      temperature: 0.0,
      responseFormat: 'json',
      timeoutMs: 25000
    });

    BillingGuard.assertZeroCost(response.usage, this.adapter.modelConfig, this.billingMode);

    const semVal = SemanticValidator.validateIntentResponse(response.text);

    const rawCmd = semVal.parsedCommand || {};
    return {
      contractVersion: 1,
      commandId: `cmd_${Date.now()}`,
      actorId: (input.projection.observer as any).characterId || input.projection.observer.observerId || 'player',
      action: rawCmd.action || 'UNKNOWN',
      targetId: rawCmd.targetId || undefined,
      objectId: rawCmd.objectId || undefined,
      locationId: rawCmd.locationId || undefined,
      magnitude: rawCmd.magnitude || undefined,
      stance: rawCmd.stance || 'NEUTRAL',
      constraints: [],
      confidence: rawCmd.confidence ?? (semVal.jsonValid ? 0.9 : 0.0),
      ambiguity: rawCmd.ambiguity || [],
      requiresClarification: Boolean(rawCmd.requiresClarification) || !semVal.schemaValid
    };
  }

  async narrate(context: NarrativeContext): Promise<string> {
    const projection = toNarrativeProjection(context.executionResult, context.scene);

    const promptParts: string[] = [
      `FATOS AUTORIZADOS DA PROJEÇÃO DIEGÉTICA:`,
      `Desfecho: ${projection.outcome.toUpperCase()}`,
      `Sujeito/Ator: ${projection.subject}`,
      `Local: ${projection.location || 'Fortaleza'}`,
      `Eventos Observáveis:\n${projection.visibleEvents.map(e => `  • ${e.description}`).join('\n') || '  • As ordens foram cumpridas.'}`
    ];

    if (projection.authoritativeFacts.length > 0) {
      promptParts.push(`Fatos Conhecidos:\n${projection.authoritativeFacts.map(f => `  • ${f}`).join('\n')}`);
    }

    if (projection.sensoryContext) {
      const sens = projection.sensoryContext;
      const sensDetails = [
        sens.region ? `Região: ${sens.region}` : null,
        sens.season ? `Estação: ${sens.season}` : null,
        sens.environment ? `Terreno: ${sens.environment}` : null
      ].filter(Boolean);
      if (sensDetails.length > 0) {
        promptParts.push(`Contexto Factual do Mundo: ${sensDetails.join(' | ')}`);
      }
    }

    promptParts.push(`\nDiretriz: Escreva a narrativa literária concisa para o soberano em tom de Crônica de Ferro (1 a 2 parágrafos).`);
    const prompt = promptParts.join('\n');

    const response = await this.adapter.generate({
      systemPrompt: `Você é o Narrador do Sistema e a voz dos Conselheiros da Fortaleza em 'Age of Shattered Oaths' (Crônica de Ferro).
Você recebe estritamente fatos autorizados pela Projeção Narrativa e sua função é transformá-los em crônica imersiva, realista e concisa.
SILÊNCIO MECÂNICO ABSOLUTO:
1. NUNCA cite termos de sistema, variáveis numéricas, moedas exatas, "SD", "FSU", "AC", "XP", "DC", "dados", "rolagem" ou status técnicos.
2. NUNCA invente fatos materiais, acontecimentos ou baixas fora dos fatos autorizados recebidos.`,
      userPrompt: prompt,
      temperature: 0.7,
      timeoutMs: 25000
    });

    BillingGuard.assertZeroCost(response.usage, this.adapter.modelConfig, this.billingMode);

    // Run narrative judge validation
    const judgment = NarrativeJudge.judge(response.text, context, context.executionResult);
    if (judgment.violations.length > 0) {
      console.warn(`[UnifiedNarrativeLLM] Narrative validation warnings: ${judgment.violations.join('; ')}`);
    }

    return response.text;
  }

  async narrateIncident(request: any): Promise<any> {
    const facts = request.mechanicalFacts?.mutationsSummary?.join('; ') || 'Sem mutações extraordinárias.';
    const prompt = `RELATÓRIO DETERMINÍSTICO DE INCIDENTE:
Tipo: ${request.kind}
Evento: ${request.mechanicalFacts?.eventType || 'Evento'} (${request.mechanicalFacts?.domain || 'Geral'})
Fatos Mecânicos: ${facts}
Região: ${request.environmentContext?.regionName || 'Região'}, Clima: ${request.environmentContext?.weatherDescription || 'Severo'}

Escreva a crônica do incidente em tom de Crônica de Ferro (1 a 2 parágrafos curtos, conciso, sóbrio):`;

    const response = await this.adapter.generate({
      systemPrompt: `Você é o Narrador do Sistema em 'Age of Shattered Oaths' (Crônica de Ferro).
Transforme os fatos mecânicos do incidente em narrativa visceral, realista e sombria.
Silêncio Mecânico Absoluto: NUNCA mencione termos de regras, dados, deltas numéricos explícitos com sinal matemático ou código.`,
      userPrompt: prompt,
      temperature: 0.7,
      timeoutMs: 25000
    });

    BillingGuard.assertZeroCost(response.usage, this.adapter.modelConfig, this.billingMode);

    return {
      narration: response.text,
      source: 'LLM'
    };
  }
}
