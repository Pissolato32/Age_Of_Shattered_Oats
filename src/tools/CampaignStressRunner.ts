import 'dotenv/config';
import { createInitialState, resolveNarrativeCommand, resolveWeeklyTurn } from '../engine';
import { runNarrativeCycle } from '../lib/narrativeCycle';
import { GeminiNarrativeLLM } from '../lib/geminiNarrativeLLM';
import { PLAYER_OBSERVER } from '../../tests/fixtures/narrativeSlice.fixtures';
import { CampaignState } from '../types';

export interface StressTurnInput {
  turn: number;
  category: string;
  input: string;
  advanceWeekBefore?: boolean;
  stateMutator?: (state: CampaignState) => void;
}

export const CAMPAIGN_STRESS_TURNS: StressTurnInput[] = [
  // FASE 1: ABERTURA, CONSELHO E ESTABILIDADE INICIAL
  {
    turn: 1,
    category: 'Consulta Factual Inicial',
    input: 'Quem são meus conselheiros de confiança e como está a segurança em Fenwick?'
  },
  {
    turn: 2,
    category: 'Consulta de Recursos Abundantes',
    input: 'Quanto de prata e grãos temos disponíveis nos cofres e celeiros?'
  },
  {
    turn: 3,
    category: 'Recrutamento de Tropa Regular',
    input: 'Gerold, convoque 20 homens entre os camponeses para reforçar nossa linha de lanças.'
  },
  {
    turn: 4,
    category: 'Construção Multi-turno (Início)',
    input: 'Tobin, ordene que os carpinteiros comecem a erguer uma nova paliçada de troncos ao redor do acampamento.'
  },
  {
    turn: 5,
    category: 'Espionagem e Patrulha Territorial',
    input: 'Roric, envie batedores em direção aos passos da floresta para vigiar o movimento de salteadores.'
  },

  // FASE 2: TRANSIÇÃO ECONÔMICA E PRESSÃO (TIGHT)
  {
    turn: 6,
    category: 'Virada Semanal e Consumo',
    advanceWeekBefore: true,
    input: 'Como amanheceu o feudo esta semana e como estão nossas provisões?'
  },
  {
    turn: 7,
    category: 'Comércio Regional',
    input: 'Compre 5 fardos de suprimentos dos mercadores de passagem para garantir a tropa.'
  },
  {
    turn: 8,
    category: 'Queda de Tesouraria (Pressão Moderada)',
    stateMutator: (state) => {
      state.weeklyLedger.silverdew = 120; // Entra em TIGHT
    },
    input: 'Gerold, abra os livros: quanta prata ainda temos para pagar os soldos dos guardas?'
  },
  {
    turn: 9,
    category: 'Silêncio Político / Deliberação',
    input: '...'
  },
  {
    turn: 10,
    category: 'Ação Plausível de Infraestrutura',
    input: 'Aloque 15 homens para reparar a estrada de madeira e drenar a lama ao redor dos portões.'
  },

  // FASE 3: CRISE CRÍTICA (CRITICAL), FOME E SOLDOS ATRASADOS
  {
    turn: 11,
    category: 'Crise de Fome e Tesouro Baixo',
    advanceWeekBefore: true,
    stateMutator: (state) => {
      state.weeklyLedger.silverdew = 35; // CRITICAL
      state.weeklyLedger.food = 0.5; // CRITICAL
      state.weeklyLedger.famineTicks = 1;
      state.weeklyLedger.unpaidWagesTicks = 1;
    },
    input: 'Qual é o estado da nossa comida e por que os soldados estão murmurando no pátio?'
  },
  {
    turn: 12,
    category: 'Tentativa de Racionamento de Emergência',
    input: 'Gerold, imponha racionamento estrito nos celeiros e prometa aos soldados que o soldo virá na próxima lua.'
  },
  {
    turn: 13,
    category: 'Interrupção por Conflito e Tensão Iminente',
    stateMutator: (state) => {
      state.worldLedger.activeConflicts = [
        {
          conflict: 'Incursão hostil de incursores na fronteira de Fenwick',
          sides: 'Bandos Sem Estandarte vs Stormcrest',
          startDate: 'Semana 3, Thawtide',
          status: 'Active'
        }
      ];
    },
    input: 'Toquem os sinos de alerta! O que os sentinelas avistaram na linha das árvores?'
  },
  {
    turn: 14,
    category: 'Defesa e Postura Militar',
    input: 'Roric, posicione nossos arqueiros nas fundações da muralha e mantenha as lanças em formação fechada!'
  },
  {
    turn: 15,
    category: 'Resolução da Ameaça e Triagem',
    stateMutator: (state) => {
      state.worldLedger.activeConflicts = [];
    },
    input: 'Os incursores recuaram para as colinas. Alguém em nossa companhia tombou ou foi ferido?'
  },

  // FASE 4: RECUPERAÇÃO, DIPLOMACIA E FOG OF WAR
  {
    turn: 16,
    category: 'Diplomacia com Casa Nobre Vizinha',
    input: 'Tobin, redija uma missiva para a Casa Vance propondo termos de pacto de não agressão.'
  },
  {
    turn: 17,
    category: 'Pergunta sobre Segredos Fora do Fog of War',
    input: 'Roric, quais são os planos secretos mais profundos do Rei na Capital distante?'
  },
  {
    turn: 18,
    category: 'Descoberta de Segredo Autorizado',
    stateMutator: (state) => {
      if (state.worldSecrets && state.worldSecrets[0]) {
        state.worldSecrets[0].revealed = true;
      }
    },
    input: 'Roric, que informações nossos espiões conseguiram confirmar sobre os nobres da região?'
  },
  {
    turn: 19,
    category: 'Conclusão de Obras (Upgrade de Tier)',
    stateMutator: (state) => {
      state.holdings.fortification.tier = 2;
    },
    input: 'Mestre Robert, os carpinteiros finalizaram as estacas e os portões de ferro?'
  },
  {
    turn: 20,
    category: 'Consolidação e Estado Final da Campanha',
    input: 'Reúnam-se todos ao redor da mesa. Qual é o relatório geral dos nossos domínios em Fenwick hoje?'
  }
];

