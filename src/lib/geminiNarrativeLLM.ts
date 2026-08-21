import { NarrativeLLM, InterpretInput } from './narrativeLLM';
import {
  NarrativeContext,
  NarrativeCommand,
  NARRATIVE_CONTRACT_VERSION
} from './narrativeContracts';

export interface GeminiConfig {
  readonly apiKey?: string;
  readonly modelId?: string;
  readonly timeoutMs?: number;
  readonly fetchFn?: typeof fetch;
}

const DEFAULT_MODEL = 'gemini-1.5-pro-latest';
const DEFAULT_TIMEOUT_MS = 15000;

const SYSTEM_PROMPT = `Você é o Narrador do Sistema em 'Age of Shattered Oaths'.
Sua função é transformar relatórios mecânicos estritamente autorizados pelo Engine determinístico em crônicas narrativas imersivas e concisas.

DIRETRIZES FUNDAMENTAIS:
1. SILÊNCIO MECÂNICO: Nunca mencione números brutos, nomes de atributos (AC, XP, SD, DC), fórmulas ou rolagens.
2. VERDADE MECÂNICA: Narre apenas o que consta explicitamente em Consequências Físicas e Alterações de Estado. Não invente mortes, baixas ou reveses adicionais.
3. CONCISÃO: Responda em no máximo 1 a 2 parágrafos.
4. TOM NARRATIVO: Escreva em tom de crônica de ferro gélida, realista, visceral, sombria e implacável. Sem exageros poéticos desnecessários ou floreios mágicos. Use português do Brasil, em 1 ou 2 parágrafos curtos.`;

function createDeterministicCommandId(actorId: string, action: string, inputString: string): string {
  let hash = 0;
  for (let i = 0; i < inputString.length; i++) {
    hash = (hash * 31 + inputString.charCodeAt(i)) >>> 0;
  }
  return `cmd_${actorId}_${action.toLowerCase()}_${hash.toString(16)}`;
}

export class GeminiNarrativeLLM implements NarrativeLLM {
  readonly providerId = 'gemini';
  readonly modelId: string;
  private readonly apiKey: string | undefined;
  private readonly timeoutMs: number;
  private readonly fetchFn: typeof fetch;

