import { NarrativeLLM, InterpretInput } from '../../lib/narrativeLLM';
import { NarrativeCommand, NarrativeContext } from '../../lib/narrativeContracts';
import { toNarrativeProjection } from '../../lib/narrativeProjection';
import { LLMAdapter } from './LLMAdapter';
import { GeminiAdapter } from './GeminiAdapter';
import { OpenRouterAdapter } from './OpenRouterAdapter';
import { HuggingFaceAdapter } from './HuggingFaceAdapter';
import { OpenCodeAdapter } from './OpenCodeAdapter';
import { GroqAdapter } from './GroqAdapter';
import { MockAdapter } from './MockAdapter';
import { ModelRegistry } from '../registry/ModelRegistry';
import { ModelConfig, LLMProviderId } from '../contracts/LLMContract';
import { BillingGuard, BillingGuardError, BillingMode } from '../validators/BillingGuard';
import { SemanticValidator, ALL_VALID_ACTIONS } from '../validators/SemanticValidator';
import { NarrativeJudge } from '../validators/NarrativeJudge';
import { NarrativeReportSanitizer } from '../contracts/NarrativeExecutionReport';
import { resolveNarrativeCategory, ACTION_NARRATIVE_BUDGETS } from '../validators/NarrativeQualityEvaluator';

export interface UnifiedNarrativeLLMOptions {
  provider: LLMProviderId;
  apiKey?: string;
  modelConfig?: ModelConfig;
  billingMode?: BillingMode;
}

