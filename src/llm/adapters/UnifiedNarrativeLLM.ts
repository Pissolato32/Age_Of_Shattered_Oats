import { NarrativeLLM, InterpretInput } from '../../lib/narrativeLLM';
import { NarrativeCommand, NarrativeContext } from '../../lib/narrativeContracts';
import { LLMAdapter } from './LLMAdapter';
import { GeminiAdapter } from './GeminiAdapter';
import { OpenRouterAdapter } from './OpenRouterAdapter';
import { HuggingFaceAdapter } from './HuggingFaceAdapter';
import { OpenCodeAdapter } from './OpenCodeAdapter';
import { MockAdapter } from './MockAdapter';
import { ModelRegistry } from '../registry/ModelRegistry';
import { ModelConfig, LLMProviderId } from '../contracts/LLMContract';
import { BillingGuard, BillingMode } from '../validators/BillingGuard';
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
    const config = options.modelConfig || registry.getModelByProvider(options.provider) || {
      id: `${options.provider}-default`,
      provider: options.provider,
      model: 'default',
      freePolicy: 'free-tier',
      maxCost: 0,
      enabled: true
    };

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
      actorId: input.projection.observer.characterId || 'player',
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
    const sanitizedReport = NarrativeReportSanitizer.sanitize(context.executionResult);

    const prompt = `CONTEXTO AUTORIZADO DO MOTOR:
Local: ${context.scene.locationId} (${context.scene.regionName})
Atores Presentes: ${context.actors.map(a => `${a.name} (${a.role})`).join(', ')}
Status da Resolução: ${sanitizedReport.outcome.status}
Desfecho da Ordem: ${sanitizedReport.outcome.explanation}
Consequências Físicas: ${sanitizedReport.facts.stateChanges.map(c => c.qualitativeImpact).join('; ') || 'Nenhum impacto material extraordinário.'}

Escreva a resposta concisa e sóbria para o soberano em tom de Crônica de Ferro (1 a 2 parágrafos curtos):`;

    const response = await this.adapter.generate({
      systemPrompt: `Você é o Narrador do Sistema e a voz dos Conselheiros da Fortaleza em 'Age of Shattered Oaths' (Crônica de Ferro).
Transforme os resultados mecânicos autorizados em crônicas narrativas imersivas, viscerais, realistas e CONCISAS.
Silêncio Mecânico Absoluto: NUNCA cite moedas abreviadas, "SD", "FSU", "AC", "XP", "DC", "dados", "rolagem", "RNG" ou código.`,
      userPrompt: prompt,
      temperature: 0.7,
      timeoutMs: 25000
    });

    BillingGuard.assertZeroCost(response.usage, this.adapter.modelConfig, this.billingMode);

    // Run narrative judge validation
    const judgment = NarrativeJudge.judge(response.text, context, sanitizedReport);
    if (judgment.violations.length > 0) {
      console.warn(`[UnifiedNarrativeLLM] Narrative validation warnings: ${judgment.violations.join('; ')}`);
    }

    return response.text;
  }
}
