import 'dotenv/config';
import { createInitialState, buildObserverProjection } from '../engine';
import { runNarrativeCycle } from '../lib/narrativeCycle';
import { GeminiNarrativeLLM } from '../lib/geminiNarrativeLLM';
import { PLAYER_OBSERVER } from '../../tests/fixtures/narrativeSlice.fixtures';
import { CampaignState } from '../types';

async function runLiveGameplaySession() {
  console.log('======================================================================');
  console.log('🎮 INICIANDO SESSÃO DE TESTE REAL DE GAMEPLAY COM A LLM (GEMINI AO VIVO)');
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
  currentState.weeklyLedger.silverdew = 500;
  currentState.weeklyLedger.materials = { timber: 150, stone: 80, iron: 40 };

  const playerTurns = [
    {
      turn: 1,
      name: 'Consulta e Contexto com Conselheiros',
      input: 'Quem são meus homens de confiança aqui em Fenwick e como está a segurança das nossas terras?'
    },
    {
      turn: 2,
      name: 'Recrutamento de Tropa',
      input: 'Gerold, convoque 15 homens leais entre os camponeses para reforçar nossa patrulha.'
    },
    {
      turn: 3,
      name: 'Ordem de Construção / Obras',
      input: 'Tobin, comece a erguer imediatamente uma paliçada de madeira ao redor do acampamento para nos proteger de ataques noturnos.'
    },
    {
      turn: 4,
      name: 'Silêncio Deliberado / Tensão Política',
      input: '...'
    },
    {
      turn: 5,
      name: 'Consulta de Recursos (Silêncio Mecânico)',
      input: 'Quanto de prata e mantimentos ainda nos resta nos cofres e celeiros?'
    },
    {
      turn: 6,
      name: 'Espionagem e Investigação',
      input: 'Roric, envie nossos batedores para vigiar a fronteira norte e descobrir se há tropas de senhores rivais marchando em nossa direção.'
    }
  ];

  const results: Array<{
    turn: number;
    name: string;
    input: string;
    action: string;
    status: string;
    narrative: string;
    latencyMs: number;
  }> = [];

  for (const pt of playerTurns) {
    console.log(`\n----------------------------------------------------------------------`);
    console.log(`▶️ TURNO ${pt.turn} [${pt.name}]`);
    console.log(`👤 JOGADOR: "${pt.input}"`);
    console.log(`⏳ Processando pelo ciclo de execução e narrador Gemini...`);

    const start = Date.now();
    try {
      const cycleResult = await runNarrativeCycle({
        playerInput: pt.input,
        state: currentState,
        observer: PLAYER_OBSERVER,
        llm
      });
      const latencyMs = Date.now() - start;

      currentState = cycleResult.resultState;

      console.log(`⏱️ Tempo de resposta: ${latencyMs}ms`);
      console.log(`⚙️ Resolução Mecânica: Ação [${cycleResult.report.actionExecuted}] | Status [${cycleResult.report.status}]`);
      console.log(`\n📜 RESPOSTA DA IA (MESTRE):\n`);
      console.log(`"${cycleResult.narrative}"\n`);

      results.push({
        turn: pt.turn,
        name: pt.name,
        input: pt.input,
        action: cycleResult.report.actionExecuted,
        status: cycleResult.report.status,
        narrative: cycleResult.narrative,
        latencyMs
      });
    } catch (err: any) {
      console.error(`❌ Erro no Turno ${pt.turn}:`, err?.message || err);
    }
  }

  console.log('======================================================================');
  console.log('📊 SESSÃO CONCLUÍDA — GERANDO AVALIAÇÃO CRÍTICA DO JOGADOR');
  console.log('======================================================================\n');
}

runLiveGameplaySession().catch(console.error);