export class UnifiedNarrativeLLM implements NarrativeLLM {
  readonly providerId: LLMProviderId;
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
      case 'groq':
        this.adapter = new GroqAdapter(config, apiKey);
        break;
      case 'mock':
      default:
        this.adapter = new MockAdapter(config);
        break;
    }
  }

  async interpret(input: InterpretInput): Promise<NarrativeCommand> {
    let prompt: string;
    let retrievedSection = '';
    if (input.retrievedContext && input.retrievedContext.length > 0) {
      const formattedItems = input.retrievedContext.map(record => {
        if ('importance' in record) {
          return `  • [Memória]: ${record.description}${record.subjectId ? ` (Sujeito: ${record.subjectId})` : ''}`;
        } else {
          return `  • [Conhecimento]: ${record.factId} = ${typeof record.value === 'object' ? JSON.stringify(record.value) : record.value}`;
        }
      });
      retrievedSection = `ENTIDADES E CONTEXTO CONHECIDOS PELO OBSERVADOR:\n${formattedItems.join('\n')}\nUtilize este contexto estritamente para identificar alvos ('targetId'), locais ('locationId') e objetos ('objectId') mencionados pelo jogador.\n\n`;
    }

    if (input.clarificationContext) {
      // Clarification flow: include full context for re-interpretation
      const ctx = input.clarificationContext;
      prompt = `${retrievedSection}CONTEXTO DA SESSÃO DE ESCLARECIMENTO

ORIGINAL DO JOGADOR: "${ctx.originalInput}"

INTENÇÃO PROPOSTA: ${ctx.proposedCommand.action}
${ctx.proposedCommand.ambiguity.length > 0 ? `AMBIGUIDADES: ${ctx.proposedCommand.ambiguity.join(', ')}` : ''}

PERGUNTA DO MESTRE: "${ctx.masterQuestion}"

RESPOSTA DO JOGADOR: "${ctx.playerAnswer}"
${ctx.selectedOption ? `OPÇÃO SELECIONADA: ${ctx.selectedOption}` : ''}

TAREFA: Reavaliar a intenção original utilizando a resposta do jogador como esclarecimento.
Não reinterprete a resposta isoladamente. Considere o contexto completo.

RETORNE APENAS JSON.`;
    } else {
      // Normal flow
      prompt = `${retrievedSection}Analise a entrada do jogador abaixo e retorne o JSON de intenção:\n\n<PLAYER_INPUT>\n${input.playerInput}\n</PLAYER_INPUT>`;
    }

    const response = await this.adapter.generate({
      systemPrompt: `Você é o Classificador de Intenções de Age of Shattered Oaths.
Responda APENAS com JSON estruturado contendo 'action', 'targetId', 'objectId', 'locationId', 'magnitude', 'stance', 'confidence', 'requiresClarification', 'ambiguity'.

AÇÕES PERMITIDAS (o campo 'action' DEVE ser rigorosamente uma destas):
- 'RECRUIT': alistar ou contratar soldados, tropas, lanceiros, arqueiros.
- 'BUILD': construir, reparar ou fortificar estruturas, paliçadas, muralhas, torres.
- 'TRAVEL': marchar, viajar ou mover forças para outra região ou fortaleza.
- 'TRADE': comprar, vender ou negociar mercadorias, provisões, madeira, ferro, pedra.
- 'DIPLOMACY': enviar cartas, emissários, redigir acordos, sondar intenções, propor alianças ou tréguas.
- 'ESPIONAGE': enviar espiões, infiltrar agentes, investigar segredos rivais nas sombras.
- 'MILITARY': operações táticas ativas no campo, exercícios de combate, patrulhas armadas.
- 'INFORMATION': consultar conselheiros, inspecionar estado da guarnição, celeiros, muralhas, relatórios ou finanças.
- 'UNKNOWN': comandos não suportados pelo motor ou comandos de controle da interface (como avançar turno/salvar jogo).

REGRAS RÍGIDAS:
1. NUNCA invente ações como 'order', 'inspect', 'talk' ou 'end_turn'.
2. Se o jogador pedir para inspecionar guarnição, consultar estado do feudo ou pedir relatório a um conselheiro, classifique como 'INFORMATION'.
3. Se o jogador pedir para avançar turno ou passar o tempo, classifique como 'UNKNOWN' com ambiguity: ["Comando de sistema: use o controle de Virar Semana da interface"].
4. O campo 'action' deve estar sempre em letras maiúsculas.
5. DURANTE ESCLARECIMENTO: Você DEVE manter a ação proposta ('action') e utilizar a resposta do jogador para preencher os parâmetros que faltavam (ex: 'targetId', 'locationId', 'objectId', 'magnitude'). NUNCA troque arbitrariamente para uma ação não relacionada. Se o jogador cancelar expressamente ou a resposta for vazia/inconclusiva, defina 'action': 'UNKNOWN'.`,
      userPrompt: prompt,
      temperature: 0.0,
      responseFormat: 'json',
      timeoutMs: 25000
    });

    BillingGuard.assertZeroCost(response.usage, this.adapter.modelConfig, this.billingMode);

    const semVal = SemanticValidator.validateIntentResponse(response.text);
    const rawCmd = semVal.parsedCommand || {};
    const rawAction = typeof rawCmd.action === 'string' ? rawCmd.action.trim().toUpperCase() : 'UNKNOWN';
    let canonicalAction = ALL_VALID_ACTIONS.has(rawAction as any) ? (rawAction as any) : 'UNKNOWN';
    let requiresClarification = Boolean(rawCmd.requiresClarification) || !semVal.schemaValid;
    let ambiguity = rawCmd.ambiguity || [];

    // Drift Guard: durante esclarecimento, a ação deve manter a proposta ou falhar para UNKNOWN
    if (input.clarificationContext) {
      const expectedAction = input.clarificationContext.proposedCommand.action;
      if (canonicalAction !== expectedAction && canonicalAction !== 'UNKNOWN') {
        canonicalAction = 'UNKNOWN';
        requiresClarification = false;
        ambiguity = ['Ação divergente durante esclarecimento'];
      }
    }

    return {
      contractVersion: 1,
      commandId: `cmd_${Date.now()}`,
      actorId: (input.projection.observer as any).characterId || input.projection.observer.observerId || 'player',
      action: canonicalAction,
      targetId: rawCmd.targetId || undefined,
      objectId: rawCmd.objectId || undefined,
      locationId: rawCmd.locationId || undefined,
      magnitude: rawCmd.magnitude || undefined,
      desiredOutcome: rawCmd.desiredOutcome || input.playerInput,
      stance: rawCmd.stance || 'NEUTRAL',
      constraints: [],
      confidence: rawCmd.confidence ?? (semVal.jsonValid ? 0.9 : 0.0),
      ambiguity,
      requiresClarification
    };
  }

  async narrate(context: NarrativeContext, compressionInstruction?: string): Promise<string> {
    const projection = toNarrativeProjection(context.executionResult, context.scene);

    const action = context.executionResult?.actionExecuted;
    const status = context.executionResult?.status;
    const category = resolveNarrativeCategory(action, status);
    const budget = ACTION_NARRATIVE_BUDGETS[category] || ACTION_NARRATIVE_BUDGETS.DEFAULT;

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

    if (context.retrievedMemories && context.retrievedMemories.length > 0) {
      const memoryLines = context.retrievedMemories.map(m => `  • [Lembrança]: ${m.description}`);
      promptParts.push(`MEMÓRIA EVOCADA DO OBSERVADOR:\n${memoryLines.join('\n')}`);
    }

    if (context.retrievedKnowledge && context.retrievedKnowledge.length > 0) {
      const knowledgeLines = context.retrievedKnowledge.map(k => `  • [Fato Registrado]: ${k.factId}: ${typeof k.value === 'object' ? JSON.stringify(k.value) : k.value}`);
      promptParts.push(`CONHECIMENTO ESTABELECIDO:\n${knowledgeLines.join('\n')}`);
    }

    if (context.relationships && context.relationships.length > 0) {
      const relLines = context.relationships.map(r => `  • Relação com ${r.targetActorId}: postura/opinião ${r.knownOpinion !== undefined && r.knownOpinion >= 0 ? '+' : ''}${r.knownOpinion ?? 0}`);
      promptParts.push(`RELAÇÕES POLÍTICAS CONHECIDAS:\n${relLines.join('\n')}`);
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

    const hasDispatchedLetter = projection.visibleEvents.some(e => e.description.includes('despachad') || e.description.includes('mensagem formal') || e.description.includes('termos de sondagem'));
    if (hasDispatchedLetter) {
      promptParts.push(`\nPROIBIÇÃO RIGOROSA DE FANFICTION E ANTECIPAÇÃO TEMPORAL:
Você está expressamente proibido de avançar no tempo além do momento atual.
NÃO descreva a chegada do mensageiro ao destino.
NÃO descreva nenhuma conversa com a corte destinatária.
NÃO descreva banquetes, reuniões, recepção de comitiva nem aceitação da proposta.
Descreva APENAS a conselheira Mara redigindo o pergaminho e o mensageiro partindo a cavalo pelos portões da fortaleza.`);
    }

    if (context.executionResult?.answerStatus === 'NO_AUTHORIZED_INFORMATION') {
      promptParts.push(`\nFRONTEIRA EPISTÊMICA: NENHUMA INFORMAÇÃO AUTORIZADA
Não há dados ou batedores com notícias sobre esta questão no momento.
Você DEVE declarar incerteza sóbria e desconhecimento (ex: 'Nenhum mensageiro ou batedor trouxe notícias...', 'As brumas cobrem os vales distantes e nada se sabe com certeza...').
NUNCA invente números de soldados, detalhes ou conspirações sob desconhecimento.`);
    }

    promptParts.push(`\nDISCIPLINA NARRATIVA E BUDGET OBRIGATÓRIO:
- Categoria: ${category}
- TETO MÁXIMO RIGOROSO: escreva entre ${budget.targetWords[0]} e ${budget.targetWords[1]} palavras. NUNCA ultrapasse ${budget.hardMaxWords - 10} palavras. Respostas prolixas serão sumariamente rejeitadas.
- Parágrafos: exatamente ${budget.maxParagraphs} parágrafo(s), com ${budget.idealSentences[0]} a ${budget.idealSentences[1]} frases assertivas.
- PROIBIÇÃO DE CLICHÊS DE ABERTURA: NUNCA inicie com "O vento frio/gélido...", "Sob o céu cinzento...", "As sombras se alongam...", ou "Com o peso de antigos juramentos...". Vá DIRETO aos fatos da fortaleza.`);

    if (compressionInstruction) {
      promptParts.push(`\nINSTRUÇÃO OBRIGATÓRIA DE COMPRESSÃO:
${compressionInstruction}`);
    }

    promptParts.push(`\nDiretriz: Escreva a narrativa literária concisa para o soberano em tom de Crônica de Ferro.`);
    promptParts.push(`IDIOMA OBRIGATÓRIO: Responda exclusivamente em Português do Brasil (pt-BR).`);
    const prompt = promptParts.join('\n');

    // Calculate maxTokens guard rail based on category budget
    const maxTokens = category === 'REJECTION' ? 120 : (category === 'DIPLOMACY' || category === 'INFORMATION' ? 220 : 160);

    const response = await this.adapter.generate({
      systemPrompt: `Você é o Narrador do Sistema e a voz dos Conselheiros da Fortaleza em 'Age of Shattered Oaths' (Crônica de Ferro).
Você recebe estritamente fatos autorizados pela Projeção Narrativa e sua função é transformá-los em crônica imersiva, realista e concisa.
IDIOMA OBRIGATÓRIO:
Escreva SEMPRE E EXCLUSIVAMENTE em Português do Brasil (pt-BR). É terminantemente proibido responder em inglês ou misturar idiomas.
SILÊNCIO MECÂNICO ABSOLUTO:
1. NUNCA cite termos de sistema, variáveis numéricas, moedas exatas, "SD", "FSU", "AC", "XP", "DC", "dados", "rolagem" ou status técnicos.
2. NUNCA invente fatos materiais, acontecimentos ou baixas fora dos fatos autorizados recebidos.
3. Se o desfecho for REJECTED, narre a recusa baseando-se estritamente no motivo informado nos fatos autorizados. NUNCA invente derrotas militares, cansaço fictício ou escassez de suprimentos inexistente se isso não constar expressamente nos fatos autorizados.
4. Para envio de mensagens ou cartas diplomáticas, narre EXCLUSIVAMENTE a redação do pergaminho e a partida do mensageiro. NUNCA narre chegada à corte vizinha, recepção, resposta, banquete ou tratado aceito na mesma virada.
5. Se houver lembranças ou memórias evocadas do observador, você pode tecer conexões narrativas e callbacks sóbrios no diálogo ou ambiente, SEM JAMAIS contradizer ou inventar lembranças fora do contexto fornecido.
6. FRONTEIRAS EPISTÊMICAS:
- Fato Observado: afirme com certeza direta o que consta nos eventos observáveis.
- Informação Recuperada: apresente lembranças como reminiscências sóbrias do passado. NUNCA invente falsas memórias.
- Inferência Permitida: conselheiros podem opinar ou deduzir com moderação, deixando claro que é uma dedução.
- Rumor: apresente relatos incertos de terceiros como incerteza ("dizem viajantes nas estradas...").
- Desconhecimento: se o status for NO_AUTHORIZED_INFORMATION ou sob névoa de guerra, declare que nada se sabe ao certo. NUNCA preencha a incerteza com fatos imaginários.
7. IMUTABILIDADE: Sua função é puramente derivativa e de tradução sensorial. Você não altera o estado do mundo nem seus recursos materiais.
8. CONCISÃO E DISCIPLINA NARRATIVA (NAR-002):
- Comunique APENAS o acontecimento factual imediato.
- Respeite o teto de palavras da categoria e não ultrapasse o número de parágrafos.
- Elimine preâmbulos ornamentais e metáforas vazias.`,
      userPrompt: prompt,
      temperature: 0.6,
      maxTokens,
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

Escreva a crônica do incidente em tom de Crônica de Ferro (1 a 2 parágrafos curtos, conciso, sóbrio) exclusivamente em Português do Brasil:`;

    const response = await this.adapter.generate({
      systemPrompt: `Você é o Narrador do Sistema em 'Age of Shattered Oaths' (Crônica de Ferro).
Transforme os fatos mecânicos do incidente em narrativa visceral, realista e sombria.
IDIOMA OBRIGATÓRIO: Escreva exclusivamente em Português do Brasil (pt-BR).
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