  constructor(config: GeminiConfig = {}) {
    this.apiKey = config.apiKey || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined);
    this.modelId = config.modelId || DEFAULT_MODEL;
    this.timeoutMs = config.timeoutMs || DEFAULT_TIMEOUT_MS;
    this.fetchFn = config.fetchFn || (typeof fetch !== 'undefined' ? fetch : (undefined as never));
  }

  async interpret(input: InterpretInput): Promise<NarrativeCommand> {
    if (!this.apiKey || !this.fetchFn) {
      return this.fallbackInterpret(input.playerInput);
    }

    try {
      const prompt = `Analise a entrada do jogador no jogo 'Age of Shattered Oaths' e extraia a intenção estruturada em JSON seguindo rigorosamente o esquema:
{
  "action": "RECRUIT" | "BUILD" | "TRAVEL" | "TRADE" | "CRAFT" | "INFORMATION" | "FLAVOR_QUERY" | "THREAT" | "INVESTIGATE" | "UNKNOWN",
  "targetId": string | null,
  "objectId": string | null,
  "locationId": string | null,
  "magnitude": { "mode": "FIXED" | "ENGINE_DETERMINED", "value"?: number } | null,
  "stance": "AGGRESSIVE" | "CAUTIOUS" | "DIPLOMATIC" | "DECEPTIVE" | "HONORABLE" | "NEUTRAL",
  "requiresClarification": boolean,
  "ambiguity": string[]
}

Entrada do jogador: "${input.playerInput}"
Responda APENAS com o JSON válido, sem comentários ou markdown.`;

      const responseText = await this.callGemini(prompt);
      const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      const action = parsed.action || 'UNKNOWN';

      return {
        contractVersion: NARRATIVE_CONTRACT_VERSION,
        commandId: createDeterministicCommandId('player', action, input.playerInput),
        actorId: 'player',
        action,
        targetId: parsed.targetId || undefined,
        objectId: parsed.objectId || undefined,
        locationId: parsed.locationId || undefined,
        magnitude: parsed.magnitude || undefined,
        stance: parsed.stance || 'NEUTRAL',
        constraints: [],
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.9,
        ambiguity: Array.isArray(parsed.ambiguity) ? parsed.ambiguity : [],
        requiresClarification: Boolean(parsed.requiresClarification)
      };
    } catch {
      return this.fallbackInterpret(input.playerInput);
    }
  }

  async narrate(context: NarrativeContext): Promise<string> {
    if (!this.apiKey || !this.fetchFn) {
      return this.fallbackNarrate(context);
    }

    try {
      const actorsList = context.actors && context.actors.length > 0
        ? context.actors.map(a => `${a.name} (${a.role})`).join(', ')
        : 'Nenhum NPC proeminente presente';
      const factsList = context.knownFacts && context.knownFacts.length > 0
        ? context.knownFacts.map(f => f.statement).join('; ')
        : 'Nenhum fato relevante adicional';
      const eventsList = context.recentEvents && context.recentEvents.length > 0
        ? context.recentEvents.map(e => `[Semana ${e.week}] ${e.summary}`).join('; ')
        : 'Nenhum evento recente registrado';
      const circumstancesList = context.scene.immediateCircumstances && context.scene.immediateCircumstances.length > 0
        ? context.scene.immediateCircumstances.join('; ')
        : 'Nenhuma circunstância extraordinária';

      const prompt = `${SYSTEM_PROMPT}

CONTEXTO AUTORIZADO DO MOTOR:
Local: ${context.scene.locationId} (${context.scene.regionName})
Clima: ${context.scene.weather}, Estação: ${context.scene.season}
Atores Presentes: ${actorsList}
Circunstâncias em Andamento: ${circumstancesList}
Fatos e Memórias Relevantes: ${factsList}
Eventos Recentes Observáveis: ${eventsList}
Status da Ação: ${context.executionResult.status}
Ação Executada: ${context.executionResult.actionExecuted}
Motivo/Código: ${context.executionResult.reasonCode}
Alterações de Estado Concretas: ${JSON.stringify(context.executionResult.stateChanges)}
Consequências Físicas: ${JSON.stringify(context.executionResult.consequences)}

Escreva a crônica narrativa do resultado para o jogador em 1 ou 2 parágrafos concisos em tom de crônica de ferro, concluindo com o estado presente para a condução da cena:`;

      return await this.callGemini(prompt);
    } catch {
      return this.fallbackNarrate(context);
    }
  }

  private async callGemini(prompt: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelId}:generateContent?key=${this.apiKey}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await this.fetchFn(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        throw new Error(`Gemini API HTTP Error: ${res.status}`);
      }

      const data = await res.json() as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('Empty response from Gemini API');
      }

      return text.trim();
    } finally {
      clearTimeout(timer);
    }
  }

  private fallbackInterpret(playerInput: string): NarrativeCommand {
    const normalized = ` ${playerInput.trim().toLowerCase()} `;
    const quantityMatch = /\b(\d+)\b/.exec(playerInput);
    const quantity = quantityMatch ? parseInt(quantityMatch[1], 10) : undefined;

    // 1. RECRUIT
    if (/recrut|soldad|infantaria|recruit/i.test(normalized)) {
      return {
        contractVersion: NARRATIVE_CONTRACT_VERSION,
        commandId: createDeterministicCommandId('player', 'RECRUIT', playerInput),
        actorId: 'player',
        action: 'RECRUIT',
        magnitude: quantity ? { mode: 'FIXED', value: quantity } : { mode: 'ENGINE_DETERMINED' },
        constraints: [],
        confidence: 0.85,
        ambiguity: [],
        requiresClarification: false
      };
    }

    // 2. BUILD
    if (/constru|palisad|palisade|muralha|pedra|stone/i.test(normalized)) {
      const structure = /palisad|palisade/.test(normalized)
        ? 'palisade'
        : /muralha|pedra|stone/.test(normalized)
          ? 'stone_wall'
          : undefined;

      if (structure === undefined) {
        return {
          contractVersion: NARRATIVE_CONTRACT_VERSION,
          commandId: createDeterministicCommandId('player', 'BUILD', playerInput),
          actorId: 'player',
          action: 'BUILD',
          constraints: [],
          confidence: 0.6,
          ambiguity: ['estrutura a construir não identificada'],
          requiresClarification: true
        };
      }

      return {
        contractVersion: NARRATIVE_CONTRACT_VERSION,
        commandId: createDeterministicCommandId('player', 'BUILD', playerInput),
        actorId: 'player',
        action: 'BUILD',
        objectId: structure,
        desiredOutcome: `construir ${structure === 'palisade' ? 'palisada de madeira' : 'muralha de pedra'}`,
        constraints: [],
        confidence: 0.9,
        ambiguity: [],
        requiresClarification: false
      };
    }

    // 3. TRAVEL
    if (/viajar|marchar|viagem|travel|march/i.test(normalized)) {
      return {
        contractVersion: NARRATIVE_CONTRACT_VERSION,
        commandId: createDeterministicCommandId('player', 'TRAVEL', playerInput),
        actorId: 'player',
        action: 'TRAVEL',
        locationId: 'Central Plains',
        constraints: [],
        confidence: 0.85,
        ambiguity: [],
        requiresClarification: false
      };
    }

    // 4. TRADE
    if (/comprar|vender|trocar|comercio|comércio|buy|sell/i.test(normalized)) {
      const goods = ['mantimentos', 'comida', 'madeira', 'ferro', 'pedra', 'racao', 'ração'].find(g =>
        normalized.includes(g)
      );

      return {
        contractVersion: NARRATIVE_CONTRACT_VERSION,
        commandId: createDeterministicCommandId('player', 'TRADE', playerInput),
        actorId: 'player',
        action: 'TRADE',
        objectId: goods ?? 'mantimentos',
        constraints: [],
        confidence: 0.85,
        ambiguity: [],
        requiresClarification: false
      };
    }

    // 5. INFORMATION
    if (/quanto custa|qual o custo|como funciona|how much|qual regra/i.test(normalized)) {
      return {
        contractVersion: NARRATIVE_CONTRACT_VERSION,
        commandId: createDeterministicCommandId('player', 'INFORMATION', playerInput),
        actorId: 'player',
        action: 'INFORMATION',
        constraints: [],
        confidence: 0.9,
        ambiguity: [],
        requiresClarification: false
      };
    }

    return {
      contractVersion: NARRATIVE_CONTRACT_VERSION,
      commandId: createDeterministicCommandId('player', 'UNKNOWN', playerInput),
      actorId: 'player',
      action: 'UNKNOWN',
      constraints: [],
      confidence: 0.5,
      ambiguity: [],
      requiresClarification: false
    };
  }

  private fallbackNarrate(context: NarrativeContext): string {
    const report = context.executionResult;
    if (report.status === 'REJECTED') {
      return `A ordem não foi executada pelos intendentes: ${report.reasonCode}`;
    }
    return `A resolução foi selada conforme registrado nos livros de ferro da campanha.`;
  }
}
