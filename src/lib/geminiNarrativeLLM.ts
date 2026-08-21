import {
  NARRATIVE_CONTRACT_VERSION,
  NarrativeCommand,
  NarrativeContext,
  ObserverProjection
} from './narrativeContracts';
import { InterpretInput, NarrativeLLM } from './narrativeLLM';

export interface GeminiConfig {
  readonly apiKey?: string;
  readonly modelId?: string;
  readonly timeoutMs?: number;
  readonly fetchFn?: typeof fetch;
}

const DEFAULT_MODEL = 'gemini-2.5-flash';
const DEFAULT_TIMEOUT_MS = 15000;

const SYSTEM_PROMPT = `Você é o Sistema de Tradução Sensorial de 'Age of Shattered Oaths'. Sua única função é traduzir resultados mecânicos determinísticos exatos e secos em narrativas literárias imersivas em tom de crônica de ferro.

DIRETRIZES DE POST-PROCESSING:
1. SEPARAÇÃO E VERDADE MECÂNICA: A engine já calculou o resultado exato. Você NÃO cria novos reveses, não imagina encontros extras, não inventa baixas, não assume consequências adicionais e não altera o resultado sob nenhuma circunstância. O que não está no resultado da engine, não existe.
2. PROIBIÇÃO DE FANFICTION: Jamais invente números, baixas, mortes, materiais, tesouros ou eventos que não foram explicitamente fornecidos no resultado mecânico recebido. Siga estritamente os fatos fornecidos.
3. SILÊNCIO MECÂNICO: O jogador NUNCA vê dados técnicos (como moedas exatas, FSU, SD, AC, XP, dados de rolagens, nível, ou termos matemáticos de RPG) na sua narrativa. Transforme esses números secos em consequências e impactos sensoriais físicos.
4. TOM NARRATIVO: Escreva em tom de crônica de ferro gélida, realista, visceral, sombria e implacável. Sem exageros poéticos desnecessários ou floreios mágicos. Use português do Brasil, em 1 ou 2 parágrafos curtos.`;

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

      return {
        contractVersion: NARRATIVE_CONTRACT_VERSION,
        commandId: `cmd_gemini_${Date.now()}`,
        actorId: 'player',
        action: parsed.action || 'UNKNOWN',
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
      const prompt = `${SYSTEM_PROMPT}

CONTEXTO AUTORIZADO DO MOTOR:
Local: ${context.scene.locationId} (${context.scene.regionName})
Clima: ${context.scene.weather}, Estação: ${context.scene.season}
Status da Ação: ${context.executionResult.status}
Ação Executada: ${context.executionResult.actionExecuted}
Motivo/Código: ${context.executionResult.reasonCode}
Alterações de Estado Concretas: ${JSON.stringify(context.executionResult.stateChanges)}
Consequências Físicas: ${JSON.stringify(context.executionResult.consequences)}

Escreva a crônica narrativa do resultado para o jogador em 1 ou 2 parágrafos concisos:`;

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
    const isRecruit = /recrut|soldad|infantaria/i.test(normalized);
    const quantityMatch = /\b(\d+)\b/.exec(playerInput);
    const quantity = quantityMatch ? parseInt(quantityMatch[1], 10) : undefined;

    if (isRecruit) {
      return {
        contractVersion: NARRATIVE_CONTRACT_VERSION,
        commandId: `cmd_fallback_${Date.now()}`,
        actorId: 'player',
        action: 'RECRUIT',
        magnitude: quantity ? { mode: 'FIXED', value: quantity } : { mode: 'ENGINE_DETERMINED' },
        constraints: [],
        confidence: 0.8,
        ambiguity: [],
        requiresClarification: false
      };
    }

    return {
      contractVersion: NARRATIVE_CONTRACT_VERSION,
      commandId: `cmd_fallback_${Date.now()}`,
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
