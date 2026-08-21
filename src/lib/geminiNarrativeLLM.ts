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

const DEFAULT_MODEL = 'gemini-2.5-flash';
const CANDIDATE_MODELS = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-flash-latest', 'gemini-2.0-flash'];
const DEFAULT_TIMEOUT_MS = 15000;

const SYSTEM_PROMPT = `Você é o Narrador do Sistema e a voz dos Conselheiros da Fortaleza em 'Age of Shattered Oaths'.
Sua função é transformar os resultados das ordens e as perguntas do soberano em crônicas narrativas imersivas, densas e vivas.

DIRETRIZES FUNDAMENTAIS:
1. SILÊNCIO MECÂNICO: Nunca mencione números brutos, nomes de atributos (AC, XP, SD, DC), fórmulas ou termos de regras. Transforme recursos em realidade física (prata em cofres, grãos em celeiros, moral dos homens).
2. VERDADE MECÂNICA: Respeite rigorosamente os fatos autorizados pelo motor. Não invente mortes, baixas ou desfechos contrários ao relatório.
3. CONCISÃO E IMPACTO: Responda em 1 a 2 parágrafos ricos e atmosféricos.
4. TOM NARRATIVO: Escreva em tom de crônica de ferro medieval gélida, visceral, realista e envolvente em Português do Brasil.
5. CONDUÇÃO DE CENA: Se o jogador pedir avaliação, conselho ou relatório, apresente a situação das fronteiras, defesas e o conselho dos intendentes, sugerindo os próximos passos táticos.`;

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
        : 'Mara (Conselheira de Chancelaria), Ren (Marechal de Armas)';
      const factsList = context.knownFacts && context.knownFacts.length > 0
        ? context.knownFacts.map(f => f.statement).join('; ')
        : 'Fronteiras sob vigilância e ledgers em ordem';
      const eventsList = context.recentEvents && context.recentEvents.length > 0
        ? context.recentEvents.map(e => `[Semana ${e.week}] ${e.summary}`).join('; ')
        : 'Nenhum combate recente';
      const circumstancesList = context.scene.immediateCircumstances && context.scene.immediateCircumstances.length > 0
        ? context.scene.immediateCircumstances.join('; ')
        : 'Rotina de inverno e guarda ativa nas ameias';

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
    const modelsToTry = [this.modelId, ...CANDIDATE_MODELS.filter(m => m !== this.modelId)];
    
    let lastError: Error | null = null;
    for (const model of modelsToTry) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
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
          throw new Error(`Gemini API Error with model ${model}: HTTP ${res.status}`);
        }

        const data = await res.json() as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim().length > 0) {
          return text.trim();
        }
      } catch (err: any) {
        lastError = err;
        continue;
      } finally {
        clearTimeout(timer);
      }
    }

    throw lastError || new Error('All Gemini model endpoints failed');
  }

  private fallbackInterpret(playerInput: string): NarrativeCommand {
    const normalized = ` ${playerInput.trim().toLowerCase()} `;
    const quantityMatch = /\b(\d+)\b/.exec(playerInput);
    const quantity = quantityMatch ? parseInt(quantityMatch[1], 10) : undefined;

    // 1. RECRUIT
    if (/recrut|soldad|infantaria|homens|tropa|convo/i.test(normalized)) {
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
    if (/constru|palisad|palisade|muralha|pedra|stone|erguer|oficina|torre/i.test(normalized)) {
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
    if (/viajar|marchar|viagem|travel|march|deslocar|ir para/i.test(normalized)) {
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
    if (/comprar|vender|trocar|comercio|comércio|buy|sell|caravana|mercado/i.test(normalized)) {
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

    // 5. INFORMATION / SITUATION / ADVICE / EXPLORATION
    if (/avaliar|situacao|situação|diplomacia|inimig|necessidade|povo|popula|conselh|como estamos|o que fazer|relatorio|relatório|inform|quanto custa|qual o custo|como funciona|how much|qual regra/i.test(normalized)) {
      return {
        contractVersion: NARRATIVE_CONTRACT_VERSION,
        commandId: createDeterministicCommandId('player', 'INFORMATION', playerInput),
        actorId: 'player',
        action: 'INFORMATION',
        desiredOutcome: 'avaliar a situação geral, defesas, povo e conselho de Estado',
        constraints: [],
        confidence: 0.95,
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
    const loc = context.scene.locationId || 'a fortaleza';
    const reg = context.scene.regionName || 'as terras feudais';
    const weather = context.scene.weather ? context.scene.weather.toLowerCase() : 'frio';

    if (report.status === 'REJECTED') {
      if (report.reasonCode.includes('esclarecimento')) {
        return `Vossos conselheiros em ${loc} solicitam maiores detalhes antes de mobilizar os homens: qual ordem exata deseja expedir?`;
      }
      return `A ordem não pôde ser executada pelos intendentes em ${loc}: ${report.reasonCode}. Os recursos foram preservados.`;
    }

    // Rich procedural narrative based on action executed
    if (report.actionExecuted === 'INFORMATION' || report.actionExecuted === 'UNKNOWN') {
      return `Mara e o Marechal Ren reúnem os pergaminhos sobre a mesa de carvalho em ${loc}. Sob o sopro ${weather} de ${reg}, as muralhas permanecem guarnecidas e as patrulhas vigiam os desfiladeiros. As casas nobres vizinhas mantêm uma paz cautelosa, enquanto os aldeões estocam lenha e grãos para resistir à estação.

O marechal aponta para o mapa: 'Senhor, nossas defesas estão firmes, mas as fronteiras exigem vigilância constante. Podemos recrutar mais combatentes, fortificar as muralhas com paliçadas ou enviar batedores para sondar movimentações rivais.' O conselho aguarda vossa diretriz.`;
    }

    if (report.actionExecuted === 'RECRUIT') {
      return `Novos homens atendem ao chamado senhorial em ${loc}. Revestidos com armaduras de couro batido e lanças afiadas, os recrutas prestam juramento no pátio sob o olhar severo dos veteranos. A guarda pessoal ganha novas fileiras prontas para defender as fronteiras.`;
    }

    if (report.actionExecuted === 'BUILD') {
      return `O som compassado de machados e martelos corta o ar gélido em ${loc}. Os carpinteiros e pedreiros concluem o reforço das estruturas defensivas. As novas paliçadas erguem-se firmes, elevando a segurança do feudo contra invasões e emboscadas.`;
    }

    if (report.actionExecuted === 'TRAVEL') {
      return `A comitiva de armas põe-se em marcha pelas estradas de pedra e lama. As bandeiras ondulam sob o vento e os vigias das aldeias locais saúdam a passagem de vossa escolta. A marcha conclui seu percurso com segurança.`;
    }

    if (report.actionExecuted === 'TRADE') {
      return `As carretas mercantis negociam as cargas no entreposto regional. O comércio é selado com aperto de mãos calejadas e os livros de contas da tesouraria registram as transações sob o selo de vossa Casa.`;
    }

    return `Vossas ordens foram executadas com rigor pelos servos e capitães em ${loc}. A disciplina reina sobre as propriedades e os conselheiros aguardam vosso próximo movimento.`;
  }
}
