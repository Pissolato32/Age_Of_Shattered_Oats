import { NarrativeLLM, InterpretInput } from '../../lib/narrativeLLM';
import { NarrativeCommand, NarrativeContext } from '../../lib/narrativeContracts';
import { interpretIntentHeuristically } from '../../lib/intentHeuristics';
import { RandomService } from '../../core/RandomService';
import {
  resolveNarrativeCategory,
  ACTION_NARRATIVE_BUDGETS,
  FORBIDDEN_CLICHE_PATTERNS
} from '../../llm/validators/NarrativeQualityEvaluator';

const MECHANICAL_TEMPLATES = [
  'Os carpinteiros do feudo concluíram o assentamento das vigas de carvalho nas muralhas externas de Grey Keep. A guarda da fortaleza mantém vigília constante sobre o vale enquanto os novos reforços de madeira são calafetados contra a geada da estação fria.',
  'Mestres de obras fincaram as estacas reforçadas ao longo de toda a vala de contenção do perímetro norte. Nenhum incidente foi relatado pelos sentinelas durante o assentamento da paliçada defensiva que agora resguarda o fosso.',
  'A infantaria regular organizou a linha de sentinelas após o término das obras nas fortificações principais. Os celeiros e os armazéns de ferramentas permanecem guardados dia e noite por lanceiros veteranos da guarnição.',
  'Trabalhadores e soldados ergueram a paliçada com troncos pesados cortados na floresta próxima à fortaleza. A defesa do pátio interno foi restabelecida com êxito pelos artesãos sem qualquer contestação nas fronteiras.',
  'O reforço da muralha exterior foi finalizado pelos carpinteiros sob supervisão direta do conselho de Grey Keep. As ordens do senhor foram cumpridas à risca e registradas nos livros de ferro da campanha.'
];

const COMMERCE_TEMPLATES = [
  'Os mercadores da caravana aceitaram os termos de troca no pátio dos celeiros de Grey Keep. A carga de grãos e provisões foi descarregada e conferida sob fiscalização atenta dos intendentes da campanha.',
  'A compra de mantimentos e ferramentas de forja foi selada antes do cair da noite. Os registros de despesas foram arquivados nos livros da tesouraria sem nenhuma discrepância no pagamento acordado.',
  'Carroças de suprimentos descarregaram fardos de comida e tecidos nos armazéns centrais da fortaleza. O intendente contabilizou as moedas despendidas e garantiu a guarda dos fardos estocados.'
];

const DIPLOMACY_TEMPLATES = [
  'A conselheira Mara redigiu a mensagem formal selada com a cera de vossa linhagem nas mesas do conselho. O emissário de confiança partiu a cavalo pelos portões do vale levando vossas propostas aos nobres vizinhos.\n\nSentinelas no alto da torre acompanharam a cavalgada até o cavaleiro desaparecer entre as colinas cinzentas da fronteira.',
  'O cavaleiro de escol recebeu o pergaminho lacrado e tomou a estrada principal rumo à corte vizinha. Nenhum batedor hostil foi avistado nos passos montanhosos durante a partida da comitiva.\n\nO conselho aguardará o desenrolar das semanas vindouras em silêncio cauteloso e vigilância reforçada.',
  'As cartas de sondagem foram confiadas aos batedores mais experientes da guarnição de Grey Keep. A pequena comitiva transpôs os limites do feudo sob céu fechado e marcha rápida para evitar emboscadas.'
];

const INFORMATION_TEMPLATES = [
  'Os intendentes abriram os livros de registros e confirmaram as provisões armazenadas nos celeiros de Grey Keep. A guarnição e as defesas permanecem exatamente nos padrões reportados pelas rondas matinais da semana.',
  'O conselheiro prestou contas detalhadas das divisas e do estado das patrulhas que percorrem as estradas do feudo. As tropas mantêm prontidão regular e nenhum destacamento inimigo foi avistado nas cercanias.'
];

