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

const DEFAULT_MODEL = 'gemini-3.6-flash';
const CANDIDATE_MODELS = ['gemini-3.6-flash'];
const DEFAULT_TIMEOUT_MS = 6000;

const SYSTEM_PROMPT = `Você é o Narrador do Sistema e a voz dos Conselheiros da Fortaleza em 'Age of Shattered Oaths' (seguindo o Protocolo Narrativo da Crônica de Ferro).
Sua função é transformar os resultados das ordens e as perguntas do soberano em crônicas narrativas imersivas, densas, viscerais e dinâmicas.

DIRETRIZES FUNDAMENTAIS (PROTOCOLO NARRATIVO PARTE 122):
1. SILÊNCIO MECÂNICO: O jogador NUNCA deve ver dados numéricos brutos, fórmulas, nomes de regras ou siglas estatísticas (SD, FSU, AC, XP, DC, rolagens de dados). Traduza cada perda ou ganho em impacto sensorial e físico:
   - Exemplo: em vez de "-50 moedas", descreva "os baús de ferro da tesouraria soando mais vazios e o peso da prata gasta ecoando nos corredores".
2. VERDADE MECÂNICA: Narre estritamente o que foi computado e autorizado pelo relatório da Engine. Nunca invente baixas inexistentes, nunca adicione encontros não gerados e nunca distorça o desfecho recebido.
3. ESTILO LITERÁRIO (CRÔNICA DE FERRO):
   - Escreva em tom frio, realista, visceral, sombrio e medieval em Português do Brasil (1 a 2 parágrafos densos).
   - Dê vida aos personagens presentes (como conselheiros, intendentes ou sargentos da tropa), fazendo-os falar ou agir com peso dramático.
4. RESPOSTA PRECISA ÀS CONSULTAS DO JOGADOR:
   - Se o jogador fez uma pergunta direta (ex: quem são seus homens de confiança, conselheiros, aliados, ou sobre o terreno), responda de forma direta e nominal citando os personagens e detalhes presentes em "Atores Presentes" e "Fatos e Memórias Relevantes".
5. RETORNO DE AGÊNCIA CONTEXTUAL (CONTEXTUAL QUESTION RULE):
   - Nunca termine com perguntas genéricas vazias como "O que deseja fazer?".
   - Encerre a resposta ancorando quem está diante do jogador, qual é o estado da cena e qual decisão imediata os oficiais aguardam.`;

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
  "action": "RECRUIT" | "BUILD" | "TRAVEL" | "TRADE" | "DIPLOMACY" | "ESPIONAGE" | "MILITARY" | "SOCIAL" | "INTRIGUE" | "EXPLORATION" | "CRAFT" | "INFORMATION" | "FLAVOR_QUERY" | "UNKNOWN",
  "targetId": string | null,
  "objectId": string | null,
  "locationId": string | null,
  "magnitude": { "mode": "FIXED" | "ENGINE_DETERMINED", "value"?: number } | null,
  "stance": "AGGRESSIVE" | "CAUTIOUS" | "DIPLOMATIC" | "DECEPTIVE" | "HONORABLE" | "NEUTRAL",
  "requiresClarification": boolean,
  "ambiguity": string[]
}

REGRAS DE CLASSIFICAÇÃO:
- Perguntas a conselheiros (ex: Mara, Ren), consultas sobre fronteiras, ameaças, hostilidades, situação do povo, dúvidas de regras ou conselhos devem ser classificadas como "INFORMATION" ou "FLAVOR_QUERY" com requiresClarification = false.
- Ações de recrutamento militar -> "RECRUIT".
- Construção de muralhas, paliçadas ou estruturas -> "BUILD".
- Deslocamento de tropas ou viagens -> "TRAVEL".
- Comércio ou compra/venda de mantimentos -> "TRADE".
- Apenas intenções completamente incoerentes ou ilegíveis devem ser "UNKNOWN".

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

    // 5. INFORMATION / COUNSELOR DIALOGUE / SITUATION / EXPLORATION
    if (
      /\?/.test(playerInput) ||
      /mara|ren|baldur|roric|gerold|aldren|conselh|chancel|marechal|senhor|lorde/i.test(normalized) ||
      /fronteir|hosti|ameac|ameaç|perig|batedor|patrulh|guarda|acao|ação|passo|atencao|atenção|demanda|moviment/i.test(normalized) ||
      /avaliar|situacao|situação|diplomacia|inimig|necessidade|povo|popula|como estamos|o que fazer|relatorio|relatório|inform|quanto custa|qual o custo|como funciona|how much|qual regra|quem|como|onde|qual|quando|por que|porque|o que|quais/i.test(normalized)
    ) {
      return {
        contractVersion: NARRATIVE_CONTRACT_VERSION,
        commandId: createDeterministicCommandId('player', 'INFORMATION', playerInput),
        actorId: 'player',
        action: 'INFORMATION',
        desiredOutcome: 'dialogar com conselheiros e consultar o estado das fronteiras e do feudo',
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
      const actorNames = context.actors && context.actors.length > 1
        ? context.actors.filter(a => a.actorId !== 'player').map(a => `${a.name} (${a.role})`).join(', ')
        : 'Mara (Conselheira de Chancelaria) e o Marechal Ren (Comandante de Armas)';

      return `Vossos oficiais e homens de confiança perfilam-se ao vosso lado em ${loc}. Vossos conselheiros diretos são: ${actorNames}. Sob o sopro ${weather} de ${reg}, os vigias mantêm os olhos atentos nas trilhas e os homens de armas aguardam vossa próxima diretriz soberana.`;
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