async function runCampaignStressTest() {
  console.log('======================================================================');
  console.log('🛡️ M17: STRESS TEST DE GAMEPLAY EMERGENTE (CAMPANHA REAL COM GEMINI)');
  console.log('======================================================================\n');

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ ERRO: GEMINI_API_KEY não configurada no ambiente!');
    process.exit(1);
  }

  const llm = new GeminiNarrativeLLM({ apiKey });
  let currentState: CampaignState = createInitialState('Landless', 'Florestas do Rio');
  currentState.character.title = 'Capitão Errante';
  currentState.character.location.landmark = 'Fenwick';
  currentState.advisors = {
    counselorName: 'Tobin',
    stewardName: 'Gerold',
    spyMasterName: 'Roric'
  };
  currentState.weeklyLedger.silverdew = 450;
  currentState.weeklyLedger.food = 10.0;
  currentState.weeklyLedger.materials = { timber: 120, stone: 60, iron: 30 };

  const summaryResults: Array<{
    turn: number;
    category: string;
    input: string;
    action: string;
    status: string;
    sceneState: string;
    treasuryTier: string;
    foodTier: string;
    narrativePreview: string;
    latencyMs: number;
  }> = [];

  for (const turnDef of CAMPAIGN_STRESS_TURNS) {
    console.log(`\n----------------------------------------------------------------------`);
    console.log(`▶️ TURNO ${turnDef.turn} [${turnDef.category}]`);

    if (turnDef.advanceWeekBefore) {
      console.log(`⏳ Avançando virada semanal mecânica (resolveWeeklyTurn)...`);
      currentState = resolveWeeklyTurn(currentState).updatedState;
    }

    if (turnDef.stateMutator) {
      console.log(`⚡ Aplicando mutação de estresse de estado...`);
      turnDef.stateMutator(currentState);
    }

    console.log(`👤 JOGADOR: "${turnDef.input}"`);
    console.log(`⏳ Processando pelo ciclo narrativo completo...`);

    const start = Date.now();
    try {
      const cycleResult = await runNarrativeCycle({
        playerInput: turnDef.input,
        state: currentState,
        observer: PLAYER_OBSERVER,
        llm
      });
      const latencyMs = Date.now() - start;

      currentState = cycleResult.resultState;

      const report = cycleResult.report;
      const sceneState = cycleResult.context.scene.sceneState || 'Resolved';

      const treasuryFact = cycleResult.projection.knownFacts.find(f => f.factId === 'fact_treasury_standing')?.statement || '';
      const foodFact = cycleResult.projection.knownFacts.find(f => f.factId === 'fact_food_standing')?.statement || '';

      const treasuryTier = treasuryFact.match(/Situação do Tesouro:\s*(\w+)/)?.[1] || 'UNKNOWN';
      const foodTier = foodFact.match(/Situação dos Mantimentos:\s*(\w+)/)?.[1] || 'UNKNOWN';

      console.log(`⏱️ Tempo: ${latencyMs}ms | Ação: [${report.actionExecuted}] | Status: [${report.status}] | Cena: [${sceneState}]`);
      console.log(`📊 Recursos: Tesouro=[${treasuryTier}] | Alimentos=[${foodTier}]`);
      console.log(`\n📜 RESPOSTA DA IA (MESTRE):\n"${cycleResult.narrative}"\n`);

      summaryResults.push({
        turn: turnDef.turn,
        category: turnDef.category,
        input: turnDef.input,
        action: report.actionExecuted,
        status: report.status,
        sceneState,
        treasuryTier,
        foodTier,
        narrativePreview: cycleResult.narrative.substring(0, 120).replace(/\n/g, ' ') + '...',
        latencyMs
      });
    } catch (err: any) {
      console.error(`❌ ERRO NO TURNO ${turnDef.turn}:`, err?.message || err);
    }
  }

  console.log('\n======================================================================');
  console.log('📊 CONSOLIDAÇÃO DA BATERIA DE ESTRESSE DE GAMEPLAY (M17)');
  console.log('======================================================================\n');
  console.table(summaryResults.map(r => ({
    Turno: r.turn,
    Categoria: r.category,
    Ação: r.action,
    Status: r.status,
    Cena: r.sceneState,
    Tesouro: r.treasuryTier,
    Alimentos: r.foodTier,
    Tempo: `${r.latencyMs}ms`
  })));
}

runCampaignStressTest().catch(console.error);