const REJECTION_TEMPLATES = [
  'A ordem não pôde ser cumprida pelos intendentes: os recursos exigidos não estavam disponíveis nos cofres e celeiros de Grey Keep no momento da deliberação do conselho.',
  'As sentinelas suspenderam a execução da ordem: os requisitos materiais da campanha não foram satisfeitos conforme os registros detalhados dos livros de ferro do feudo.',
  'O conselho declarou a ordem suspensa temporariamente: as reservas da fortaleza não comportavam os gastos exigidos para esta empreitada nas semanas de inverno rigoroso.'
];

export class SimulationNarrativeLLM implements NarrativeLLM {
  readonly providerId = 'simulation' as const;
  readonly modelId = 'simulation-v1';
  private rng: RandomService;

  public regenerationCount = 0;
  public initialClicheCount = 0;
  public initialProlixCount = 0;

  constructor(rng?: RandomService) {
    this.rng = rng || new RandomService(42);
  }

  async interpret(input: InterpretInput): Promise<NarrativeCommand> {
    const text = typeof input === 'string' ? input : input.playerInput;
    return interpretIntentHeuristically(text);
  }

  async narrate(context: NarrativeContext, compressionInstruction?: string): Promise<string> {
    const action = context.executionResult?.actionExecuted;
    const status = context.executionResult?.status;
    const category = resolveNarrativeCategory(action, status);

    // If handling a concise regeneration request (Attempt 2)
    if (compressionInstruction && compressionInstruction.includes('REGENERAÇÃO CONCISA:')) {
      this.regenerationCount++;
      const roll = this.rng.next();
      if (roll < 0.02) {
        // 2% persistent failure to test fallback trigger
        return 'O vento gélido sopra eternamente pelas terras vazias de Grey Keep enquanto o reino se afoga em prolixidade interminável.';
      }
      // 98% clean, concise response adhering to target words (15-25 words)
      return 'Os intendentes registraram as ordens concluídas nos livros de ferro da fortaleza sem novos incidentes.';
    }

    // Normal generation with controlled stress injection (Attempt 1)
    const roll = this.rng.next();

    // Injeção de estresse 1: Clichê de abertura (~2.5% dos turnos)
    if (roll < 0.025) {
      this.initialClicheCount++;
      return 'O vento gélido sopra contra as pedras de Grey Keep enquanto dez homens guarnecem as muralhas sob a geada.';
    }

    // Injeção de estresse 2: Prolixidade (> hard max words, ~3.5% dos turnos)
    if (roll >= 0.025 && roll < 0.06) {
      this.initialProlixCount++;
      return 'O reino estende-se vasto pelas colinas intermináveis de Grey Keep enquanto os senhores de terras distantes observam com cautela redobrada as decisões emanadas da corte principal. Os homens de armas, endurecidos por incontáveis invernos rigorosos e batalhas sangrentas no desfiladeiro cinzento, reúnem-se no pátio lamacento para discutir as ordens recebidas dos conselheiros que ainda guardam o peso dos velhos juramentos solenes de lealdade eterna à coroa desfeita, esperando que as fundações de madeira e pedra resistam ao cerco futuro dos bárbaros e das casas rivais que marcham em segredo sob a névoa fria da manhã sombria que nunca parece terminar nestas terras abandonadas pelos deuses antigos.';
    }

    // Geração normal concisa e perfeitamente dentro do Target Range (~94% dos turnos)
    let pool: readonly string[];
    switch (category) {
      case 'MECHANICAL':
        pool = MECHANICAL_TEMPLATES;
        break;
      case 'COMMERCE':
        pool = COMMERCE_TEMPLATES;
        break;
      case 'DIPLOMACY':
        pool = DIPLOMACY_TEMPLATES;
        break;
      case 'INFORMATION':
        pool = INFORMATION_TEMPLATES;
        break;
      case 'REJECTION':
        pool = REJECTION_TEMPLATES;
        break;
      default:
        pool = MECHANICAL_TEMPLATES;
        break;
    }

    const idx = this.rng.nextInt(0, pool.length - 1);
    return pool[idx];
  }
}
